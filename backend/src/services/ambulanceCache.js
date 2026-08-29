const redis = require('../config/redis');
const Ambulance = require('../models/Ambulance');
const ngeohash = require('ngeohash');

const AVAILABLE_SET_KEY = 'ambulance:available';

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

async function updateAmbulanceLocation(ambulanceId, lat, lng, persistToMongo = true) {
  const id = ambulanceId.toString();
  const location = buildLocationPayload(lat, lng);

  const pipeline = redis.pipeline();
  pipeline.set(`ambulance:${id}:location`, JSON.stringify(location), 'EX', 300);
  pipeline.set(`ambulance:${id}:zone`, ngeohash.encode(lat, lng, 4), 'EX', 300);
  await pipeline.exec();

  if (persistToMongo) {
    await Ambulance.findByIdAndUpdate(ambulanceId, {
      currentLocation: { lat, lng },
      lastPing: new Date(),
    });
  }

  return location;
}

async function getAvailableAmbulancesNear(lat, lng, radiusChars = 5) {
  const queryGeohash = ngeohash.encode(lat, lng, 7);
  const neighbours = ngeohash.neighbors(queryGeohash);
  const prefixes = [
    queryGeohash.slice(0, radiusChars),
    ...Object.values(neighbours).map((hash) => hash.slice(0, radiusChars)),
  ];
  const uniquePrefixes = [...new Set(prefixes)];

  const availableIds = await redis.smembers(AVAILABLE_SET_KEY);
  if (availableIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of availableIds) pipeline.get(`ambulance:${id}:location`);
  const results = await pipeline.exec();

  const nearby = [];
  for (let i = 0; i < availableIds.length; i++) {
    const raw = results[i]?.[1];
    if (!raw) continue;
    const location = JSON.parse(raw);
    const geohash = location.geohash || ngeohash.encode(location.lat ?? location.latitude, location.lng ?? location.longitude, 7);

    if (uniquePrefixes.some((prefix) => geohash.startsWith(prefix))) {
      nearby.push({
        ambulanceId: availableIds[i],
        lat: location.lat ?? location.latitude,
        lng: location.lng ?? location.longitude,
        geohash,
      });
    }
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
  getAvailableAmbulancesNear,
  getAmbulanceStatus,
  getAmbulanceForDriver,
};
