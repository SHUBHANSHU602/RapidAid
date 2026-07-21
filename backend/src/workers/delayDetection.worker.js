const Bull = require('bull');
const redis = require('../config/redis');
const EmergencySession = require('../models/EmergencySession');
const logger = require('../utils/logger');

// Parse REDIS_URL for Bull — Bull needs individual params not a full URL
// Upstash format: rediss://:password@host:port
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
logger.info('Bull Redis config: ' + JSON.stringify({
  host: redisConfig.host,
  port: redisConfig.port,
  hasPassword: !!redisConfig.password,
  hasTLS: !!redisConfig.tls
}));

// Create Bull queue backed by Redis
const delayQueue = new Bull('delay-detection', { redis: redisConfig });

/**
 * Schedule a repeating delay detection job for a session.
 * Called when ambulance is assigned.
 * @param {string} sessionId
 * @param {number} initialEtaMinutes
 */
async function scheduleDelayDetection(sessionId, initialEtaMinutes) {
  // Remove existing job first to avoid duplicates
  const existingJobs = await delayQueue.getRepeatableJobs();
  const existing = existingJobs.find(j => j.id === `delay:${sessionId}`);
  if (existing) {
    await delayQueue.removeRepeatableByKey(existing.key);
  }

  await delayQueue.add(
    { sessionId, initialEtaMinutes },
    {
      repeat: { every: 60000 }, // every 60 seconds
      jobId: `delay:${sessionId}`, // idempotent key
    }
  );

  logger.info(`Delay detection scheduled: session ${sessionId} | initial ETA: ${initialEtaMinutes}min`);
}

/**
 * Cancel delay detection job when session resolves.
 * @param {string} sessionId
 */
async function cancelDelayDetection(sessionId) {
  try {
    const jobs = await delayQueue.getRepeatableJobs();
    const job = jobs.find(j => j.id === `delay:${sessionId}`);
    if (job) {
      await delayQueue.removeRepeatableByKey(job.key);
      logger.info(`Delay detection cancelled: session ${sessionId}`);
    }
  } catch (err) {
    logger.error(`Failed to cancel delay detection: session ${sessionId}`, err);
  }
}

// ── Worker — processes each job ─────────────────────────────────────────────
delayQueue.process(async (job) => {
  const { sessionId, initialEtaMinutes } = job.data;

  logger.debug(`Delay check running: session ${sessionId}`);

  try {
    // 1. Load session
    const session = await EmergencySession.findById(sessionId).lean();

    if (!session) {
      logger.warn(`Delay check: session ${sessionId} not found — cancelling job`);
      await cancelDelayDetection(sessionId);
      return;
    }

    // 2. Skip if already resolved or cancelled
    if (['RESOLVED', 'CANCELLED'].includes(session.status)) {
      logger.debug(`Delay check: session ${sessionId} is ${session.status} — cancelling job`);
      await cancelDelayDetection(sessionId);
      return;
    }

    // 3. Skip if no ambulance assigned yet
    if (!session.ambulanceId) {
      logger.debug(`Delay check: no ambulance assigned for session ${sessionId}`);
      return;
    }

    // 4. Get current ETA from Redis
    const etaRaw = await redis.get(`session:${sessionId}:eta`);
    if (!etaRaw) {
      logger.debug(`Delay check: no ETA in Redis for session ${sessionId} — skipping`);
      return;
    }

    const { etaMinutes: currentEta } = JSON.parse(etaRaw);
    const drift = currentEta - initialEtaMinutes;

    logger.debug(
      `Delay check: session ${sessionId} | initial=${initialEtaMinutes}min | current=${currentEta}min | drift=${drift}min`
    );

    // 5. Drift threshold — 3 minutes
    if (drift > 3) {
      logger.warn(`Delay detected: session ${sessionId} drifted ${drift}min beyond initial ETA`);
      // Day 20 will handle fallback trigger here
    }

  } catch (err) {
    logger.error(`Delay detection error: session ${sessionId}`, err);
    throw err; // Bull will retry the job
  }
});

// ── Queue event listeners ───────────────────────────────────────────────────
delayQueue.on('failed', (job, err) => {
  logger.error(`Delay job failed: ${job.id}`, err.message);
});

delayQueue.on('error', (err) => {
  logger.error('Delay queue error: ' + err.message + ' | ' + err.stack);
});

module.exports = { delayQueue, scheduleDelayDetection, cancelDelayDetection };