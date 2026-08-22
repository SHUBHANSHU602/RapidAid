const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const EmergencySession = require('../models/EmergencySession');
const { haversineDistance, getSingleETA } = require('../services/mapsService');
const redis = require('../config/redis');
const logger = require('../utils/logger');

let io;
const etaIntervals = new Map();

function initSocket(server) {
  const { Server } = require('socket.io');
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Redis adapter for horizontal scaling ──────────────────────────────────
  // Creates a pub/sub channel between multiple server instances
  // Any instance can emit to any room — Redis routes it correctly
  const Redis = require('ioredis');

  try {
    const pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      logger.warn(`Socket.io Redis pubClient error: ${err.message}`);
    });
    subClient.on('error', (err) => {
      logger.warn(`Socket.io Redis subClient error: ${err.message}`);
    });

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.io Redis adapter initialized — horizontal scaling enabled');
  } catch (err) {
    logger.warn('Socket.io Redis adapter failed — running single instance mode', err.message);
  }

  // ── JWT middleware ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token) {
        const authHeader = socket.handshake.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7).trim();
        }
      }
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} | user: ${socket.user.userId} | role: ${socket.user.role}`);

    // ── Patient joins session room ─────────────────────────────────────────
    socket.on('join_session', async ({ sessionId }) => {
      try {
        const session = await EmergencySession.findById(sessionId).lean();
        if (!session) return socket.emit('error', { message: 'Session not found' });

        const isOwner = session.userId.toString() === socket.user.userId;
        const isAdmin = socket.user.role.toLowerCase() === 'admin';

        if (!isOwner && !isAdmin) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        socket.join(`session:${sessionId}`);
        socket.emit('joined_session', { sessionId });
        logger.info(`Patient ${socket.user.userId} joined room session:${sessionId}`);
      } catch (err) {
        logger.error('join_session error', err);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // ── Driver joins session room ──────────────────────────────────────────
    socket.on('join_as_driver', async ({ sessionId }) => {
      try {
        const role = socket.user.role.toLowerCase();
        if (role !== 'driver' && role !== 'admin') {
          return socket.emit('error', { message: 'Driver role required' });
        }

        const session = await EmergencySession.findById(sessionId).lean();
        if (!session) return socket.emit('error', { message: 'Session not found' });

        socket.join(`session:${sessionId}`);
        socket.currentSessionId = sessionId;
        socket.patientLocation = {
          latitude: session.location.lat,
          longitude: session.location.lng,
        };

        socket.emit('joined_as_driver', { sessionId });
        logger.info(`Driver ${socket.user.userId} joined room session:${sessionId}`);
        startETAInterval(socket, sessionId);
      } catch (err) {
        logger.error('join_as_driver error', err);
        socket.emit('error', { message: 'Failed to join as driver' });
      }
    });

    // ── Driver location update with delta compression ──────────────────────
    socket.on('location_update', async ({ latitude, longitude }) => {
      try {
        const role = socket.user.role.toLowerCase();
        if (role !== 'driver' && role !== 'admin') {
          return socket.emit('error', { message: 'Driver role required' });
        }
        if (!socket.currentSessionId) {
          return socket.emit('error', { message: 'Join a session first' });
        }
        if (
          typeof latitude !== 'number' || typeof longitude !== 'number' ||
          latitude < -90 || latitude > 90 ||
          longitude < -180 || longitude > 180
        ) {
          return socket.emit('error', { message: 'Invalid coordinates' });
        }

        const ambulanceKey = `ambulance:${socket.user.userId}:location`;
        const lastRaw = await redis.get(ambulanceKey);

        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          const distanceKm = haversineDistance(last.latitude, last.longitude, latitude, longitude);
          if (distanceKm * 1000 < 10) {
            logger.debug(`Delta compression: driver ${socket.user.userId} moved ${(distanceKm * 1000).toFixed(1)}m — skipped`);
            return;
          }
        }

        const locationData = { latitude, longitude, timestamp: new Date().toISOString() };
        await redis.set(ambulanceKey, JSON.stringify(locationData), 'EX', 300);
        socket.driverLocation = { latitude, longitude };

        io.to(`session:${socket.currentSessionId}`).emit('driver_location', {
          driverId: socket.user.userId,
          latitude,
          longitude,
          timestamp: locationData.timestamp,
        });
      } catch (err) {
        logger.error('location_update error', err);
        socket.emit('error', { message: 'Failed to process location update' });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} | user: ${socket.user.userId}`);
      if (!socket.currentSessionId) return;

      const sessionId = socket.currentSessionId;
      const userId = socket.user.userId;

      stopETAInterval(sessionId);

      const locationKey = `ambulance:${userId}:location`;
      const lastLocation = await redis.get(locationKey);

      if (lastLocation) {
        await redis.expire(locationKey, 300);
        logger.info(`Driver ${userId} disconnected — location preserved for 5min`);
      }

      const parsedLocation = lastLocation ? JSON.parse(lastLocation) : null;

      io.to(`session:${sessionId}`).emit('driver_disconnected', {
        driverId: userId,
        sessionId,
        lastKnownLocation: parsedLocation
          ? { latitude: parsedLocation.latitude, longitude: parsedLocation.longitude }
          : null,
        disconnectedAt: new Date().toISOString(),
        locationPreservedUntil: parsedLocation
          ? new Date(Date.now() + 300000).toISOString()
          : null,
      });
    });
  });

  return io;
}

// ── ETA interval helpers ──────────────────────────────────────────────────────
function startETAInterval(socket, sessionId) {
  if (etaIntervals.has(sessionId)) {
    clearInterval(etaIntervals.get(sessionId));
  }

  const intervalId = setInterval(async () => {
    try {
      const driverLoc = socket.driverLocation || await getDriverLocationFromRedis(socket.user.userId);
      if (!driverLoc) {
        logger.debug(`ETA interval: no driver location yet for session ${sessionId}`);
        return;
      }

      const { latitude: dLat, longitude: dLng } = driverLoc;
      const { latitude: pLat, longitude: pLng } = socket.patientLocation;
      const etaMinutes = await getSingleETA(dLat, dLng, pLat, pLng);

      const etaKey = `session:${sessionId}:eta`;
      await redis.set(etaKey, JSON.stringify({
        etaMinutes,
        calculatedAt: new Date().toISOString(),
      }), 'EX', 90);

      io.to(`session:${sessionId}`).emit('eta_update', {
        sessionId,
        etaMinutes,
        calculatedAt: new Date().toISOString(),
      });

      logger.debug(`ETA updated: session ${sessionId} → ${etaMinutes} min`);
    } catch (err) {
      logger.error(`ETA interval error for session ${sessionId}`, err);
    }
  }, 30000);

  etaIntervals.set(sessionId, intervalId);
  logger.info(`ETA interval started for session ${sessionId}`);
}

function stopETAInterval(sessionId) {
  if (etaIntervals.has(sessionId)) {
    clearInterval(etaIntervals.get(sessionId));
    etaIntervals.delete(sessionId);
    logger.info(`ETA interval stopped for session ${sessionId}`);
  }
}

async function getDriverLocationFromRedis(userId) {
  const raw = await redis.get(`ambulance:${userId}:location`);
  return raw ? JSON.parse(raw) : null;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };