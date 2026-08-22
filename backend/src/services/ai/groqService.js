const Groq = require('groq-sdk');
const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Token bucket rate limiter
// Groq free tier: ~30 requests/minute
// We cap at 25 to stay safely under
const limiter = new Bottleneck({
  minTime: 2000,              // minimum 2s between requests
  maxConcurrent: 5,           // max 5 in-flight at once
  reservoir: 25,              // 25 tokens available
  reservoirRefreshAmount: 25, // refill to 25
  reservoirRefreshInterval: 60 * 1000, // every 60 seconds
});

/**
 * Make a rate-limited Groq API call with exponential backoff on 429.
 * @param {Array} messages - [{ role, content }]
 * @param {Object} options - model, temperature, max_tokens
 * @returns {Promise<string>} raw text response
 */
async function callGroq(messages, options = {}) {
  const {
    model = 'llama-3.3-70b-versatile',
    temperature = 0.3,
    max_tokens = 500,
  } = options;

  const attempt = async (retriesLeft) => {
    try {
      const completion = await limiter.schedule(() =>
        groq.chat.completions.create({
          messages,
          model,
          temperature,
          max_tokens,
        })
      );
      return completion.choices[0]?.message?.content || '';
    } catch (err) {
      if (err.status === 429 && retriesLeft > 0) {
        const delay = Math.pow(2, 3 - retriesLeft) * 1000; // 1s, 2s, 4s
        logger.warn(`Groq rate limited — retrying in ${delay}ms (${retriesLeft} left)`);
        await new Promise(res => setTimeout(res, delay));
        return attempt(retriesLeft - 1);
      }
      throw err;
    }
  };

  return attempt(3);
}

/**
 * Safely parse JSON from Groq response.
 * Strips markdown fences if present.
 * @param {string} raw
 * @returns {Object|null}
 */
function parseGroqJSON(raw) {
  try {
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error('parseGroqJSON failed', { raw: raw?.slice(0, 200), error: err.message });
    return null;
  }
}

module.exports = { callGroq, parseGroqJSON };