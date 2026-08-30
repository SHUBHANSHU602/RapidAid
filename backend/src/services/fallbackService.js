const axios = require('axios');
const EmergencySession = require('../models/EmergencySession');
const Ambulance = require('../models/Ambulance');
const { getSingleETA } = require('./mapsService');
const { getAvailableAmbulancesNear } = require('./ambulanceCache');
const redis = require('../config/redis');
const logger = require('../utils/logger');

function emitToRoom(room, event, data) {
  try {
    const { getIO } = require('../sockets/emergencyRoom');
    getIO().to(room).emit(event, data);
  } catch (err) {
    logger.warn(`emitToRoom failed: ${room} ${event}`, err.message);
  }
}

function mapsLink(fromLat, fromLng, toLat, toLng) {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}

function getEscalationGraceSeconds() {
  if (process.env.FALLBACK_ESCALATION_SECONDS) return Number(process.env.FALLBACK_ESCALATION_SECONDS);
  return process.env.DEMO_MODE === 'true' ? 30 : 120;
}

function stageKey(sessionId) {
  return `session:${sessionId}:fallback_stage`;
}

function stageAtKey(sessionId) {
  return `session:${sessionId}:fallback_stage_at`;
}

async function setFallbackStage(sessionId, stage) {
  const pipeline = redis.pipeline();
  pipeline.set(stageKey(sessionId), stage, 'EX', 7200);
  pipeline.set(stageAtKey(sessionId), Date.now().toString(), 'EX', 7200);
  await pipeline.exec();
}

async function clearFallbackStage(sessionId) {
  await redis.del(stageKey(sessionId), stageAtKey(sessionId));
}

async function triggerFallback(sessionId, currentEta, context = {}) {
  const session = await EmergencySession.findById(sessionId).lean();
  if (!session || ['RESOLVED', 'CANCELLED'].includes(session.status)) return null;

  const stage = await redis.get(stageKey(sessionId));
  const reason = context.reason || [...(session.eventLog || [])]
    .reverse()
    .find((event) => event.status === 'DELAYED')?.meta?.reason || 'ETA_DRIFT';

  // Stage 1 always gives the current driver a reroute opportunity first.
  if (!stage) {
    const l1 = await fallbackLevel1(session, currentEta);
    if (l1.improved) {
      await clearFallbackStage(sessionId);
      return { stage: 'REROUTED', ...l1 };
    }

    await setFallbackStage(sessionId, 'REROUTE_SUGGESTED');
    logger.info(`Fallback stage REROUTE_SUGGESTED session=${sessionId}`);
    return { stage: 'REROUTE_SUGGESTED', improved: false };
  }

  if (stage === 'REROUTE_SUGGESTED') {
    const stageAt = Number(await redis.get(stageAtKey(sessionId))) || Date.now();
    const ageSeconds = Math.floor((Date.now() - stageAt) / 1000);
    const graceSeconds = getEscalationGraceSeconds();

    if (ageSeconds < graceSeconds) {
      logger.debug(`Fallback waiting after reroute session=${sessionId} ${ageSeconds}/${graceSeconds}s`);
      return { stage, waiting: true, ageSeconds, graceSeconds };
    }

    const l2 = await fallbackLevel2(session, currentEta, { stalled: reason === 'AMBULANCE_STALLED' });
    if (l2.improved) {
      await setFallbackStage(sessionId, 'AMBULANCE_SWAPPED');
      return { stage: 'AMBULANCE_SWAPPED', ...l2 };
    }

    await fallbackLevel3and4(session, currentEta);
    await setFallbackStage(sessionId, 'AI_AND_HOSPITAL_ESCALATED');
    logger.info(`Fallback stage AI_AND_HOSPITAL_ESCALATED session=${sessionId}`);
    return { stage: 'AI_AND_HOSPITAL_ESCALATED', improved: false };
  }

  // Prevent AI/webhook spam on every recurring delay check.
  return { stage, repeated: true };
}

async function fallbackLevel1(session, currentEta) {
  try {
    const locRaw = await redis.get(`ambulance:${session.ambulanceId}:location`);
    if (!locRaw) return { improved: false };

    const loc = JSON.parse(locRaw);
    const dLat = loc.lat ?? loc.latitude;
    const dLng = loc.lng ?? loc.longitude;
    const pLat = session.location.lat;
    const pLng = session.location.lng;
    const freshEta = await getSingleETA(dLat, dLng, pLat, pLng);
    const navigationUrl = mapsLink(dLat, dLng, pLat, pLng);

    const ambulance = await Ambulance.findById(session.ambulanceId).lean();
    const payload = {
      sessionId: session._id,
      currentEta,
      freshEta,
      navigationUrl,
      message: 'Delay detected. Re-open navigation for the latest traffic-aware route.',
    };

    if (ambulance?.driverId) {
      emitToRoom(`driver:${ambulance.driverId}`, 'reroute_suggested', payload);
    }
    emitToRoom(`session:${session._id}`, 'reroute_suggested', payload);

    const liveSession = await EmergencySession.findById(session._id);
    liveSession.addEvent('REROUTE_SUGGESTED', { previousEta: currentEta, freshEta, navigationUrl });

    if (freshEta < currentEta - 1) {
      await redis.set(
        `session:${session._id}:eta`,
        JSON.stringify({ etaMinutes: freshEta, calculatedAt: new Date().toISOString() }),
        'EX', 90
      );
      liveSession.status = 'EN_ROUTE';
      liveSession.addEvent('REROUTED', { previousEta: currentEta, newEta: freshEta });
      await liveSession.save();

      emitToRoom(`session:${session._id}`, 'session_status_changed', {
        sessionId: session._id,
        oldStatus: 'DELAYED',
        newStatus: 'EN_ROUTE',
      });
      emitToRoom(`session:${session._id}`, 'route_updated', {
        sessionId: session._id,
        newEta: freshEta,
        navigationUrl,
        message: 'A faster route is available for the current ambulance.',
      });
      return { improved: true, newEta: freshEta };
    }

    await liveSession.save();
    return { improved: false, freshEta, navigationUrl };
  } catch (err) {
    logger.error(`Fallback L1 error: ${err.message}`);
    return { improved: false };
  }
}

async function reserveReplacement(ambulanceId) {
  const id = ambulanceId.toString();
  const lua = `
    local status = redis.call('GET', KEYS[1])
    if status ~= 'AVAILABLE' then return 0 end
    if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 0 then return 0 end
    if redis.call('SISMEMBER', KEYS[3], ARGV[1]) == 0 then return 0 end
    redis.call('SET', KEYS[1], 'BUSY')
    redis.call('SREM', KEYS[2], ARGV[1])
    return 1
  `;
  return (await redis.eval(
    lua,
    3,
    `ambulance:${id}:status`,
    'ambulance:available',
    'ambulance:online',
    id
  )) === 1;
}

async function releaseReplacement(ambulanceId) {
  const id = ambulanceId.toString();
  const pipeline = redis.pipeline();
  pipeline.set(`ambulance:${id}:status`, 'AVAILABLE');
  pipeline.sadd('ambulance:available', id);
  await pipeline.exec();
}

async function fallbackLevel2(session, currentEta, { stalled = false } = {}) {
  try {
    const pLat = session.location.lat;
    const pLng = session.location.lng;
    const candidates = await getAvailableAmbulancesNear(pLat, pLng);
    const alternatives = candidates.filter((a) => a.ambulanceId.toString() !== session.ambulanceId.toString());

    if (!alternatives.length) {
      logger.info(`Fallback L2: no replacement ambulances online for session=${session._id}`);
      return { improved: false };
    }

    const etaResults = (await Promise.all(alternatives.map(async (amb) => {
      const raw = await redis.get(`ambulance:${amb.ambulanceId}:location`);
      if (!raw) return null;
      const loc = JSON.parse(raw);
      const lat = loc.lat ?? loc.latitude;
      const lng = loc.lng ?? loc.longitude;
      const eta = await getSingleETA(lat, lng, pLat, pLng);
      return { ambulanceId: amb.ambulanceId, eta };
    }))).filter(Boolean).sort((a, b) => a.eta - b.eta);

    for (const candidate of etaResults) {
      // ETA drift requires a genuinely faster vehicle. A confirmed stalled vehicle is
      // unreliable, so a similarly-close replacement is still useful.
      const qualifies = stalled
        ? candidate.eta <= Math.max(Number(currentEta) + 1, 2)
        : candidate.eta < Number(currentEta) - 2;

      if (!qualifies) continue;
      if (!(await reserveReplacement(candidate.ambulanceId))) continue;

      const liveSession = await EmergencySession.findById(session._id);
      if (!liveSession || ['RESOLVED', 'CANCELLED'].includes(liveSession.status)) {
        await releaseReplacement(candidate.ambulanceId);
        return { improved: false };
      }

      const previousAmbulanceId = liveSession.ambulanceId;
      const [oldAmbulance, newAmbulance] = await Promise.all([
        Ambulance.findById(previousAmbulanceId),
        Ambulance.findById(candidate.ambulanceId),
      ]);

      if (!newAmbulance) {
        await releaseReplacement(candidate.ambulanceId);
        continue;
      }

      liveSession.ambulanceId = candidate.ambulanceId;
      liveSession.status = 'ASSIGNED';
      liveSession.addEvent('AMBULANCE_SWAPPED', {
        previousAmbulanceId,
        newAmbulanceId: candidate.ambulanceId,
        previousEta: currentEta,
        newEta: candidate.eta,
        reason: stalled ? 'CURRENT_AMBULANCE_STALLED' : 'FASTER_REPLACEMENT',
      });

      if (oldAmbulance) {
        // A confirmed stalled vehicle should not immediately be dispatched again.
        oldAmbulance.status = stalled ? 'OFFLINE' : 'AVAILABLE';
        oldAmbulance.assignedSessionId = null;
      }
      newAmbulance.status = 'BUSY';
      newAmbulance.assignedSessionId = session._id;

      const pipeline = redis.pipeline();
      pipeline.set(`ambulance:${previousAmbulanceId}:status`, stalled ? 'OFFLINE' : 'AVAILABLE');
      if (stalled) {
        pipeline.srem('ambulance:available', previousAmbulanceId.toString());
        pipeline.srem('ambulance:online', previousAmbulanceId.toString());
      } else {
        pipeline.sadd('ambulance:available', previousAmbulanceId.toString());
      }
      pipeline.set(
        `session:${session._id}:eta`,
        JSON.stringify({ etaMinutes: candidate.eta, calculatedAt: new Date().toISOString() }),
        'EX', 90
      );
      pipeline.set(`session:${session._id}:last_movement_at`, Date.now().toString(), 'EX', 7200);

      await Promise.all([
        liveSession.save(),
        oldAmbulance ? oldAmbulance.save() : Promise.resolve(),
        newAmbulance.save(),
        pipeline.exec(),
      ]);

      const { scheduleDelayDetection } = require('../workers/delayDetection.worker');
      await scheduleDelayDetection(session._id, Math.max(1, candidate.eta));

      emitToRoom(`session:${session._id}`, 'session_status_changed', {
        sessionId: session._id,
        oldStatus: 'DELAYED',
        newStatus: 'ASSIGNED',
      });
      emitToRoom(`session:${session._id}`, 'ambulance_swapped', {
        sessionId: session._id,
        previousAmbulanceId,
        newAmbulanceId: candidate.ambulanceId,
        newEta: candidate.eta,
        message: 'The delayed ambulance was replaced with another available ambulance.',
      });

      if (oldAmbulance?.driverId) {
        emitToRoom(`driver:${oldAmbulance.driverId}`, 'assignment_cancelled', {
          sessionId: session._id,
          reason: stalled
            ? 'Your ambulance was taken offline after a movement stall.'
            : 'A closer ambulance was available.',
          takenOffline: stalled,
        });
      }
      if (newAmbulance.driverId) {
        emitToRoom(`driver:${newAmbulance.driverId}`, 'driver_assignment', {
          sessionId: session._id,
          emergencyType: session.emergencyType,
          severityLevel: session.severityLevel,
          patientLocation: session.location,
          description: session.description,
          etaMinutes: candidate.eta,
          swapped: true,
        });
      }

      logger.info(`Fallback L2 swapped session=${session._id} old=${previousAmbulanceId} new=${candidate.ambulanceId} eta=${candidate.eta}`);
      return { improved: true, newAmbulanceId: candidate.ambulanceId, newEta: candidate.eta };
    }

    logger.info(`Fallback L2: no replacement met policy for session=${session._id}`);
    return { improved: false };
  } catch (err) {
    logger.error(`Fallback L2 error: ${err.message}`);
    return { improved: false };
  }
}

async function fallbackLevel3and4(session, currentEta) {
  try {
    const { generateDelayMessage } = require('./ai/delayMessageService');
    const delayEvent = [...(session.eventLog || [])].reverse().find((e) => e.status === 'DELAYED');
    const drift = delayEvent?.meta?.drift || 0;
    const aiMessage = await generateDelayMessage(session, currentEta, drift);

    emitToRoom(`session:${session._id}`, 'ai_suggestion', {
      sessionId: session._id,
      patientMessage: aiMessage.patientMessage,
      firstAidAction: aiMessage.firstAidAction,
      message: aiMessage.patientMessage,
    });

    const liveSession = await EmergencySession.findById(session._id);
    liveSession.addEvent('AI_SUGGESTION_SENT', aiMessage);
    await liveSession.save();
  } catch (err) {
    logger.error(`Fallback L3 error: ${err.message}`);
  }

  try {
    const payload = {
      sessionId: session._id,
      emergencyType: session.emergencyType,
      severityLevel: session.severityLevel,
      patientLocation: session.location,
      ambulanceDelayed: true,
      currentEta,
      timestamp: new Date().toISOString(),
    };

    if (process.env.HOSPITAL_WEBHOOK_URL) {
      await axios.post(process.env.HOSPITAL_WEBHOOK_URL, payload, { timeout: 5000 });
    }

    const liveSession = await EmergencySession.findById(session._id);
    liveSession.addEvent('HOSPITAL_WEBHOOK_TRIGGERED', {
      delivered: Boolean(process.env.HOSPITAL_WEBHOOK_URL),
      payload,
    });
    await liveSession.save();
  } catch (err) {
    logger.error(`Fallback L4 error: ${err.message}`);
  }
}

module.exports = { triggerFallback, clearFallbackStage };
