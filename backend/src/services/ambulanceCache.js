const redis = require('../config/redis');
const Ambulance = require('../models/Ambulance');
const ngeohash = require('ngeohash');

const AVAILABLE_SET_KEY = 'ambulance:available';
const ONLINE_SET_KEY = 'ambulance:online';

function buildLocationPayload(lat, lng) {
  return {
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    geohash: ngeohash.encode(lat, lng, 7),
    updatedAt: new Date().toISOString(),
  };
}

async function syncAmbulancesToRedis() {
  const ambulances = await Ambulance.find({}).lean();
  const pipeline = redis.pipeline();

  pipeline.del(AVAILABLE_SET_KEY);
  pipeline.del(ONLINE_SET_KEY); // nobody is considered online after a backend restart until their app reconnects

  for (const amb of ambulances) {
    const id = amb._id.toString();
    const { lat, lng } = amb.currentLocation;
    const location = buildLocationPayload(lat, lng);

    pipeline.set(`ambulance:${id}:status`, amb.status);
    pipeline.set(`ambulance:${id}:location`, JSON.stringify(location));
    pipeline.set(`ambulance:${id}:zone`, ngeohash.encode(lat, lng, 4));

    if (amb.status === 'AVAILABLE') {
      pipeline.sadd(AVAILABLE_SET_KEY, id);
    }
  }

  await pipeline.exec();
  return ambulances.length;
}

async function updateAmbulanceStatus(ambulanceId, newStatus) {
  const id = ambulanceId.toString();

  await redis.set(`ambulance:${id}:status`, newStatus);
  if (newStatus === 'AVAILABLE') await redis.sadd(AVAILABLE_SET_KEY, id);
  else await redis.srem(AVAILABLE_SET_KEY, id);

  await Ambulance.findByIdAndUpdate(ambulanceId, { status: newStatus });
}

async function setAmbulanceOnline(ambulanceId, online) {
  const id = ambulanceId.toString();
  if (online) await redis.sadd(ONLINE_SET_KEY, id);
  else await redis.srem(ONLINE_SET_KEY, id);
}

async function updateAmbulanceLocation(ambulanceId, lat, lng, persistToMongo = true) {
  const id = ambulanceId.toString();
  const location = buildLocationPayload(lat, lng);

  const pipeline = redis.pipeline();
  pipeline.set(`ambulance:${id}:location`, JSON.stringify(location), 'EX', 300);
  pipeline.set(`ambulance:${id}:zone`, ngeohash.encode(lat, lng, 4), 'EX', 300);
  pipeline.sadd(ONLINE_SET_KEY, id);
  await pipeline.exec();

  if (persistToMongo) {
    await Ambulance.findByIdAndUpdate(ambulanceId, {
      currentLocation: { lat, lng },
      lastPing: new Date(),
    });
  }

  return location;
}

async function getEligibleAmbulanceIds() {
  const [availableIds, onlineIds] = await Promise.all([
    redis.smembers(AVAILABLE_SET_KEY),
    redis.smembers(ONLINE_SET_KEY),
  ]);
  const online = new Set(onlineIds);
  return availableIds.filter((id) => online.has(id));
}

async function getAvailableAmbulancesNear(lat, lng, radiusChars = 5) {
  const queryGeohash = ngeohash.encode(lat, lng, 7);
  const neighbours = ngeohash.neighbors(queryGeohash);
  const prefixes = [
    queryGeohash.slice(0, radiusChars),
    ...Object.values(neighbours).map((hash) => hash.slice(0, radiusChars)),
  ];
  const uniquePrefixes = [...new Set(prefixes)];

  const availableIds = await getEligibleAmbulanceIds();
  if (availableIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of availableIds) pipeline.get(`ambulance:${id}:location`);
  const results = await pipeline.exec();

  const allCandidates = [];
  for (let i = 0; i < availableIds.length; i++) {
    const raw = results[i]?.[1];
    if (!raw) continue;

    let location;
    try {
      location = JSON.parse(raw);
    } catch {
      continue;
    }

    const aLat = Number(location.lat ?? location.latitude);
    const aLng = Number(location.lng ?? location.longitude);
    if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) continue;

    const geohash = location.geohash || ngeohash.encode(aLat, aLng, 7);
    allCandidates.push({
      ambulanceId: availableIds[i],
      lat: aLat,
      lng: aLng,
      geohash,
    });
  }

  const nearby = allCandidates.filter((candidate) =>
    uniquePrefixes.some((prefix) => candidate.geohash.startsWith(prefix))
  );

  // Keep the geohash boundary for normal operation. In demo mode, if browser GPS
  // puts the second driver just outside the current bucket, still consider the
  // actually-online replacement rather than making the swap impossible.
  if (!nearby.length && process.env.DEMO_MODE === 'true' && allCandidates.length) {
    return allCandidates;
  }

  return nearby;
}

async function getAmbulanceStatus(ambulanceId) {
  return redis.get(`ambulance:${ambulanceId.toString()}:status`);
}

async function getAmbulanceForDriver(driverUserId) {
  return Ambulance.findOne({ driverId: driverUserId });
}

module.exports = {
  syncAmbulancesToRedis,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
  setAmbulanceOnline,
  getEligibleAmbulanceIds,
  getAvailableAmbulancesNear,
  getAmbulanceStatus,
  getAmbulanceForDriver,
};