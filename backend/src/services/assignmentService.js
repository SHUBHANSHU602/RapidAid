const ngeohash = require('ngeohash');
const redis = require('../config/redis');
const Ambulance = require('../models/Ambulance');
const EmergencySession = require('../models/EmergencySession');
const { getAvailableAmbulancesNear } = require('./ambulanceCache');
const { haversineDistance, getETAsToDestination } = require('./mapsService');
const logger = require('../utils/logger');
const { getIO } = require('../sockets/emergencyRoom');

const AVAILABLE_SET_KEY = 'ambulance:available';

async function getNearbyAvailableAmbulances(lat, lng, maxCandidates = 10) {
  // Expand the radius once when local demand exceeds the available supply.
  const primary = await getAvailableAmbulancesNear(lat, lng, 15, 100);
  const pool = primary.length ? primary : await getAvailableAmbulancesNear(lat, lng, 30, 150);
  return pool.map(a => ({
    ...a, distanceKm: haversineDistance(lat, lng, a.lat, a.lng)
  })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, maxCandidates);
}

function scoreCandidate(etaSeconds, distanceKm, lastPingMs) {
  const etaScore = Math.min(etaSeconds / 600, 1);
  const distScore = Math.min(distanceKm / 10, 1);
  const pingAge = lastPingMs ? (Date.now() - lastPingMs) / (1000 * 60 * 30) : 1;
  const pingScore = Math.min(Math.max(pingAge, 0), 1);
  return etaScore * 0.5 + distScore * 0.3 + pingScore * 0.2;
}

// Lua is atomic inside Redis; the session-specific claim protects rollback.
async function reserveAmbulance(ambulanceId, sessionId) {
  const id = String(ambulanceId);
  const lua = `
    if redis.call('GET', KEYS[1]) ~= 'AVAILABLE' then return 0 end
    if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 0 then return 0 end
    if redis.call('SISMEMBER', KEYS[3], ARGV[1]) == 0 then return 0 end
    if redis.call('EXISTS', KEYS[4]) == 1 then return 0 end
    redis.call('SET', KEYS[1], 'BUSY')
    redis.call('SET', KEYS[4], ARGV[2], 'EX', 300)
    redis.call('SREM', KEYS[2], ARGV[1])
    return 1
  `;
  return (await redis.eval(lua, 4,
    `ambulance:${id}:status`, AVAILABLE_SET_KEY, 'ambulance:online',
    `ambulance:${id}:reservation`, id, String(sessionId))) === 1;
}

async function releaseReservation(ambulanceId, sessionId) {
  const id = String(ambulanceId);
  const lua = `
    if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
    redis.call('DEL', KEYS[1])
    redis.call('SET', KEYS[2], 'AVAILABLE')
    redis.call('SADD', KEYS[3], ARGV[2])
    return 1
  `;
  return redis.eval(lua, 3, `ambulance:${id}:reservation`,
    `ambulance:${id}:status`, AVAILABLE_SET_KEY, String(sessionId), id);
}

async function assignAmbulance(sessionId, patientLat, patientLng) {
  const startedAt = Date.now();
  const candidates = await getNearbyAvailableAmbulances(patientLat, patientLng, 10);
  if (!candidates.length) {
    logger.warn(`No online available ambulances near ${patientLat},${patientLng}`);
    return null;
  }

  const top5 = candidates.slice(0, 5);
  const [etaSeconds, ambulanceDocs] = await Promise.all([
    getETAsToDestination(
      top5.map((a) => ({ lat: a.lat, lng: a.lng })),
      { lat: patientLat, lng: patientLng }
    ),
    Ambulance.find({ _id: { $in: top5.map((a) => a.ambulanceId) } }).lean(),
  ]);

  const docMap = Object.fromEntries(ambulanceDocs.map((doc) => [doc._id.toString(), doc]));
  const scored = top5.map((candidate, index) => {
    const doc = docMap[candidate.ambulanceId];
    const lastPingMs = doc?.lastPing ? new Date(doc.lastPing).getTime() : 0;
    const candidateEta = Number(etaSeconds[index]);
    if (!Number.isFinite(candidateEta) || candidateEta <= 0) return null;
    return {
      ...candidate,
      etaSeconds: candidateEta,
      score: scoreCandidate(candidateEta, candidate.distanceKm, lastPingMs),
    };
  }).filter(Boolean).sort((a, b) => a.score - b.score);

  let best = null;
  for (const candidate of scored) {
    if (await reserveAmbulance(candidate.ambulanceId, sessionId)) {
      best = candidate;
      break;
    }
  }

  if (!best) {
    logger.warn(`Assignment race: all candidates were reserved before session ${sessionId} could claim one`);
    return null;
  }

  try {
    const ambulanceDoc = docMap[best.ambulanceId] || await Ambulance.findById(best.ambulanceId).lean();
    const etaMinutes = Math.max(1, Math.ceil(best.etaSeconds / 60));

    // Conditional MongoDB claim. A failed/competing job cannot overwrite an assignment.
    const claimed = await Ambulance.findOneAndUpdate(
      { _id: best.ambulanceId, status: 'AVAILABLE', assignedSessionId: null },
      { $set: { assignedSessionId: sessionId, status: 'BUSY' } },
      { new: true }
    );
    if (!claimed) {
      await releaseReservation(best.ambulanceId, sessionId);
      return null;
    }

    // This condition races safely against a conditional cancellation transition.
    const session = await EmergencySession.findOneAndUpdate(
      { _id: sessionId, status: 'INITIATED', ambulanceId: null },
      { $set: { ambulanceId: best.ambulanceId, status: 'ASSIGNED' },
        $push: { eventLog: { status: 'ASSIGNED', timestamp: new Date(),
          meta: { ambulanceId: best.ambulanceId, etaSeconds: best.etaSeconds,
            distanceKm: best.distanceKm, score: best.score } } } },
      { new: true }
    );
    if (!session) {
      await Ambulance.updateOne(
        { _id: best.ambulanceId, assignedSessionId: sessionId },
        { $set: { assignedSessionId: null, status: 'AVAILABLE' } }
      );
      await releaseReservation(best.ambulanceId, sessionId);
      return null;
    }

    // ETA is disposable cache; it must not compromise an already-durable claim.
    try {
      await redis.set(`session:${sessionId}:eta`,
        JSON.stringify({ etaMinutes, source: 'assignment', calculatedAt: new Date().toISOString() }),
        'EX', 300);
    } catch (err) {
      logger.warn('assignment_eta_cache_failed', { sessionId: String(sessionId), error: err.message });
    }

    const io = getIO();
    const patientPayload = {
      sessionId,
      ambulanceId: best.ambulanceId,
      etaSeconds: best.etaSeconds,
      etaMinutes,
      distanceKm: best.distanceKm,
    };

    io.to(`session:${sessionId}`).emit('ambulance_assigned', patientPayload);

    if (ambulanceDoc?.driverId) {
      io.to(`driver:${ambulanceDoc.driverId.toString()}`).emit('driver_assignment', {
        sessionId,
        emergencyType: session.emergencyType,
        severityLevel: session.severityLevel,
        patientLocation: session.location,
        description: session.description,
        etaMinutes,
      });
    }

    logger.info(`Assignment complete in ${Date.now() - startedAt}ms | ambulance=${best.ambulanceId} | eta=${etaMinutes}m`);
    return {
      ambulanceId: best.ambulanceId,
      etaSeconds: best.etaSeconds,
      etaMinutes,
      distanceKm: best.distanceKm,
      score: best.score,
      latency: Date.now() - startedAt,
    };
  } catch (err) {
    // Do not unconditionally release a claim after a potential Mongo commit.
    logger.error('assignment_reconciliation_required', { sessionId: String(sessionId), ambulanceId: String(best.ambulanceId), error: err.message });
    throw err;
  }
}

module.exports = { assignAmbulance, getNearbyAvailableAmbulances };
