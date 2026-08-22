const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 20;

const { Queue, Worker, QueueEvents } = require('bullmq');
const { getBullMQConnection } = require('../config/bullmq');
const redis = require('../config/redis');
const EmergencySession = require('../models/EmergencySession');
const logger = require('../utils/logger');

const connection = getBullMQConnection();

// Create queue
const delayQueue = new Queue('delay-detection', { connection });

// Queue events for monitoring
const queueEvents = new QueueEvents('delay-detection', { connection });

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Delay job failed: ${jobId} | ${failedReason}`);
});

/**
 * Schedule a repeating delay detection job for a session.
 * @param {string} sessionId
 * @param {number} initialEtaMinutes
 */
async function scheduleDelayDetection(sessionId, initialEtaMinutes) {
  try {
    // Remove existing job first to avoid duplicates
    const existingJobs = await delayQueue.getRepeatableJobs();
    const existing = existingJobs.find(j => j.name === `delay:${sessionId}`);
    if (existing) {
      await delayQueue.removeRepeatableByKey(existing.key);
    }

    await delayQueue.add(
      `delay:${sessionId}`,
      { sessionId, initialEtaMinutes },
      {
        repeat: { every: 60000 },
        jobId: `delay:${sessionId}`,
      }
    );

    logger.info(`Delay detection scheduled: session ${sessionId} | initial ETA: ${initialEtaMinutes}min`);
  } catch (err) {
    logger.error(`Failed to schedule delay detection: ${sessionId}`, err.message);
  }
}

/**
 * Cancel delay detection job when session resolves.
 * @param {string} sessionId
 */
async function cancelDelayDetection(sessionId) {
  try {
    const jobs = await delayQueue.getRepeatableJobs();
    const job = jobs.find(j => j.name === `delay:${sessionId}`);
    if (job) {
      await delayQueue.removeRepeatableByKey(job.key);
      logger.info(`Delay detection cancelled: session ${sessionId}`);
    }
  } catch (err) {
    logger.error(`Failed to cancel delay detection: ${sessionId}`, err.message);
  }
}

// Worker — processes each job
const worker = new Worker(
  'delay-detection',
  async (job) => {
    const { sessionId, initialEtaMinutes } = job.data;
    logger.debug(`Delay check running: session ${sessionId}`);

    try {
      // Load session
      const session = await EmergencySession.findById(sessionId).lean();

      if (!session) {
        logger.warn(`Delay check: session ${sessionId} not found — cancelling`);
        await cancelDelayDetection(sessionId);
        return;
      }

      // Skip if resolved or cancelled
      if (['RESOLVED', 'CANCELLED'].includes(session.status)) {
        logger.debug(`Delay check: session ${sessionId} is ${session.status} — cancelling`);
        await cancelDelayDetection(sessionId);
        return;
      }

      // Skip if no ambulance
      if (!session.ambulanceId) {
        logger.debug(`Delay check: no ambulance for session ${sessionId}`);
        return;
      }

      // Get current ETA from Redis
      const etaRaw = await redis.get(`session:${sessionId}:eta`);
      if (!etaRaw) {
        logger.debug(`Delay check: no ETA in Redis for session ${sessionId}`);
        return;
      }

      const { etaMinutes: currentEta } = JSON.parse(etaRaw);
      const drift = currentEta - initialEtaMinutes;

      logger.debug(
        `Delay check: session ${sessionId} | initial=${initialEtaMinutes}min | current=${currentEta}min | drift=${drift}min`
      );

      if (drift > 3) {
        await handleDelay(sessionId, drift, initialEtaMinutes, currentEta);
      }
    } catch (err) {
      logger.error(`Delay detection error: session ${sessionId}`, err.message);
      throw err; // BullMQ retries on throw
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  logger.error(`Delay worker job failed: ${job?.id}`, err.message);
});

worker.on('error', (err) => {
  logger.error(`Delay worker error: ${err.message}`);
});

// Handle delay logic
async function handleDelay(sessionId, drift, initialEtaMinutes, currentEta) {
  logger.warn(`Delay detected: session ${sessionId} drifted ${drift}min`);

  const session = await EmergencySession.findById(sessionId);
  if (!session) return;

  if (session.status !== 'EN_ROUTE') {
    logger.debug(`Delay handler: session ${sessionId} is ${session.status} — skipping`);
    return;
  }

  session.status = 'DELAYED';
  session.addEvent('DELAYED', {
    drift,
    initialEta: initialEtaMinutes,
    currentEta,
    detectedAt: new Date().toISOString(),
  });
  await session.save();

  logger.info(`Session ${sessionId} → DELAYED`);

  // Emit to session room
  try {
    const { getIO } = require('../sockets/emergencyRoom');
    getIO().to(`session:${sessionId}`).emit('delay_detected', {
      sessionId,
      drift,
      currentEta,
      message: 'Ambulance is delayed. Evaluating alternatives.',
    });
  } catch (e) {
    logger.warn('Delay handler: socket emit failed', e.message);
  }

  // Trigger fallback chain
  try {
    const { triggerFallback } = require('../services/fallbackService');
    await triggerFallback(sessionId, currentEta);
  } catch (e) {
    logger.error('Delay handler: fallback failed', e.message);
  }
}

logger.info('Delay detection worker initialized');

module.exports = { delayQueue, scheduleDelayDetection, cancelDelayDetection };