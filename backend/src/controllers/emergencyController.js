const EmergencySession = require('../models/EmergencySession');
const Ambulance = require('../models/Ambulance');
const AppError = require('../utils/AppError');
const { assignAmbulance } = require('../services/assignmentService');
const { scheduleDelayDetection, cancelDelayDetection } = require('../workers/delayDetection.worker');
const { updateAmbulanceStatus } = require('../services/ambulanceCache');
const { getIO } = require('../sockets/emergencyRoom');
const logger = require('../utils/logger');
const { triageEmergency } = require('../services/ai/triageService');
const { selectHospital } = require('../services/ai/hospitalService');

// After triageResult is set:
let hospitalRanking = [];
let topHospitalId = null;

try {
  hospitalRanking = await selectHospital(lat, lng, triageResult, emergencyType);
  if (hospitalRanking.length > 0) {
    topHospitalId = hospitalRanking[0].id;
    logger.info(`Hospital selected: ${hospitalRanking[0].name}`);
  }
} catch (err) {
  logger.warn('Hospital selection failed — no hospital assigned', err.message);
}

// Create session with hospitalId
const session = await EmergencySession.create({
  userId: req.user.userId,
  location: { lat, lng },
  emergencyType,
  severityLevel: finalSeverity,
  hospitalId: topHospitalId || null,
});

// Add to response:
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
    triage: triageResult,
    hospitalRanking,
  },
});
// Inside triggerEmergency, after extracting req.body:
const { lat, lng, emergencyType, severityLevel, description = '' } = req.body;

// Run AI triage if description provided
let triageResult = null;
let finalSeverity = severityLevel;

try {
  triageResult = await triageEmergency(description, emergencyType);
  // Override severity only when AI is highly confident
  if (triageResult.confidence === 'high') {
    finalSeverity = triageResult.severity;
    logger.info(`Triage override: user=${severityLevel} → ai=${finalSeverity}`);
  }
} catch (err) {
  logger.warn('Triage failed — using user-provided severity', err.message);
}

// Create session using finalSeverity instead of severityLevel
const session = await EmergencySession.create({
  userId: req.user.userId,
  location: { lat, lng },
  emergencyType,
  severityLevel: finalSeverity,
});
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
    triage: triageResult,
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
const { cancelDelayDetection } = require('../workers/delayDetection.worker');

/**
 * POST /api/v1/emergency/:id/transition
 * Transition session to a new state with optional metadata.
 * Enforces valid state machine transitions server-side.
 */
exports.transitionSession = async (req, res, next) => {
  try {
    const { status, metadata = {} } = req.body;

    const validTransitions = {
      INITIATED:  ['ASSIGNED'],
      ASSIGNED:   ['EN_ROUTE', 'CANCELLED'],
      EN_ROUTE:   ['DELAYED', 'RESOLVED'],
      DELAYED:    ['EN_ROUTE', 'RESOLVED', 'CANCELLED'],
    };

    const session = await EmergencySession.findById(req.params.id);
    if (!session) return next(new AppError('Session not found', 404));

    const isOwner = session.userId.toString() === req.user.userId;
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    if (!isOwner && !isAdmin) return next(new AppError('Not authorized', 403));

    const allowed = validTransitions[session.status] || [];
    if (!allowed.includes(status)) {
      return next(new AppError(
        `Cannot transition from ${session.status} to ${status}. Allowed: ${allowed.join(', ')}`,
        400
      ));
    }

    const previousStatus = session.status;
    session.status = status;
    session.addEvent(status, { previousStatus, ...metadata });

    if (status === 'RESOLVED') {
      session.resolvedAt = new Date();
      try {
        await cancelDelayDetection(session._id.toString());
      } catch (e) {
        logger.warn('transitionSession: cancelDelayDetection failed', e.message);
      }
    }

    await session.save();

    // Emit to session room
    try {
      const { getIO } = require('../sockets/emergencyRoom');
      getIO().to(`session:${session._id}`).emit('session_status_changed', {
        sessionId: session._id,
        previousStatus,
        newStatus: status,
        metadata,
        changedAt: new Date().toISOString(),
      });
    } catch (e) {
      logger.warn('transitionSession: socket emit failed', e.message);
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};
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