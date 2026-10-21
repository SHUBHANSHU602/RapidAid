const { Queue } = require('bullmq');
const { getBullMQConnection } = require('../config/bullmq');
const EmergencySession = require('../models/EmergencySession');
const logger = require('../utils/logger');

const dispatchQueue = new Queue('emergency-dispatch', {
  connection: getBullMQConnection(),
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 100, removeOnFail: 100 }
});

// A repeatable job scheduler is durable and survives the API process crashing.
// The worker removes this scheduler immediately after successful assignment.
async function scheduleDispatch(sessionId) {
  const id = String(sessionId);
  return dispatchQueue.upsertJobScheduler('dispatch-' + id, { every: 15000 }, {
    name: 'assign-ambulance', data: { sessionId: id },
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
  });
}

async function stopDispatch(sessionId) {
  await dispatchQueue.removeJobScheduler('dispatch-' + String(sessionId));
}

async function enqueueAssistance(sessionId) {
  return dispatchQueue.add('prepare-assistance', { sessionId: String(sessionId) }, {
    jobId: 'assist-' + String(sessionId), attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}

async function recoverPendingDispatches() {
  const cursor = EmergencySession.find({ status: 'INITIATED', ambulanceId: null }).select('_id').lean().cursor();
  let recovered = 0;
  for await (const session of cursor) {
    try { await scheduleDispatch(session._id); recovered++; }
    catch (error) { logger.error('dispatch_recovery_failed', { sessionId: String(session._id), error: error.message }); }
  }
  logger.info('dispatch_recovery_complete', { recovered });
  return recovered;
}

module.exports = { dispatchQueue, scheduleDispatch, stopDispatch, enqueueAssistance, recoverPendingDispatches };
