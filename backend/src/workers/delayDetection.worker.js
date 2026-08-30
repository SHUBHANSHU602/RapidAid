const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 20;

const { Queue, Worker, QueueEvents } = require('bullmq');
const { getBullMQConnection } = require('../config/bullmq');
const redis = require('../config/redis');
const EmergencySession = require('../models/EmergencySession');
const logger = require('../utils/logger');

const connection = getBullMQConnection();
const delayQueue = new Queue('delay-detection', { connection });
const queueEvents = new QueueEvents('delay-detection', { connection });

queueEvents.on('failed', ({ jobId, failedReason }) => logger.error(`Delay job failed: ${jobId} | ${failedReason}`));

function getStallThresholdSeconds() {
  if (process.env.STALL_THRESHOLD_SECONDS) return Number(process.env.STALL_THRESHOLD_SECONDS);
  return process.env.DEMO_MODE === 'true' ? 30 : 120;
}

async function scheduleDelayDetection(sessionId, initialEtaMinutes) {
  try {
    const existingJobs = await delayQueue.getRepeatableJobs();
    const existing = existingJobs.find((j) => j.name === `delay:${sessionId}`);
    if (existing) await delayQueue.removeRepeatableByKey(existing.key);

    await redis.set(`session:${sessionId}:last_movement_at`, Date.now().toString(), 'EX', 7200);

    await delayQueue.add(
      `delay:${sessionId}`,
      { sessionId, initialEtaMinutes },
      {
        repeat: { every: process.env.DEMO_MODE === 'true' ? 15000 : 60000 },
        // BullMQ custom job ids cannot contain ':'. Keep the readable colon in the
        // repeatable job name, but use a safe id for the underlying job.
        jobId: `delay-${sessionId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }
    );
    logger.info(`Delay detection scheduled for ${sessionId}`);
  } catch (err) {
    logger.error(`Failed to schedule delay detection for ${sessionId}: ${err.message}`);
  }
}

async function cancelDelayDetection(sessionId) {
  try {
    const jobs = await delayQueue.getRepeatableJobs();
    const job = jobs.find((j) => j.name === `delay:${sessionId}`);
    if (job) await delayQueue.removeRepeatableByKey(job.key);
    await redis.del(`session:${sessionId}:last_movement_at`);
  } catch (err) {
    logger.error(`Failed to cancel delay detection: ${sessionId} | ${err.message}`);
  }
}

const worker = new Worker(
  'delay-detection',
  async (job) => {
    const { sessionId, initialEtaMinutes } = job.data;
    const session = await EmergencySession.findById(sessionId).lean();

    if (!session || ['RESOLVED', 'CANCELLED'].includes(session?.status)) {
      await cancelDelayDetection(sessionId);
      return;
    }
    if (!session.ambulanceId || !['ASSIGNED', 'EN_ROUTE', 'DELAYED'].includes(session.status)) return;

    const [etaRaw, lastMovementRaw] = await Promise.all([
      redis.get(`session:${sessionId}:eta`),
      redis.get(`session:${sessionId}:last_movement_at`),
    ]);

    const currentEta = etaRaw ? JSON.parse(etaRaw).etaMinutes : initialEtaMinutes;
    const drift = Number(currentEta) - Number(initialEtaMinutes);
    const stalledSeconds = lastMovementRaw ? Math.floor((Date.now() - Number(lastMovementRaw)) / 1000) : 0;
    const stallThreshold = getStallThresholdSeconds();

    const delayedByEta = drift > 3;
    const delayedByStall = session.status === 'EN_ROUTE' && stalledSeconds >= stallThreshold;

    if (delayedByEta || delayedByStall) {
      await handleDelay(sessionId, {
        drift,
        initialEtaMinutes,
        currentEta,
        stalledSeconds,
        reason: delayedByStall ? 'AMBULANCE_STALLED' : 'ETA_DRIFT',
      });
    }
  },
  { connection, concurrency: 5 }
);

worker.on('failed', (job, err) => logger.error(`Delay worker job failed: ${job?.id} | ${err.message}`));
worker.on('error', (err) => logger.error(`Delay worker error: ${err.message}`));

async function handleDelay(sessionId, data) {
  const session = await EmergencySession.findById(sessionId);
  if (!session || !['EN_ROUTE', 'DELAYED'].includes(session.status)) return;

  if (session.status !== 'DELAYED') {
    session.status = 'DELAYED';
    session.addEvent('DELAYED', {
      drift: data.drift,
      initialEta: data.initialEtaMinutes,
      currentEta: data.currentEta,
      stalledSeconds: data.stalledSeconds,
      reason: data.reason,
      detectedAt: new Date().toISOString(),
    });
    await session.save();
  }

  try {
    const { getIO } = require('../sockets/emergencyRoom');
    getIO().to(`session:${sessionId}`).emit('delay_detected', {
      sessionId,
      drift: data.drift,
      currentEta: data.currentEta,
      stalledSeconds: data.stalledSeconds,
      reason: data.reason,
      message: data.reason === 'AMBULANCE_STALLED'
        ? 'Ambulance movement has stopped. Evaluating reroute or replacement.'
        : 'Ambulance ETA has increased. Evaluating alternatives.',
    });
  } catch (err) {
    logger.warn(`Delay socket emit failed: ${err.message}`);
  }

  const { triggerFallback } = require('../services/fallbackService');
  await triggerFallback(sessionId, Number(data.currentEta) || Number(data.initialEtaMinutes) || 5);
}

logger.info('Delay detection worker initialized');

module.exports = { delayQueue, scheduleDelayDetection, cancelDelayDetection };
