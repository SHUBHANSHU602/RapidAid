const EmergencySession = require('../models/EmergencySession');
const { getSingleETA } = require('./mapsService');
const { getAvailableAmbulancesNear } = require('./ambulanceCache');
const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Main fallback orchestrator — runs levels 1-4 sequentially.
 * Short-circuits on first success.
 * @param {string} sessionId
 * @param {number} currentEta
 */
async function triggerFallback(sessionId, currentEta) {
  logger.info(`Fallback triggered: session ${sessionId} | currentEta: ${currentEta}min`);

  const session = await EmergencySession.findById(sessionId).lean();
  if (!session) {
    logger.warn(`Fallback: session ${sessionId} not found`);
    return;
  }

  // Level 1 — Reroute
  const l1 = await fallbackLevel1(session, currentEta);
  if (l1.improved) {
    logger.info(`Fallback L1 success: session ${sessionId} rerouted, new ETA ${l1.newEta}min`);
    return;
  }

  // Level 2 — Swap ambulance
  const l2 = await fallbackLevel2(session, currentEta);
  if (l2.improved) {
    logger.info(`Fallback L2 success: session ${sessionId} swapped to ambulance ${l2.newAmbulanceId}`);
    return;
  }

  // Level 3 + 4 — AI + Webhook (Day 22)
  logger.warn(`Fallback L1+L2 failed: session ${sessionId} — escalating to L3+L4`);
  await fallbackLevel3and4(session, currentEta);
}

// ── Level 1: Reroute ─────────────────────────────────────────────────────────
async function fallbackLevel1(session, currentEta) {
  try {
    // Get current driver location from Redis
    const locRaw = await redis.get(`ambulance:${session.ambulanceId}:location`);
    if (!locRaw) {
      logger.debug('Fallback L1: no driver location in Redis');
      return { improved: false };
    }

    const { latitude: dLat, longitude: dLng } = JSON.parse(locRaw);

    // Patient location — stored as { lat, lng } in your schema
    const pLat = session.location.lat;
    const pLng = session.location.lng;

    // Fresh ETA calculation
    const freshEta = await getSingleETA(dLat, dLng, pLat, pLng);

    // Only count as improvement if > 1 minute better
    if (freshEta < currentEta - 1) {
      // Update Redis ETA
      await redis.set(
        `session:${session._id}:eta`,
        JSON.stringify({ etaMinutes: freshEta, calculatedAt: new Date().toISOString() }),
        'EX', 90
      );

      // Write to eventLog
      const liveSession = await EmergencySession.findById(session._id);
      liveSession.addEvent('REROUTED', {
        previousEta: currentEta,
        newEta: freshEta,
      });
      await liveSession.save();

      // Emit to session room
      try {
        const { getIO } = require('../sockets/emergencyRoom');
        getIO().to(`session:${session._id}`).emit('route_updated', {
          sessionId: session._id,
          newEta: freshEta,
          message: 'Your ambulance has been rerouted for a faster arrival.',
        });
      } catch (e) {
        logger.warn('Fallback L1: socket emit failed', e.message);
      }

      return { improved: true, newEta: freshEta };
    }

    logger.debug(`Fallback L1: no improvement (fresh=${freshEta}min, current=${currentEta}min)`);
    return { improved: false };
  } catch (err) {
    logger.error('Fallback L1 error', err);
    return { improved: false };
  }
}

// ── Level 2: Swap Ambulance ──────────────────────────────────────────────────
async function fallbackLevel2(session, currentEta) {
  try {
    const pLat = session.location.lat;
    const pLng = session.location.lng;

    // Find available ambulances near patient
    const candidates = await getAvailableAmbulancesNear(pLat, pLng);

    // Exclude currently assigned ambulance
    const alternatives = candidates.filter(
      a => a._id.toString() !== session.ambulanceId.toString()
    );

    if (alternatives.length === 0) {
      logger.debug('Fallback L2: no alternative ambulances available');
      return { improved: false };
    }

    // Get ETAs for all alternatives in parallel
    const etaResults = await Promise.all(
      alternatives.map(async (amb) => {
        const locRaw = await redis.get(`ambulance:${amb._id}:location`);
        if (!locRaw) return null;
        const { latitude, longitude } = JSON.parse(locRaw);
        const eta = await getSingleETA(latitude, longitude, pLat, pLng);
        return { ambulance: amb, eta };
      })
    );

    const valid = etaResults.filter(Boolean);
    if (valid.length === 0) {
      logger.debug('Fallback L2: no ambulance location data available');
      return { improved: false };
    }

    // Find best alternative
    const best = valid.reduce((a, b) => a.eta < b.eta ? a : b);

    // Only swap if improvement > 2 minutes
    if (best.eta < currentEta - 2) {
      const liveSession = await EmergencySession.findById(session._id);

      const previousAmbulanceId = liveSession.ambulanceId;
      liveSession.ambulanceId = best.ambulance._id;
      liveSession.status = 'ASSIGNED';
      liveSession.addEvent('AMBULANCE_SWAPPED', {
        previousAmbulanceId,
        newAmbulanceId: best.ambulance._id,
        previousEta: currentEta,
        newEta: best.eta,
      });
      await liveSession.save();

      // Update Redis — old ambulance back to AVAILABLE, new one BUSY
      await redis.set(`ambulance:${previousAmbulanceId}:status`, 'AVAILABLE');
      await redis.sadd('ambulance:available', previousAmbulanceId.toString());
      await redis.set(`ambulance:${best.ambulance._id}:status`, 'BUSY');
      await redis.srem('ambulance:available', best.ambulance._id.toString());

      // Emit to session room
      try {
        const { getIO } = require('../sockets/emergencyRoom');
        getIO().to(`session:${session._id}`).emit('ambulance_swapped', {
          sessionId: session._id,
          newAmbulanceId: best.ambulance._id,
          newEta: best.eta,
          message: 'A closer ambulance has been assigned to you.',
        });
      } catch (e) {
        logger.warn('Fallback L2: socket emit failed', e.message);
      }

      return { improved: true, newAmbulanceId: best.ambulance._id };
    }

    logger.debug(`Fallback L2: best alternative ${best.eta}min not better enough vs current ${currentEta}min`);
    return { improved: false };
  } catch (err) {
    logger.error('Fallback L2 error', err);
    return { improved: false };
  }
}

// ── Level 3 + 4 placeholder (Day 22) ─────────────────────────────────────────
async function fallbackLevel3and4(session, currentEta) {
  const { generateDelayMessage } = require('./ai/fallbackMessageService');

  // ── Level 3: AI message ───────────────────────────────────────────────────
  try {
    // Calculate drift from eventLog
    const delayEvent = session.eventLog
      .slice()
      .reverse()
      .find(e => e.status === 'DELAYED');
    const drift = delayEvent?.meta?.drift || 0;

    const aiMessage = await generateDelayMessage(session, currentEta, drift);

    // Emit to session room
    try {
      const { getIO } = require('../sockets/emergencyRoom');
      getIO().to(`session:${session._id}`).emit('ai_suggestion', {
        sessionId: session._id,
        patientMessage: aiMessage.patientMessage,
        firstAidAction: aiMessage.firstAidAction,
      });
    } catch (e) {
      logger.warn('Fallback L3: socket emit failed', e.message);
    }

    // Write to eventLog
    const liveSession = await EmergencySession.findById(session._id);
    liveSession.addEvent('AI_SUGGESTION_SENT', {
      patientMessage: aiMessage.patientMessage,
      firstAidAction: aiMessage.firstAidAction,
    });
    await liveSession.save();

    logger.info(`Fallback L3 complete: session ${session._id}`);
  } catch (err) {
    logger.error('Fallback L3 error', err);
  }

  // ── Level 4: Hospital webhook ─────────────────────────────────────────────
  try {
    const Hospital = require('../models/Hospital');
    const hospital = session.hospitalId
      ? await Hospital.findById(session.hospitalId).lean()
      : null;

    const payload = {
      sessionId: session._id,
      emergencyType: session.emergencyType,
      severityLevel: session.severityLevel,
      patientLocation: session.location,
      ambulanceDelayed: true,
      currentEta,
      timestamp: new Date().toISOString(),
    };

    // Production: await fetch(hospital.webhookUrl, { method: 'POST', body: JSON.stringify(payload) })
    // Simulated here — log the payload
    logger.warn(`Fallback L4: hospital webhook triggered`, payload);

    const liveSession = await EmergencySession.findById(session._id);
    liveSession.addEvent('HOSPITAL_WEBHOOK_TRIGGERED', {
      hospitalId: session.hospitalId,
      payload,
    });
    await liveSession.save();

    logger.info(`Fallback L4 complete: session ${session._id}`);
  } catch (err) {
    logger.error('Fallback L4 error', err);
  }
}

module.exports = { triggerFallback };