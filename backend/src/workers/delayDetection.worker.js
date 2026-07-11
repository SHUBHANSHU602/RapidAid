const Bull = require('bull');
const redis = require('../config/redis');
const EmergencySession = require('../models/EmergencySession');
const { getSingleETA } = require('../services/mapsService');
const logger = require('../utils/logger');

// Create the Bull queue — backed by the same Redis instance
const delayQueue = new Bull('delay-detection', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  },
});

/**
 * Add a delay detection job for a session.
 * Called when an ambulance is assigned to a session.
 * @param {string} sessionId
 * @param {number} initialEtaMinutes
 */
async function scheduleDelayDetection(sessionId, initialEtaMinutes) {
  await delayQueue.add(
    { sessionId, initialEtaMinutes },
    {
      repeat: { every: 60000 }, // repeat every 60 seconds
      jobId: `delay:${sessionId}`, // idempotent — same session won't get duplicate jobs
    }
  );
  logger.info(`Delay detection scheduled for session ${sessionId} (initial ETA: ${initialEtaMinutes}min)`);
}

/**
 * Remove delay detection job when session resolves.
 * @param {string} sessionId
 */
async function cancelDelayDetection(sessionId) {
  const jobs = await delayQueue.getRepeatableJobs();
  const job = jobs.find(j => j.id === `delay:${sessionId}`);
  if (job) {
    await delayQueue.removeRepeatableByKey(job.key);
    logger.info(`Delay detection cancelled for session ${sessionId}`);
  }
}

// Process jobs — this is the worker function
delayQueue.process(async (job) => {
  const { sessionId, initialEtaMinutes } = job.data;

  try {
    // 1. Load session
    const session = await EmergencySession.findById(sessionId).lean();
    if (!session) {
      logger.warn(`Delay check: session ${sessionId} not found — removing job`);
      await cancelDelayDetection(sessionId);
      return;
    }

    // 2. Skip if session already resolved or no ambulance assigned
    if (['RESOLVED', 'CANCELLED'].includes(session.status)) {
      await cancelDelayDetection(sessionId);
      return;
    }

    if (!session.ambulanceId) {
      logger.debug(`Delay check: no ambulance assigned yet for session ${sessionId}`);
      return;
    }

    // 3. Get current ETA from Redis
    const etaRaw = await redis.get(`session:${sessionId}:eta`);
    if (!etaRaw) {
      logger.debug(`Delay check: no ETA in Redis for session ${sessionId}`);
      return;
    }

    const { etaMinutes: currentEta } = JSON.parse(etaRaw);

    // 4. Drift detection — if current ETA exceeds initial ETA by more than 3 minutes
    const drift = currentEta - initialEtaMinutes;
    logger.debug(`Delay check session ${sessionId}: initial=${initialEtaMinutes}min current=${currentEta}min drift=${drift}min`);

    if (drift > 3) {
      logger.warn(`Delay detected: session ${sessionId} drifted ${drift}min beyond initial ETA`);
      // Day 20 will handle the actual fallback trigger here
      // For now just log it
    }
  } catch (err) {
    logger.error(`Delay detection error for session ${sessionId}`, err);
    throw err; // Bull will retry the job
  }
});

delayQueue.on('failed', (job, err) => {
  logger.error(`Delay detection job failed: ${job.id}`, err);
});

module.exports = { delayQueue, scheduleDelayDetection, cancelDelayDetection };