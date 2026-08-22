const { callGroq, parseGroqJSON } = require('./groqService');
const logger = require('../../utils/logger');

/**
 * Generate a contextual patient message when ambulance is delayed.
 * @param {Object} session - EmergencySession document (lean)
 * @param {number} currentEta - current ETA in minutes
 * @param {number} drift - how many minutes delayed beyond original
 * @returns {Promise<{patientMessage:string, firstAidAction:string}>}
 */
async function generateDelayMessage(session, currentEta, drift) {
  const prompt = `You are an emergency dispatch assistant. An ambulance is delayed.
Write a calm, reassuring message for the patient.

Emergency: ${session.emergencyType}
Severity: ${session.severityLevel}/5
Delay: ${drift} minutes beyond expected arrival
Current ETA: ${currentEta} minutes

Respond ONLY with valid JSON, no markdown:
{
  "patientMessage": "<calm 1-2 sentences, mention the ETA, under 50 words>",
  "firstAidAction": "<one specific action the patient or bystander can take right now>"
}

Strict rules:
- Never say "unfortunately" or "sorry for the delay"
- Always mention the ETA in the message
- First aid action must be specific to ${session.emergencyType}
- patientMessage must be under 50 words`;

  try {
    const raw = await callGroq(
      [{ role: 'user', content: prompt }],
      { temperature: 0.4, max_tokens: 200 }
    );

    const parsed = parseGroqJSON(raw);

    if (!parsed?.patientMessage || !parsed?.firstAidAction) {
      logger.warn('Delay message: invalid structure — using fallback');
      return fallbackDelayMessage(session.emergencyType, currentEta);
    }

    logger.info(`Delay message generated for session ${session._id}`);
    return parsed;
  } catch (err) {
    logger.error('Delay message: Groq failed — using fallback', err.message);
    return fallbackDelayMessage(session.emergencyType, currentEta);
  }
}

/**
 * Hardcoded fallback delay messages by emergency type.
 */
function fallbackDelayMessage(emergencyType, currentEta) {
  const actions = {
    CARDIAC:      'If the patient is unresponsive, begin CPR: 30 chest compressions followed by 2 rescue breaths.',
    TRAUMA:       'Apply firm pressure to any bleeding wounds with a clean cloth and keep the patient still.',
    RESPIRATORY:  'Help the patient sit upright and loosen any tight clothing around the chest and neck.',
    NEUROLOGICAL: 'Keep the patient completely still and note the exact time symptoms started.',
    STROKE:       'Keep the patient calm and still — do not give food, water, or medication.',
    OTHER:        'Keep the patient calm, warm, and conscious. Monitor their breathing closely.',
  };

  return {
    patientMessage: `Help is on the way and will arrive in approximately ${currentEta} minutes. Stay calm and stay on the line with emergency services.`,
    firstAidAction: actions[emergencyType] || actions.OTHER,
  };
}

module.exports = { generateDelayMessage };