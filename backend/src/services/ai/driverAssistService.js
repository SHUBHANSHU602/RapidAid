const { callGroq, parseGroqJSON } = require('./groqService');
const logger = require('../../utils/logger');

/**
 * Generate 3 contextual quick-reply options for the driver.
 * @param {string} lastPatientMessage
 * @param {string} emergencyType
 * @param {number} etaMinutes
 * @returns {Promise<string[]>} exactly 3 short reply options
 */
async function generateDriverReplies(lastPatientMessage, emergencyType, etaMinutes) {
  const prompt = `You are helping an ambulance driver respond to a patient during an emergency.
The driver is driving and cannot type — they will tap one of your suggestions.

Emergency: ${emergencyType}
Driver ETA: ${etaMinutes} minutes
Last message from patient: "${lastPatientMessage}"

Generate exactly 3 short reply options the driver can tap to send.

Respond ONLY with valid JSON, no markdown:
{
  "replies": [
    "<reply 1 — under 10 words>",
    "<reply 2 — under 10 words>",
    "<reply 3 — under 10 words>"
  ]
}

Strict rules:
- Each reply must be under 10 words
- At least one reply must mention the ETA (${etaMinutes} minutes)
- Tone: calm, professional, reassuring
- No emojis
- No medical advice`;

  try {
    const raw = await callGroq(
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, max_tokens: 150 }
    );

    const parsed = parseGroqJSON(raw);

    if (!parsed?.replies || !Array.isArray(parsed.replies) || parsed.replies.length < 3) {
      logger.warn('Driver replies: invalid response — using fallback');
      return fallbackReplies(etaMinutes);
    }

    // Always return exactly 3
    return parsed.replies.slice(0, 3);
  } catch (err) {
    logger.error('Driver replies: Groq failed — using fallback', err.message);
    return fallbackReplies(etaMinutes);
  }
}

/**
 * Fallback replies — always 3, always include ETA.
 */
function fallbackReplies(etaMinutes) {
  return [
    `On my way, arriving in ${etaMinutes} minutes.`,
    'Stay calm, help is coming.',
    'I can see your location, en route now.',
  ];
}

module.exports = { generateDriverReplies };