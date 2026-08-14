/**
 * Calculates great-circle distance between two geographic coordinates in kilometers.
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Linear interpolation between two scalar numbers.
 */
export const lerp = (start, end, t) => {
  return start + (end - start) * t;
};

/**
 * Smoothly interpolates coordinates between prev and next position.
 */
export const interpolateCoords = (startPos, endPos, progress) => {
  if (!startPos) return endPos;
  if (!endPos) return startPos;
  return {
    lat: lerp(startPos.lat, endPos.lat, progress),
    lng: lerp(startPos.lng, endPos.lng, progress),
  };
};

/**
 * Calculates bearing angle in degrees from point 1 to point 2.
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
};

/**
 * Formats coordinates into readable text.
 */
export const formatCoordinates = (lat, lng, decimals = 4) => {
  if (lat === undefined || lng === undefined) return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}° ${latDir}, ${Math.abs(lng).toFixed(decimals)}° ${lngDir}`;
};

/**
 * Generates Google Maps navigation URL for driver/patient.
 */
export const getGoogleMapsUrl = (lat, lng) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

/**
 * Varanasi default fallback coordinates.
 */
export const DEFAULT_COORDINATES = {
  lat: 25.3176,
  lng: 82.9739,
};
