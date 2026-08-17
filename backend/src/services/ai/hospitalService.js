const { callGroq, parseGroqJSON } = require('./groqService');
const Hospital = require('../../models/Hospital');
const { haversineDistance } = require('../mapsService');
const logger = require('../../utils/logger');

/**
 * Use AI to rank nearby hospitals for this emergency.
 * @param {number} patientLat
 * @param {number} patientLng
 * @param {Object} triageResult - output from triageService
 * @param {string} emergencyType
 * @returns {Promise<Array>} ranked list of up to 3 hospitals
 */
async function selectHospital(patientLat, patientLng, triageResult, emergencyType) {
  // Fetch all active hospitals
  const hospitals = await Hospital.find({ isActive: true }).lean();

  if (hospitals.length === 0) {
    logger.warn('Hospital selection: no active hospitals found');
    return [];
  }

  // Enrich with distance — haversine is cheap, do it for all
  const enriched = hospitals.map(h => {
    const hLat = h.location?.lat || h.location?.coordinates?.[1];
    const hLng = h.location?.lng || h.location?.coordinates?.[0];
    return {
      id: h._id.toString(),
      name: h.name,
      specializations: h.specializations || [],
      availableBeds: h.availableBeds || 0,
      distanceKm: haversineDistance(patientLat, patientLng, hLat, hLng).toFixed(2),
    };
  });

  // Sort by distance, send top 5 to AI — keep prompt small
  enriched.sort((a, b) => a.distanceKm - b.distanceKm);
  const top5 = enriched.slice(0, 5);

  const severity = triageResult?.severity || 3;
  const immediateNeeds = triageResult?.immediateActions?.join(', ') || 'general emergency care';

  const prompt = `You are an emergency hospital selection assistant.

Patient emergency: ${emergencyType}
Severity: ${severity}/5
Immediate needs: ${immediateNeeds}

Nearby hospitals (sorted by distance):
${top5.map((h, i) =>
  `${i + 1}. ${h.name} | ${h.distanceKm}km away | Beds: ${h.availableBeds} | Specializations: ${h.specializations.join(', ')}`
).join('\n')}

Rank the top 3 hospitals for this patient.
Consider: proximity, available beds, relevant specializations for ${emergencyType}.

Respond ONLY with valid JSON, no markdown:
{
  "ranked": [
    { "id": "<exact hospital id>", "name": "<name>", "reason": "<one sentence why>", "rank": 1 },
    { "id": "<exact hospital id>", "name": "<name>", "reason": "<one sentence why>", "rank": 2 },
    { "id": "<exact hospital id>", "name": "<name>", "reason": "<one sentence why>", "rank": 3 }
  ]
}`;

  try {
    const raw = await callGroq(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 400 }
    );

    const parsed = parseGroqJSON(raw);

    if (!parsed?.ranked || !Array.isArray(parsed.ranked)) {
      logger.warn('Hospital selection: invalid response — using distance fallback');
      return fallbackHospitalSelection(top5);
    }

    logger.info(`Hospital selection: top pick is ${parsed.ranked[0]?.name}`);
    return parsed.ranked;
  } catch (err) {
    logger.error('Hospital selection: Groq failed — using distance fallback', err.message);
    return fallbackHospitalSelection(top5);
  }
}

/**
 * Fallback: return top 3 by distance with generic reasoning.
 */
function fallbackHospitalSelection(hospitals) {
  return hospitals.slice(0, 3).map((h, i) => ({
    id: h.id,
    name: h.name,
    reason: `Nearest available hospital (${h.distanceKm}km away)`,
    rank: i + 1,
  }));
}

module.exports = { selectHospital };