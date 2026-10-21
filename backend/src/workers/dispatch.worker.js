const { lazyResource } = require('../config/resources');
const { Worker } = require('bullmq');
const { getBullMQConnection } = require('../config/bullmq');
const EmergencySession = require('../models/EmergencySession');
const { assignAmbulance } = require('../services/assignmentService');
const { scheduleDelayDetection } = require('./delayDetection.worker');
const { stopDispatch } = require('../services/dispatchQueue');
const { triageEmergency } = require('../services/ai/triageService');
const { selectHospital } = require('../services/ai/hospitalService');
const { generateFirstAid } = require('../services/ai/firstAidService');
const logger = require('../utils/logger');

async function dispatch(sessionId) {
  const session = await EmergencySession.findById(sessionId).lean();
  if (!session || session.status !== 'INITIATED' || session.ambulanceId) {
    await stopDispatch(sessionId);
    return;
  }
  const result = await assignAmbulance(sessionId, session.location.lat, session.location.lng);
  if (!result) return; // Remains INITIATED; scheduler retries when drivers become available.
  await stopDispatch(sessionId);
  await scheduleDelayDetection(sessionId, Math.max(1, Math.ceil(result.etaSeconds / 60)));
  logger.info('dispatch_completed', { sessionId, ambulanceId: String(result.ambulanceId), latencyMs: result.latency });
}

async function prepareAssistance(sessionId) {
  const session = await EmergencySession.findById(sessionId).lean();
  if (!session || ['CANCELLED', 'RESOLVED'].includes(session.status)) return;
  let triage = null;
  if (session.description?.trim().length >= 5) {
    triage = await triageEmergency(session.description, session.emergencyType);
  }
  const hospitals = await selectHospital(
    session.location.lat, session.location.lng, triage, session.emergencyType
  );
  const firstAid = session.description?.trim().length >= 5 && session.severityLevel >= 4
    ? await generateFirstAid(session.emergencyType, session.severityLevel, session.description)
    : null;
  const updated = await EmergencySession.findOneAndUpdate(
    { _id: sessionId, status: { $nin: ['CANCELLED', 'RESOLVED'] } },
    { $set: { hospitalRanking: hospitals, hospitalId: hospitals[0]?.id || null },
      $push: { eventLog: { status: 'ASSISTANCE_PREPARED', timestamp: new Date(), meta: { triage, generatedFirstAid: Boolean(firstAid) } } } },
    { new: true }
  );
  if (!updated) return;
  try {
    const { getIO } = require('../sockets/emergencyRoom');
    const room = getIO().to('session:' + sessionId);
    if (hospitals.length) room.emit('hospital_options', { sessionId, hospitalRanking: hospitals });
    if (firstAid) room.emit('specialised_first_aid', { sessionId, ...firstAid });
  } catch (error) { logger.warn('assistance_socket_delivery_failed', { error: error.message }); }
}

let worker;
function startDispatchWorker() {
  if (worker) return worker;
  worker = lazyResource(() => new Worker('emergency-dispatch', async (job) => {
    const { sessionId } = job.data;
    if (job.name === 'assign-ambulance') return dispatch(sessionId);
    if (job.name === 'prepare-assistance') return prepareAssistance(sessionId);
    throw new Error('Unknown dispatch job: ' + job.name);
  }, { connection: getBullMQConnection(), concurrency: 5 }));
  worker.on('failed', (job, error) => logger.error('dispatch_job_failed', {
    jobId: job?.id, error: error.message
  }));
  worker.on('error', (error) => logger.error('dispatch_worker_error', { error: error.message }));
  return worker;
}

module.exports = { startDispatchWorker };
