const Bull = require('bull');
const redis = require('../config/redis');
const logger = require('../utils/logger');

function parseRedisUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || undefined,
    tls: url.startsWith('rediss://') ? {} : undefined,
  };
}

const redisConfig = parseRedisUrl(process.env.REDIS_URL);

// Maps API queue — max 5 concurrent requests to respect rate limits
const mapsQueue = new Bull('maps-requests', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

const CACHE_TTL = 300; // 5 minutes — traffic changes, so don't cache too long

/**
 * Get ETA with caching + queue rate limiting.
 * @param {number} fromLat
 * @param {number} fromLng
 * @param {number} toLat
 * @param {number} toLng
 * @returns {Promise<number>} ETA in minutes
 */
async function getQueuedETA(fromLat, fromLng, toLat, toLng) {
  // Round to 3 decimal places (~100m precision) for cache key
  const cacheKey = `maps:eta:${fromLat.toFixed(3)},${fromLng.toFixed(3)}:${toLat.toFixed(3)},${toLng.toFixed(3)}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.debug(`Maps cache hit: ${cacheKey}`);
    return parseInt(cached);
  }

  // Add to queue — respects concurrency limit
  const job = await mapsQueue.add(
    { fromLat, fromLng, toLat, toLng, cacheKey },
    { priority: 1 }
  );

  // Wait for result
  const result = await job.finished();
  return result;
}

// Process Maps API requests — max 5 concurrent
mapsQueue.process(5, async (job) => {
  const { fromLat, fromLng, toLat, toLng, cacheKey } = job.data;

  // Check cache again (might have been populated while waiting in queue)
  const cached = await redis.get(cacheKey);
  if (cached) return parseInt(cached);

  // Make the actual Maps API call
  const { getSingleETA } = require('../services/mapsService');
  const etaMinutes = await getSingleETA(fromLat, fromLng, toLat, toLng);

  // Cache result
  await redis.set(cacheKey, etaMinutes.toString(), 'EX', CACHE_TTL);

  logger.debug(`Maps API call completed: ${etaMinutes}min | cached for ${CACHE_TTL}s`);
  return etaMinutes;
});

mapsQueue.on('failed', (job, err) => {
  logger.error(`Maps queue job failed: ${job.id}`, err.message);
});

module.exports = { getQueuedETA, mapsQueue };