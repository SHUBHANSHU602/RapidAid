const axios = require('axios');
const logger = require('../utils/logger');

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fallbackEtaSeconds(from, to) {
  const distKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
  return Math.round((distKm / 30) * 60 * 60);
}

// Kept for compatibility: one origin -> many destinations.
async function getETAs(originCoords, destinations) {
  if (!MAPS_API_KEY) return destinations.map((dest) => fallbackEtaSeconds(originCoords, dest));

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${originCoords.lat},${originCoords.lng}`,
        destinations: destinations.map((d) => `${d.lat},${d.lng}`).join('|'),
        key: MAPS_API_KEY,
        mode: 'driving',
        traffic_model: 'best_guess',
        departure_time: 'now',
      },
      timeout: 5000,
    });

    const elements = response.data.rows?.[0]?.elements || [];
    return destinations.map((dest, index) => {
      const el = elements[index];
      return el?.status === 'OK' ? (el.duration_in_traffic?.value || el.duration?.value) : fallbackEtaSeconds(originCoords, dest);
    });
  } catch (err) {
    logger.warn(`Google Maps batch ETA failed: ${err.message}`);
    return destinations.map((dest) => fallbackEtaSeconds(originCoords, dest));
  }
}

// Correct dispatch direction: many ambulance origins -> one patient destination.
async function getETAsToDestination(origins, destination) {
  if (!MAPS_API_KEY) return origins.map((origin) => fallbackEtaSeconds(origin, destination));

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origins.map((o) => `${o.lat},${o.lng}`).join('|'),
        destinations: `${destination.lat},${destination.lng}`,
        key: MAPS_API_KEY,
        mode: 'driving',
        traffic_model: 'best_guess',
        departure_time: 'now',
      },
      timeout: 5000,
    });

    return origins.map((origin, index) => {
      const el = response.data.rows?.[index]?.elements?.[0];
      return el?.status === 'OK' ? (el.duration_in_traffic?.value || el.duration?.value) : fallbackEtaSeconds(origin, destination);
    });
  } catch (err) {
    logger.warn(`Google Maps dispatch ETA failed: ${err.message}`);
    return origins.map((origin) => fallbackEtaSeconds(origin, destination));
  }
}

async function getSingleETA(fromLat, fromLng, toLat, toLng) {
  if (MAPS_API_KEY) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: `${fromLat},${fromLng}`,
          destinations: `${toLat},${toLng}`,
          key: MAPS_API_KEY,
          mode: 'driving',
          traffic_model: 'best_guess',
          departure_time: 'now',
        },
        timeout: 5000,
      });
      const element = response.data.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        return Math.ceil((element.duration_in_traffic?.value || element.duration.value) / 60);
      }
    } catch (err) {
      logger.warn(`Google Maps API failed, using haversine: ${err.message}`);
    }
  }

  return Math.ceil((haversineDistance(fromLat, fromLng, toLat, toLng) / 30) * 60);
}

module.exports = { haversineDistance, getETAs, getETAsToDestination, getSingleETA };
