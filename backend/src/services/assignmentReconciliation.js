const Ambulance = require('../models/Ambulance');
const EmergencySession = require('../models/EmergencySession');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const ACTIVE_STATUSES = new Set(['ASSIGNED', 'EN_ROUTE', 'DELAYED']);
const LOCK_KEY = 'maintenance:assignment-reconciliation';

// Repair Redis/Mongo divergence after process crashes and partial writes.
// Uses ownership-aware Mongo conditional updates; never takes a live Redis claim.
async function reconcileAssignments() {
  const token = String(process.pid) + ':' + Date.now();
  const acquired = await redis.set(LOCK_KEY, token, 'EX', 120, 'NX');
  if (acquired !== 'OK') return { skipped: true };

  const stats = { examined: 0, recovered: 0, inFlight: 0, inconsistent: 0 };
  try {
    const cursor = Ambulance.find({}).select('status assignedSessionId').lean().cursor();
    for await (const amb of cursor) {
      stats.examined++;
      const id = String(amb._id);
      const statusKey = `ambulance:${id}:status`;
      const reservationKey = `ambulance:${id}:reservation`;
      const [reservedFor, cachedStatus, listedAvailable] = await Promise.all([
        redis.get(reservationKey), redis.get(statusKey),
        redis.sismember('ambulance:available', id)
      ]);

      const session = amb.assignedSessionId
        ? await EmergencySession.findById(amb.assignedSessionId).select('status ambulanceId').lean()
        : null;
      const validAssignment = session && ACTIVE_STATUSES.has(session.status)
        && String(session.ambulanceId) === id;

      if (validAssignment) {
        if (amb.status !== 'BUSY' || cachedStatus !== 'BUSY' || listedAvailable === 1) {
          await Ambulance.updateOne({ _id: amb._id, assignedSessionId: amb.assignedSessionId },
            { $set: { status: 'BUSY' } });
          const pipeline = redis.pipeline();
          pipeline.set(statusKey, 'BUSY');
          pipeline.srem('ambulance:available', id);
          await pipeline.exec();
          stats.recovered++;
        }
        continue;
      }

      // A reservation is allowed five minutes to finish Mongo CAS.
      // Do not steal it while its Redis ownership lease is alive.
      if (reservedFor) {
        stats.inFlight++;
        continue;
      }

      if (amb.assignedSessionId || amb.status === 'BUSY' || cachedStatus === 'BUSY') {
        if (session && ACTIVE_STATUSES.has(session.status) &&
            String(session.ambulanceId) !== id) stats.inconsistent++;
        const repairedStatus = amb.status === 'OFFLINE' ? 'OFFLINE' : 'AVAILABLE';
        const repaired = await Ambulance.updateOne(
          { _id: amb._id, assignedSessionId: amb.assignedSessionId, status: amb.status },
          { $set: { assignedSessionId: null, status: repairedStatus } }
        );
        if (repaired.modifiedCount) {
          const pipeline = redis.pipeline();
          pipeline.set(statusKey, repairedStatus);
          if (repairedStatus === 'AVAILABLE') pipeline.sadd('ambulance:available', id);
          else pipeline.srem('ambulance:available', id);
          await pipeline.exec();
          stats.recovered++;
        }
      }
    }
    logger.info('assignment_reconciliation_complete', stats);
    return stats;
  } finally {
    const unlock = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      end
      return 0
    `;
    await redis.eval(unlock, 1, LOCK_KEY, token).catch(err =>
      logger.warn('assignment_reconciliation_unlock_failed', { error: err.message }));
  }
}

module.exports = { reconcileAssignments };
