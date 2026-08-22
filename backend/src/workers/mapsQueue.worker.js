const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 20;

const { Queue, Worker, QueueEvents } = require('bullmq');
const { getBullMQConnection } = require('../config/bullmq');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const connection = getBullMQConnection();

const mapsQueue = new Queue('maps-requests', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

const mapsQueueEvents = new QueueEvents('maps-requests', { connection });

const CACHE_TTL = 300; // 5 minutes

/**
 * Get ETA with caching + queue rate limiting.
 */
async function getQueuedETA(fromLat, fromLng, toLat, toLng) {
  const cacheKey = `maps:eta:${fromLat.toFixed(3)},${fromLng.toFixed(3)}:${toLat.toFixed(3)},${toLng.toFixed(3)}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.debug(`Maps cache hit: ${cacheKey}`);
    return parseInt(cached);
  }

  // Add to queue
  const job = await mapsQueue.add(
    'get-eta',
    { fromLat, fromLng, toLat, toLng, cacheKey },
    { priority: 1 }
  );

  // Wait for result with timeout
  const result = await job.waitUntilFinished(mapsQueueEvents, 30000);
  return result;
}

// Worker — max 5 concurrent Maps API requests
const worker = new Worker(
  'maps-requests',
  async (job) => {
    const { fromLat, fromLng, toLat, toLng, cacheKey } = job.data;

    // Check cache again (might be populated while in queue)
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    const { getSingleETA } = require('../services/mapsService');
    const etaMinutes = await getSingleETA(fromLat, fromLng, toLat, toLng);

    await redis.set(cacheKey, etaMinutes.toString(), 'EX', CACHE_TTL);
    logger.debug(`Maps API: ${etaMinutes}min | cached ${CACHE_TTL}s`);

    return etaMinutes;
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  logger.error(`Maps queue job failed: ${job?.id}`, err.message);
});

worker.on('error', (err) => {
  logger.error(`Maps worker error: ${err.message}`);
});

logger.info('Maps queue worker initialized');

module.exports = { getQueuedETA, mapsQueue };