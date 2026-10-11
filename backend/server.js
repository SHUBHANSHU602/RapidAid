require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./src/config/db');
const redis = require('./src/config/redis');
const logger = require('./src/utils/logger');
const EmergencySession = require('./src/models/EmergencySession');
const { syncAmbulancesToRedis } = require('./src/services/ambulanceCache');
const { initSocket } = require('./src/sockets/emergencyRoom');
require('./src/workers/mapsQueue.worker');
const { scheduleDelayDetection } = require('./src/workers/delayDetection.worker');
const PORT = process.env.PORT || 5000;

function getRecoveryWindowHours() {
  if (process.env.ACTIVE_SESSION_RECOVERY_HOURS) {
    const configured = Number(process.env.ACTIVE_SESSION_RECOVERY_HOURS);
    if (Number.isFinite(configured) && configured > 0) return configured;
  }
  return process.env.DEMO_MODE === 'true' ? 2 : 12;
}

async function recoverActiveDelayMonitors() {
  try {
    const recoveryHours = getRecoveryWindowHours();
    const cutoff = new Date(Date.now() - recoveryHours * 60 * 60 * 1000);

    const sessions = await EmergencySession.find({
      ambulanceId: { $ne: null },
      status: { $in: ['ASSIGNED', 'EN_ROUTE', 'DELAYED'] },
      updatedAt: { $gte: cutoff },
    }).lean();

    let recovered = 0;
    for (const session of sessions) {
      let initialEtaMinutes = null;

      try {
        const etaRaw = await redis.get(`session:${session._id}:eta`);
        if (etaRaw) {
          const parsed = JSON.parse(etaRaw);
          if (Number(parsed.etaMinutes) > 0) initialEtaMinutes = Number(parsed.etaMinutes);
        }
      } catch {
        // Recover from the durable assignment event below.
      }

      if (!initialEtaMinutes) {
        const assignedEvent = [...(session.eventLog || [])]
          .reverse()
          .find((event) => event.status === 'ASSIGNED' && Number(event.meta?.etaSeconds) > 0);
        if (assignedEvent) initialEtaMinutes = Math.max(1, Number(assignedEvent.meta.etaSeconds) / 60);
      }

      if (!initialEtaMinutes) initialEtaMinutes = 5;
      const scheduled = await scheduleDelayDetection(session._id, initialEtaMinutes);
      if (scheduled) recovered += 1;
    }

    if (recovered) logger.info(`Recovered delay monitoring for ${recovered} recent active session(s)`);
    if (sessions.length && recovered !== sessions.length) {
      logger.warn(`Delay monitor recovery incomplete: ${recovered}/${sessions.length} recent active session(s)`);
    }
    logger.info(`Delay recovery window: last ${recoveryHours} hour(s)`);
  } catch (err) {
    logger.warn(`Failed to recover active delay monitors: ${err.message}`);
  }
}

const startServer = async () => {
  await connectDB();

  try {
    const count = await syncAmbulancesToRedis();
    logger.info(`Synced ${count} ambulances to Redis`);
  } catch (err) {
    logger.warn(`Failed to sync ambulances to Redis: ${err.message}`);
  }

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  // Restore monitoring only for recent live-looking emergencies after a restart.
  // Old unfinished demo records remain in MongoDB but are not resurrected as live trips.
  await recoverActiveDelayMonitors();

  httpServer.listen(PORT, () => {
    logger.info(`RapidAid server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info('Socket.io ready');
  });
};

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

startServer();
