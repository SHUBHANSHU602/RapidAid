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
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
}

async function triggerFallback(sessionId, currentEta) {
  const session = await EmergencySession.findById(sessionId).lean();
  if (!session || ['RESOLVED', 'CANCELLED'].includes(session.status)) return;

  const l1 = await fallbackLevel1(session, currentEta);
  if (l1.improved) return;

  const l2 = await fallbackLevel2(session, currentEta);
  if (l2.improved) return;

  await fallbackLevel3and4(session, currentEta);
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
    if (ambulance?.driverId) {
      emitToRoom(`driver:${ambulance.driverId}`, 'reroute_suggested', {
        sessionId: session._id,
        currentEta,
        freshEta,
        navigationUrl,
        message: 'Delay detected. Re-open navigation to request the latest traffic-aware route.',
      });
    }
    emitToRoom(`session:${session._id}`, 'reroute_suggested', { sessionId: session._id, currentEta, freshEta, navigationUrl });

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
      emitToRoom(`session:${session._id}`, 'route_updated', {
        sessionId: session._id,
        newEta: freshEta,
        navigationUrl,
        message: 'A faster route is available for the current ambulance.',
      });
      return { improved: true, newEta: freshEta };
    }

    await liveSession.save();
    return { improved: false };
  } catch (err) {
    logger.error('Fallback L1 error', err.message);
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

async function fallbackLevel2(session, currentEta) {
  try {
    const pLat = session.location.lat;
    const pLng = session.location.lng;
    const candidates = await getAvailableAmbulancesNear(pLat, pLng);
    const alternatives = candidates.filter((a) => a.ambulanceId.toString() !== session.ambulanceId.toString());
    if (!alternatives.length) return { improved: false };

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
      if (!(candidate.eta < currentEta - 2)) continue;
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
      });

      if (oldAmbulance) {
        oldAmbulance.status = 'AVAILABLE';
        oldAmbulance.assignedSessionId = null;
      }
      newAmbulance.status = 'BUSY';
      newAmbulance.assignedSessionId = session._id;

      const pipeline = redis.pipeline();
      pipeline.set(`ambulance:${previousAmbulanceId}:status`, 'AVAILABLE');
      pipeline.sadd('ambulance:available', previousAmbulanceId.toString());
      pipeline.set(`session:${session._id}:eta`, JSON.stringify({ etaMinutes: candidate.eta, calculatedAt: new Date().toISOString() }), 'EX', 90);
      pipeline.set(`session:${session._id}:last_movement_at`, Date.now().toString(), 'EX', 7200);

      await Promise.all([
        liveSession.save(),
        oldAmbulance ? oldAmbulance.save() : Promise.resolve(),
        newAmbulance.save(),
        pipeline.exec(),
      ]);

      emitToRoom(`session:${session._id}`, 'ambulance_swapped', {
        sessionId: session._id,
        previousAmbulanceId,
        newAmbulanceId: candidate.ambulanceId,
        newEta: candidate.eta,
        message: 'A faster ambulance has been assigned.',
      });

      if (oldAmbulance?.driverId) {
        emitToRoom(`driver:${oldAmbulance.driverId}`, 'assignment_cancelled', {
          sessionId: session._id,
          reason: 'A closer ambulance was available.',
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

      return { improved: true, newAmbulanceId: candidate.ambulanceId, newEta: candidate.eta };
    }

    return { improved: false };
  } catch (err) {
    logger.error('Fallback L2 error', err.message);
    return { improved: false };
  }
}

async function fallbackLevel3and4(session, currentEta) {
  try {
    const { generateDelayMessage } = require('./ai/delayMessageService');
    const delayEvent = [...session.eventLog].reverse().find((e) => e.status === 'DELAYED');
    const drift = delayEvent?.meta?.drift || 0;
    const aiMessage = await generateDelayMessage(session, currentEta, drift);

    emitToRoom(`session:${session._id}`, 'ai_suggestion', {
      sessionId: session._id,
      patientMessage: aiMessage.patientMessage,
      firstAidAction: aiMessage.firstAidAction,
    });

    const liveSession = await EmergencySession.findById(session._id);
    liveSession.addEvent('AI_SUGGESTION_SENT', aiMessage);
    await liveSession.save();
  } catch (err) {
    logger.error('Fallback L3 error', err.message);
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
    logger.error('Fallback L4 error', err.message);
  }
}

module.exports = { triggerFallback };
