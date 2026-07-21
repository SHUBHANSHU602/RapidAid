const EmergencySession = require('../models/EmergencySession');
const AppError = require('../utils/AppError');
const { assignAmbulance } = require('../services/assignmentService');
const { scheduleDelayDetection } = require('../workers/delayDetection.worker');
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
      .populate('ambulanceId', 'currentLocation status')
      .populate('hospitalId', 'name address');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (
      session.userId.toString() !== req.user.userId.toString() &&
      req.user.role.toLowerCase() !== 'admin'
    ) {
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