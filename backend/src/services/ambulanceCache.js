const redis = require('../config/redis');
const Ambulance = require('../models/Ambulance');
const ngeohash = require('ngeohash');

const AVAILABLE_SET_KEY = 'ambulance:available';
const ONLINE_SET_KEY = 'ambulance:online';
const GEO_KEY = 'ambulance:positions';
const MAX_LOCATION_AGE_MS = Number(process.env.AMBULANCE_LOCATION_MAX_AGE_MS || 90000);

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
  pipeline.del(GEO_KEY);

  for (const amb of ambulances) {
    const id = amb._id.toString();
    const { lat, lng } = amb.currentLocation;
    const location = buildLocationPayload(lat, lng);

    pipeline.set(`ambulance:${id}:status`, amb.status);
    pipeline.set(`ambulance:${id}:location`, JSON.stringify(location));
    pipeline.set(`ambulance:${id}:zone`, ngeohash.encode(lat, lng, 4));
    pipeline.geoadd(GEO_KEY, lng, lat, id);

    if (amb.status === 'AVAILABLE') {
      pipeline.sadd(AVAILABLE_SET_KEY, id);
    }
  }

  await pipeline.exec();
  return ambulances.length;
}

async function updateAmbulanceStatus(ambulanceId, newStatus) {
  const id = ambulanceId.toString();
  if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(newStatus)) {
    throw new Error('Invalid ambulance status');
  }

  // MongoDB is the durable assignment owner. Never publish AVAILABLE in Redis
  // until MongoDB confirms that this ambulance has no assigned emergency.
  const query = { _id: ambulanceId };
  if (newStatus === 'AVAILABLE') query.assignedSessionId = null;
  const updated = await Ambulance.findOneAndUpdate(
    query, { $set: { status: newStatus } }, { new: true }
  );
  if (!updated) throw new Error('Ambulance not found or still has an assigned session');

  const pipeline = redis.pipeline();
  pipeline.set(`ambulance:${id}:status`, newStatus);
  if (newStatus === 'AVAILABLE') pipeline.sadd(AVAILABLE_SET_KEY, id);
  else pipeline.srem(AVAILABLE_SET_KEY, id);
  await pipeline.exec();
  return updated;
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
  pipeline.geoadd(GEO_KEY, lng, lat, id);
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

// Redis GEOSEARCH retrieves nearby IDs without scanning the entire fleet.
// The availability set and fresh authenticated GPS remain final eligibility guards.
async function getAvailableAmbulancesNear(lat, lng, radiusKm = 15, maxResults = 100) {
  const eligible = new Set(await getEligibleAmbulanceIds());
  if (!eligible.size) return [];
  const rows = await redis.call('GEOSEARCH', GEO_KEY, 'FROMLONLAT', lng, lat,
    'BYRADIUS', radiusKm, 'km', 'ASC', 'COUNT', maxResults);
  if (!rows.length) return [];
  const ids = rows.filter(id => eligible.has(id));
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.get(`ambulance:${id}:location`));
  const result = await pipeline.exec();
  const now = Date.now();
  const candidates = [];
  for (let i = 0; i < ids.length; i++) {
    try {
      const raw = result[i]?.[1];
      if (!raw) continue;
      const loc = JSON.parse(raw);
      const updatedAt = Date.parse(loc.updatedAt);
      if (!Number.isFinite(updatedAt) || now - updatedAt > MAX_LOCATION_AGE_MS || updatedAt > now + 10000) continue;
      const aLat = Number(loc.lat ?? loc.latitude);
      const aLng = Number(loc.lng ?? loc.longitude);
      if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) continue;
      candidates.push({ ambulanceId: ids[i], lat: aLat, lng: aLng, updatedAt: loc.updatedAt, geohash: loc.geohash });
    } catch { /* Discard corrupt or stale position data. */ }
  }
  return candidates;
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