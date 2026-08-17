const { callGroq, parseGroqJSON } = require('./groqService');
const logger = require('../../utils/logger');

/**
 * Triage an emergency from natural language description.
 * @param {string} description - User's description of the emergency
 * @param {string} emergencyType - From enum: CARDIAC, TRAUMA, etc.
 * @returns {Promise<{severity:number, confidence:string, reasoning:string, immediateActions:string[]}>}
 */
async function triageEmergency(description, emergencyType) {
  // Skip AI if no description provided
  if (!description || description.trim().length < 5) {
    logger.debug('Triage: no description — using fallback');
    return fallbackTriage(emergencyType);
  }

  const prompt = `You are an emergency medical triage assistant.
Assess the severity of this emergency strictly based on the description.

Emergency type: ${emergencyType}
Description: "${description}"

Severity scale:
1 = Minor (non-urgent, can wait 60+ min)
2 = Moderate (needs attention within 30 min)
3 = Serious (needs attention within 15 min)
4 = Critical (needs attention within 5 min)
5 = Life-threatening (immediate intervention required)

Respond ONLY with valid JSON, no markdown:
{
  "severity": <number 1-5>,
  "confidence": "<low|medium|high>",
  "reasoning": "<one sentence explaining the score>",
  "immediateActions": ["<action 1>", "<action 2>", "<action 3>"]
}`;

  try {
    const raw = await callGroq(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 300 }
    );

    const parsed = parseGroqJSON(raw);

    if (!parsed || typeof parsed.severity !== 'number') {
      logger.warn('Triage: invalid response structure — using fallback');
      return fallbackTriage(emergencyType);
    }

    // Clamp severity to valid range
    parsed.severity = Math.max(1, Math.min(5, Math.round(parsed.severity)));

    logger.info(`Triage: severity=${parsed.severity} confidence=${parsed.confidence} type=${emergencyType}`);
    return parsed;
  } catch (err) {
    logger.error('Triage: Groq call failed — using fallback', err.message);
    return fallbackTriage(emergencyType);
  }
}

/**
 * Hardcoded fallback when Groq is unavailable.
 * Always returns a valid triage result — dispatch never fails.
 */
function fallbackTriage(emergencyType) {
  const defaults = {
    CARDIAC:      { severity: 5, confidence: 'low', reasoning: 'Cardiac emergencies default to critical', immediateActions: ['Call for help', 'Keep patient still', 'Start CPR if trained'] },
    TRAUMA:       { severity: 4, confidence: 'low', reasoning: 'Trauma defaults to serious',             immediateActions: ['Apply pressure to wounds', 'Keep patient warm', 'Do not move patient'] },
    RESPIRATORY:  { severity: 4, confidence: 'low', reasoning: 'Respiratory distress defaults to serious',immediateActions: ['Sit patient upright', 'Loosen tight clothing', 'Stay calm'] },
    NEUROLOGICAL: { severity: 4, confidence: 'low', reasoning: 'Neurological emergency defaults to serious',immediateActions: ['Keep patient still', 'Note time symptoms started', 'No food or water'] },
    OTHER:        { severity: 3, confidence: 'low', reasoning: 'Unknown type defaults to moderate',      immediateActions: ['Stay with patient', 'Keep patient calm', 'Monitor breathing'] },
  };
  return defaults[emergencyType] || defaults.OTHER;
}

module.exports = { triageEmergency };