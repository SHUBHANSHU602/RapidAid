const ngeohash = require('ngeohash');
const redis = require('../config/redis');
const Ambulance = require('../models/Ambulance');
const EmergencySession = require('../models/EmergencySession');
const { haversineDistance, getETAs } = require('./mapsService');
const logger = require('../utils/logger');
const { getIO } = require('../sockets/emergencyRoom');

const AVAILABLE_SET_KEY = 'ambulance:available';

async function getNearbyAvailableAmbulances(lat, lng, maxCandidates = 10) {
  const target = ngeohash.encode(lat, lng, 7);
  const neighbours = ngeohash.neighbors(target);
  const prefixes = [target.slice(0, 5), ...Object.values(neighbours).map((n) => n.slice(0, 5))];
  const uniquePrefixes = [...new Set(prefixes)];

  const availableIds = await redis.smembers(AVAILABLE_SET_KEY);
  if (!availableIds.length) return [];

  const pipeline = redis.pipeline();
  for (const id of availableIds) pipeline.get(`ambulance:${id}:location`);
  const results = await pipeline.exec();

  const candidates = [];
  for (let i = 0; i < availableIds.length; i++) {
    const raw = results[i]?.[1];
    if (!raw) continue;
    const location = JSON.parse(raw);
    const aLat = location.lat ?? location.latitude;
    const aLng = location.lng ?? location.longitude;
    if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) continue;

    const geohash = location.geohash || ngeohash.encode(aLat, aLng, 7);
    if (!uniquePrefixes.some((prefix) => geohash.startsWith(prefix))) continue;

    candidates.push({
      ambulanceId: availableIds[i],
      lat: aLat,
      lng: aLng,
      distanceKm: haversineDistance(lat, lng, aLat, aLng),
    });
  }

  return candidates.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, maxCandidates);
}

function scoreCandidate(etaSeconds, distanceKm, lastPingMs) {
  const etaScore = Math.min(etaSeconds / 600, 1);
  const distScore = Math.min(distanceKm / 10, 1);
  const pingAge = lastPingMs ? (Date.now() - lastPingMs) / (1000 * 60 * 30) : 1;
  const pingScore = Math.min(Math.max(pingAge, 0), 1);
  return etaScore * 0.5 + distScore * 0.3 + pingScore * 0.2;
}

async function reserveAmbulance(ambulanceId) {
  const id = ambulanceId.toString();
  const lua = `
    local status = redis.call('GET', KEYS[1])
    if status ~= 'AVAILABLE' then return 0 end
    if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 0 then return 0 end
    redis.call('SET', KEYS[1], 'BUSY')
    redis.call('SREM', KEYS[2], ARGV[1])
    return 1
  `;
  const result = await redis.eval(lua, 2, `ambulance:${id}:status`, AVAILABLE_SET_KEY, id);
  return result === 1;
}

async function releaseReservation(ambulanceId) {
  const id = ambulanceId.toString();
  const pipeline = redis.pipeline();
  pipeline.set(`ambulance:${id}:status`, 'AVAILABLE');
  pipeline.sadd(AVAILABLE_SET_KEY, id);
  await pipeline.exec();
}

async function assignAmbulance(sessionId, patientLat, patientLng) {
  const startedAt = Date.now();
  const candidates = await getNearbyAvailableAmbulances(patientLat, patientLng, 10);
  if (!candidates.length) {
    logger.warn(`No available ambulances near ${patientLat},${patientLng}`);
    return null;
  }

  const top5 = candidates.slice(0, 5);
  const [etaSeconds, ambulanceDocs] = await Promise.all([
    getETAs(
      { lat: patientLat, lng: patientLng },
      top5.map((a) => ({ lat: a.lat, lng: a.lng }))
    ),
    Ambulance.find({ _id: { $in: top5.map((a) => a.ambulanceId) } }).lean(),
  ]);

  const docMap = Object.fromEntries(ambulanceDocs.map((doc) => [doc._id.toString(), doc]));
  const scored = top5.map((candidate, index) => {
    const doc = docMap[candidate.ambulanceId];
    const lastPingMs = doc?.lastPing ? new Date(doc.lastPing).getTime() : 0;
    return {
      ...candidate,
      etaSeconds: etaSeconds[index],
      score: scoreCandidate(etaSeconds[index], candidate.distanceKm, lastPingMs),
    };
  }).sort((a, b) => a.score - b.score);

  let best = null;
  for (const candidate of scored) {
    if (await reserveAmbulance(candidate.ambulanceId)) {
      best = candidate;
      break;
    }
  }

  if (!best) {
    logger.warn(`Assignment race: all candidates were reserved before session ${sessionId} could claim one`);
    return null;
  }

  try {
    const session = await EmergencySession.findById(sessionId);
    if (!session || ['RESOLVED', 'CANCELLED'].includes(session.status)) {
      await releaseReservation(best.ambulanceId);
      return null;
    }

    const ambulanceDoc = docMap[best.ambulanceId] || await Ambulance.findById(best.ambulanceId).lean();
    session.ambulanceId = best.ambulanceId;
    if (session.status === 'INITIATED') session.status = 'ASSIGNED';
    session.addEvent('ASSIGNED', {
      ambulanceId: best.ambulanceId,
      etaSeconds: best.etaSeconds,
      distanceKm: best.distanceKm,
      score: best.score,
    });

    await Promise.all([
      session.save(),
      Ambulance.findByIdAndUpdate(best.ambulanceId, {
        assignedSessionId: sessionId,
        status: 'BUSY',
      }),
    ]);

    const io = getIO();
    const patientPayload = {
      sessionId,
      ambulanceId: best.ambulanceId,
      driverName: ambulanceDoc?.driverName,
      vehicleNumber: ambulanceDoc?.vehicleNumber,
      etaSeconds: best.etaSeconds,
      etaMinutes: Math.ceil(best.etaSeconds / 60),
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
        etaMinutes: Math.ceil(best.etaSeconds / 60),
      });
    }

    logger.info(`Assignment complete in ${Date.now() - startedAt}ms | ambulance=${best.ambulanceId}`);
    return {
      ambulanceId: best.ambulanceId,
      etaSeconds: best.etaSeconds,
      distanceKm: best.distanceKm,
      score: best.score,
      latency: Date.now() - startedAt,
    };
  } catch (err) {
    await releaseReservation(best.ambulanceId).catch(() => {});
    throw err;
  }
}

module.exports = { assignAmbulance, getNearbyAvailableAmbulances };
