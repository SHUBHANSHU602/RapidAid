const EmergencySession = require('../models/EmergencySession');
const Ambulance = require('../models/Ambulance');
const AppError = require('../utils/AppError');
const { assignAmbulance } = require('../services/assignmentService');
const { scheduleDelayDetection, cancelDelayDetection } = require('../workers/delayDetection.worker');
const { updateAmbulanceStatus } = require('../services/ambulanceCache');
const { getIO } = require('../sockets/emergencyRoom');
const logger = require('../utils/logger');

exports.triggerEmergency = async (req, res, next) => {
  try {
    const { lat, lng, emergencyType, severityLevel } = req.body;

    // Create session in INITIATED state
    const session = await EmergencySession.create({
      userId: req.user.userId,
      location: { lat, lng },
      emergencyType,
      severityLevel,
    });

    // Trigger assignment asynchronously after a short grace period so the client
    // can join the session room before the assignment event is emitted.
    setTimeout(() => {
      assignAmbulance(session._id, lat, lng)
        .then(async (result) => {
          if (result) {
            logger.info(`Assigned ambulance ${result.ambulanceId} in ${result.latency}ms`);

            // Schedule delay detection after successful assignment
            try {
              const etaMinutes = Math.ceil((result.etaSeconds || 0) / 60) || 5;
              await scheduleDelayDetection(session._id.toString(), etaMinutes);
            } catch (err) {
              logger.warn('Failed to schedule delay detection', err.message);
            }
          }
        })
        .catch((err) => {
          logger.error('Assignment failed:', err.message);
        });
    }, 500);

    res.status(201).json({
      success: true,
      message: 'Emergency session created — assigning ambulance',
      data: {
        sessionId: session._id,
        status: session.status,
        emergencyType: session.emergencyType,
        severityLevel: session.severityLevel,
        location: session.location,
        createdAt: session.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const session = await EmergencySession.findById(req.params.id)
      .populate('ambulanceId', 'currentLocation status vehicleNumber driverName driverId')
      .populate('hospitalId', 'name address')
      .populate('userId', 'name email');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    const isOwner = session.userId?._id?.toString() === req.user.userId.toString();
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    const isDriver = req.user.role.toLowerCase() === 'driver';

    if (!isOwner && !isAdmin && !isDriver) {
      return next(new AppError('Not authorized to view this session', 403));
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllSessions = async (req, res, next) => {
  try {
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    const filter = isAdmin ? {} : { userId: req.user.userId };

    const sessions = await EmergencySession.find(filter)
      .sort({ createdAt: -1 })
      .populate('ambulanceId', 'currentLocation status vehicleNumber driverName')
      .populate('hospitalId', 'name address')
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
};

exports.transitionSession = async (req, res, next) => {
  try {
    const { status, metadata = {} } = req.body;
    const validStatuses = ['INITIATED', 'ASSIGNED', 'EN_ROUTE', 'DELAYED', 'RESOLVED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status: ${status}`, 400));
    }

    const session = await EmergencySession.findById(req.params.id);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    const previousStatus = session.status;
    session.addEvent(status, { ...metadata, transitionedBy: req.user.userId, role: req.user.role });
    session.status = status;
    if (status === 'RESOLVED') {
      session.resolvedAt = new Date();
    }
    await session.save();

    // If resolved, cancel delay detection and free ambulance
    if (['RESOLVED', 'CANCELLED'].includes(status)) {
      await cancelDelayDetection(session._id.toString());
      if (session.ambulanceId) {
        try {
          await updateAmbulanceStatus(session.ambulanceId.toString(), 'AVAILABLE');
          await Ambulance.findByIdAndUpdate(session.ambulanceId, {
            status: 'AVAILABLE',
            assignedSessionId: null,
          });
        } catch (ambErr) {
          logger.warn('Failed to reset ambulance status on resolve:', ambErr.message);
        }
      }
    }

    // Emit session_status_changed event to room
    try {
      const io = getIO();
      io.to(`session:${session._id}`).emit('session_status_changed', {
        sessionId: session._id,
        previousStatus,
        newStatus: status,
        transitionedAt: new Date().toISOString(),
        metadata,
      });
      logger.info(`Emitted session_status_changed: ${session._id} → ${status}`);
    } catch (socketErr) {
      logger.warn('Socket emit failed during status transition:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Session transitioned to ${status}`,
      data: session,
    });
  } catch (err) {
    next(err);
  }
};