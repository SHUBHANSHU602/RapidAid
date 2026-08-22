const { callGroq, parseGroqJSON } = require('./groqService');
const logger = require('../../utils/logger');

/**
 * Generate step-by-step first aid for critical emergencies.
 * Auto-triggered for severity 4-5 only.
 * @param {string} emergencyType
 * @param {number} severity
 * @param {string} description
 * @returns {Promise<{steps:string[], warnings:string[], estimatedTimeMin:number}|null>}
 */
async function generateFirstAid(emergencyType, severity, description = '') {
  // Only generate for severity 4-5
  if (severity < 4) {
    logger.debug(`First aid: severity ${severity} below threshold — skipping`);
    return null;
  }

  const prompt = `You are an emergency first aid assistant.
Provide clear, numbered steps a non-medical bystander can follow.

Emergency: ${emergencyType}
Severity: ${severity}/5
${description ? `Details: "${description}"` : ''}

Respond ONLY with valid JSON, no markdown:
{
  "steps": ["<step 1 — start with action verb>", "<step 2>", "<step 3>", "<step 4>", "<step 5>"],
  "warnings": ["<what NOT to do 1>", "<what NOT to do 2>"],
  "estimatedTimeMin": <number of minutes these steps cover>
}

Strict rules:
- Exactly 5 steps maximum
- Each step starts with an action verb (Call, Apply, Keep, Place, etc.)
- Steps must be executable by a non-medical bystander
- Warnings must be specific to ${emergencyType}
- No medical jargon`;

  try {
    const raw = await callGroq(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 400 }
    );

    const parsed = parseGroqJSON(raw);

    if (!parsed?.steps || !Array.isArray(parsed.steps)) {
      logger.warn('First aid: invalid response — using fallback');
      return fallbackFirstAid(emergencyType);
    }

    // Cap at 5 steps regardless of model output
    parsed.steps = parsed.steps.slice(0, 5);

    logger.info(`First aid generated: ${emergencyType} severity ${severity}`);
    return parsed;
  } catch (err) {
    logger.error('First aid: Groq failed — using fallback', err.message);
    return fallbackFirstAid(emergencyType);
  }
}

/**
 * Hardcoded first aid — always available, never fails.
 */
function fallbackFirstAid(emergencyType) {
  const fallbacks = {
    CARDIAC: {
      steps: [
        'Call emergency services immediately if not already done',
        'Ask the person to sit or lie down in a comfortable position',
        'Loosen any tight clothing around neck and chest',
        'Begin CPR if person becomes unresponsive: 30 chest compressions',
        'Continue CPR until ambulance arrives',
      ],
      warnings: ['Do not give food, water, or medication', 'Do not leave the person alone'],
      estimatedTimeMin: 10,
    },
    TRAUMA: {
      steps: [
        'Ensure the scene is safe before approaching',
        'Apply firm pressure to any bleeding wounds with a clean cloth',
        'Keep the person completely still — do not move them',
        'Keep the person warm with a blanket or jacket',
        'Talk to them calmly and monitor breathing',
      ],
      warnings: ['Do not remove embedded objects from wounds', 'Do not give anything to drink'],
      estimatedTimeMin: 8,
    },
    RESPIRATORY: {
      steps: [
        'Help the person sit upright — never lay them flat',
        'Loosen any tight clothing around chest and neck',
        'Ask them to breathe slowly and deeply',
        'If they have an inhaler, help them use it',
        'Keep them calm — panic worsens breathing',
      ],
      warnings: ['Do not give water during an attack', 'Do not leave them alone'],
      estimatedTimeMin: 5,
    },
    NEUROLOGICAL: {
      steps: [
        'Keep the person completely still',
        'Note the exact time symptoms started',
        'Turn them on their side if they are unconscious',
        'Do not restrain any seizure movements',
        'Clear the area of any sharp objects',
      ],
      warnings: ['Do not put anything in their mouth', 'Do not give food or water'],
      estimatedTimeMin: 8,
    },
    OTHER: {
      steps: [
        'Keep the person calm and still',
        'Do not give food or water',
        'Monitor their breathing and consciousness',
        'Keep them warm',
        'Stay on the line with emergency services',
      ],
      warnings: ['Do not move the person unless in danger', 'Do not administer medication'],
      estimatedTimeMin: 10,
    },
  };

  return fallbacks[emergencyType] || fallbacks.OTHER;
}

module.exports = { generateFirstAid };