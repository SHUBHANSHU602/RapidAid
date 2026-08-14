const Groq = require('groq-sdk');
const logger = require('../../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a calm, contextual patient message when ambulance is delayed.
 * @param {Object} session - EmergencySession document (lean)
 * @param {number} currentEta
 * @param {number} drift
 * @returns {Promise<{patientMessage: string, firstAidAction: string}>}
 */
async function generateDelayMessage(session, currentEta, drift) {
  const prompt = `You are an emergency dispatch assistant. An ambulance is delayed.
Write a calm, reassuring message for the patient.

Emergency: ${session.emergencyType}
Severity: ${session.severityLevel}/5
Delay: ${drift} minutes beyond expected arrival
Current ETA: ${currentEta} minutes

Respond ONLY with valid JSON — no markdown, no backticks:
{
  "patientMessage": "<calm 1-2 sentence message, mention ETA>",
  "firstAidAction": "<one specific action patient or bystander can take right now>"
}

Rules:
- Never say "unfortunately" or "sorry for the delay"
- Be specific about ETA
- First aid action must match ${session.emergencyType}
- patientMessage must be under 50 words`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.4,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    logger.info(`Fallback L3: AI message generated for session ${session._id}`);
    return parsed;
  } catch (err) {
    logger.warn('Fallback L3: Groq failed — using hardcoded fallback', err.message);
    return fallbackMessage(session.emergencyType, currentEta);
  }
}

function fallbackMessage(emergencyType, currentEta) {
  const actions = {
    CARDIAC: 'If the patient is unresponsive, begin CPR: 30 chest compressions followed by 2 rescue breaths.',
    TRAUMA: 'Apply firm pressure to any bleeding wounds with a clean cloth and keep the patient still.',
    RESPIRATORY: 'Help the patient sit upright and loosen any tight clothing around the chest.',
    NEUROLOGICAL: 'Keep the patient still and note the exact time symptoms started.',
    OTHER: 'Keep the patient calm, warm, and conscious. Monitor their breathing.',
  };
  return {
    patientMessage: `Help is on the way and will arrive in approximately ${currentEta} minutes. Stay calm and stay on the line.`,
    firstAidAction: actions[emergencyType] || actions.OTHER,
  };
}

module.exports = { generateDelayMessage };