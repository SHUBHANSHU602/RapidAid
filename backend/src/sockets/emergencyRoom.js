const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const EmergencySession = require('../models/EmergencySession');
const Ambulance = require('../models/Ambulance');
const { haversineDistance, getSingleETA } = require('../services/mapsService');
const { updateAmbulanceLocation } = require('../services/ambulanceCache');
const redis = require('../config/redis');
const logger = require('../utils/logger');

let io;
const etaIntervals = new Map();

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((s) => s.trim()) : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const Redis = require('ioredis');
  try {
    const pubClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });
    const subClient = pubClient.duplicate();
    pubClient.on('error', (err) => logger.warn(`Socket Redis pub error: ${err.message}`));
    subClient.on('error', (err) => logger.warn(`Socket Redis sub error: ${err.message}`));
    io.adapter(createAdapter(pubClient, subClient));
  } catch (err) {
    logger.warn(`Socket Redis adapter unavailable; single-instance mode: ${err.message}`);
  }

  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
        token = socket.handshake.headers.authorization.slice(7).trim();
      }
      if (!token) return next(new Error('Authentication required'));
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const role = socket.user.role.toLowerCase();
    logger.info(`Socket connected ${socket.id} user=${socket.user.userId} role=${role}`);

    if (role === 'driver') {
      socket.join(`driver:${socket.user.userId}`);
      try {
        const ambulance = await Ambulance.findOne({ driverId: socket.user.userId }).lean();
        if (ambulance) socket.ambulanceId = ambulance._id.toString();
      } catch (err) {
        logger.warn(`Failed to resolve driver's ambulance: ${err.message}`);
      }
    }

    socket.on('join_session', async ({ sessionId }) => {
      try {
        const session = await EmergencySession.findById(sessionId).lean();
        if (!session) return socket.emit('error', { message: 'Session not found' });
        const isOwner = session.userId.toString() === socket.user.userId.toString();
        const isAdmin = role === 'admin';
        if (!isOwner && !isAdmin) return socket.emit('error', { message: 'Not authorized' });
        socket.join(`session:${sessionId}`);
        socket.emit('joined_session', { sessionId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    socket.on('join_as_driver', async ({ sessionId }) => {
      try {
        if (!['driver', 'admin'].includes(role)) return socket.emit('error', { message: 'Driver role required' });
        const session = await EmergencySession.findById(sessionId).lean();
        if (!session) return socket.emit('error', { message: 'Session not found' });

        if (role === 'driver') {
          if (!socket.ambulanceId) {
            const ambulance = await Ambulance.findOne({ driverId: socket.user.userId }).lean();
            socket.ambulanceId = ambulance?._id?.toString();
          }
          if (!socket.ambulanceId || session.ambulanceId?.toString() !== socket.ambulanceId) {
            return socket.emit('error', { message: 'This emergency is assigned to another ambulance' });
          }
        }

        socket.join(`session:${sessionId}`);
        socket.currentSessionId = sessionId;
        socket.patientLocation = { lat: session.location.lat, lng: session.location.lng };
        await redis.setnx(`session:${sessionId}:last_movement_at`, Date.now().toString());
        await redis.expire(`session:${sessionId}:last_movement_at`, 7200);
        socket.emit('joined_as_driver', { sessionId, ambulanceId: socket.ambulanceId });
        startETAInterval(socket, sessionId);
      } catch (err) {
        logger.error('join_as_driver error', err);
        socket.emit('error', { message: 'Failed to join as driver' });
      }
    });

    socket.on('location_update', async ({ latitude, longitude }) => {
      try {
        if (!['driver', 'admin'].includes(role)) return socket.emit('error', { message: 'Driver role required' });
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          return socket.emit('error', { message: 'Invalid coordinates' });
        }

        if (!socket.ambulanceId && role === 'driver') {
          const ambulance = await Ambulance.findOne({ driverId: socket.user.userId }).lean();
          socket.ambulanceId = ambulance?._id?.toString();
        }
        if (!socket.ambulanceId) return socket.emit('error', { message: 'No ambulance linked to this driver' });

        const key = `ambulance:${socket.ambulanceId}:location`;
        const lastRaw = await redis.get(key);
        let movedMeters = Infinity;
        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          const lastLat = last.lat ?? last.latitude;
          const lastLng = last.lng ?? last.longitude;
          movedMeters = haversineDistance(lastLat, lastLng, latitude, longitude) * 1000;
        }

        if (movedMeters >= 10) {
          const locationData = await updateAmbulanceLocation(socket.ambulanceId, latitude, longitude, true);
          socket.driverLocation = { lat: latitude, lng: longitude };

          if (socket.currentSessionId) {
            await redis.set(`session:${socket.currentSessionId}:last_movement_at`, Date.now().toString(), 'EX', 7200);
            io.to(`session:${socket.currentSessionId}`).emit('driver_location', {
              driverId: socket.user.userId,
              ambulanceId: socket.ambulanceId,
              latitude,
              longitude,
              timestamp: locationData.updatedAt,
            });
          }
        } else {
          await redis.expire(key, 300);
        }
      } catch (err) {
        logger.error('location_update error', err);
        socket.emit('error', { message: 'Failed to process location update' });
      }
    });

    socket.on('disconnect', async () => {
      if (!socket.currentSessionId) return;
      const sessionId = socket.currentSessionId;
      stopETAInterval(sessionId);
      const key = socket.ambulanceId ? `ambulance:${socket.ambulanceId}:location` : null;
      const raw = key ? await redis.get(key) : null;
      if (key && raw) await redis.expire(key, 300);
      const location = raw ? JSON.parse(raw) : null;
      io.to(`session:${sessionId}`).emit('driver_disconnected', {
        driverId: socket.user.userId,
        ambulanceId: socket.ambulanceId,
        lastKnownLocation: location ? { latitude: location.lat ?? location.latitude, longitude: location.lng ?? location.longitude } : null,
        disconnectedAt: new Date().toISOString(),
      });
    });
  });

  return io;
}

function startETAInterval(socket, sessionId) {
  stopETAInterval(sessionId);

  const calculate = async () => {
    try {
      let driverLoc = socket.driverLocation;
      if (!driverLoc && socket.ambulanceId) {
        const raw = await redis.get(`ambulance:${socket.ambulanceId}:location`);
        if (raw) {
          const loc = JSON.parse(raw);
          driverLoc = { lat: loc.lat ?? loc.latitude, lng: loc.lng ?? loc.longitude };
        }
      }
      if (!driverLoc || !socket.patientLocation) return;

      const etaMinutes = await getSingleETA(driverLoc.lat, driverLoc.lng, socket.patientLocation.lat, socket.patientLocation.lng);
      await redis.set(`session:${sessionId}:eta`, JSON.stringify({ etaMinutes, calculatedAt: new Date().toISOString() }), 'EX', 90);
      io.to(`session:${sessionId}`).emit('eta_update', { sessionId, etaMinutes, calculatedAt: new Date().toISOString() });
    } catch (err) {
      logger.error(`ETA calculation failed for ${sessionId}: ${err.message}`);
    }
  };

  calculate();
  const intervalId = setInterval(calculate, 30000);
  etaIntervals.set(sessionId, intervalId);
}

function stopETAInterval(sessionId) {
  if (etaIntervals.has(sessionId)) {
    clearInterval(etaIntervals.get(sessionId));
    etaIntervals.delete(sessionId);
  }
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
