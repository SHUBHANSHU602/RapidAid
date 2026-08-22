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
const { generateFirstAid } = require('../services/ai/firstAidService');
const { getGeneralFirstAid } = require('../services/ai/generalFirstAidService');
const redis = require('../config/redis');

// ── Helper: emit to session room safely ──────────────────────────────────────
function emitToRoom(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    logger.warn(`emitToRoom failed: ${room} ${event}`, err.message);
  }
}

// ── Helper: generate 4-digit OTP ─────────────────────────────────────────────
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ── POST /api/v1/emergency/trigger ───────────────────────────────────────────
exports.triggerEmergency = async (req, res, next) => {
  try {
    const { lat, lng, emergencyType, severityLevel, description = '' } = req.body;

    // Step 1: General first aid — instant, hardcoded, no AI needed
    const generalFirstAid = getGeneralFirstAid(emergencyType);

    // Step 2: AI triage (only if description provided)
    let triageResult = null;
    let finalSeverity = severityLevel;

    if (description && description.trim().length >= 5) {
      try {
        triageResult = await triageEmergency(description, emergencyType);
        if (triageResult?.confidence === 'high') {
          finalSeverity = triageResult.severity;
          logger.info(`Triage override: user=${severityLevel} → ai=${finalSeverity}`);
        }
      } catch (err) {
        logger.warn('Triage failed — using user-provided severity', err.message);
      }
    }

    // Step 3: Hospital selection
    let hospitalRanking = [];
    let topHospitalId = null;

    try {
      hospitalRanking = await selectHospital(lat, lng, triageResult, emergencyType);
      if (hospitalRanking.length > 0) {
        topHospitalId = hospitalRanking[0].id;
        logger.info(`Hospital selected: ${hospitalRanking[0].name}`);
      }
    } catch (err) {
      logger.warn('Hospital selection failed', err.message);
    }

    // Step 4: Create session
    const session = await EmergencySession.create({
      userId: req.user.userId,
      location: { lat, lng },
      emergencyType,
      description,
      severityLevel: finalSeverity,
      hospitalId: topHospitalId || null,
      hospitalRanking,
      generalFirstAid,
      phase: 'PRE_ARRIVAL',
    });

    // Step 5: Respond immediately — don't make patient wait for assignment
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
        generalFirstAid,
      },
    });

    // Step 6: Emit general first aid to session room immediately
    // 1s delay so client can join room first
    setTimeout(() => {
      emitToRoom(`session:${session._id}`, 'general_first_aid', {
        sessionId: session._id,
        ...generalFirstAid,
      });
    }, 1000);

    // Step 7: Emit specialised first aid if description given (2s delay)
    if (description && description.trim().length >= 5 && finalSeverity >= 4) {
      setTimeout(async () => {
        try {
          const specialisedFirstAid = await generateFirstAid(emergencyType, finalSeverity, description);
          if (specialisedFirstAid) {
            emitToRoom(`session:${session._id}`, 'specialised_first_aid', {
              sessionId: session._id,
              ...specialisedFirstAid,
            });
          }
        } catch (err) {
          logger.warn('Specialised first aid generation failed', err.message);
        }
      }, 2000);
    }

    // Step 8: Assignment (fire and forget — 500ms delay)
    setTimeout(() => {
      assignAmbulance(session._id, lat, lng)
        .then(async (result) => {
          if (result) {
            logger.info(`Assigned ambulance ${result.ambulanceId} in ${result.latency}ms`);

            // Schedule delay detection
            try {
              const etaMinutes = Math.ceil((result.etaSeconds || 0) / 60) || 5;
              await scheduleDelayDetection(session._id.toString(), etaMinutes);
            } catch (err) {
              logger.warn('Failed to schedule delay detection', err.message);
            }

            // Emit hospital ranking to session room after assignment
            if (hospitalRanking.length > 0) {
              emitToRoom(`session:${session._id}`, 'hospital_options', {
                sessionId: session._id,
                hospitalRanking,
                message: 'Hospital options available',
              });
            }
          }
        })
        .catch((err) => {
          logger.error('Assignment failed:', err.message);
        });
    }, 500);

  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/emergency/:id ─────────────────────────────────────────────────
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

// ── GET /api/v1/emergency ─────────────────────────────────────────────────────
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

// ── POST /api/v1/emergency/:id/transition ────────────────────────────────────
exports.transitionSession = async (req, res, next) => {
  try {
    const { status, metadata = {} } = req.body;

    const validTransitions = {
      INITIATED: ['ASSIGNED'],
      ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
      EN_ROUTE: ['DELAYED', 'RESOLVED'],
      DELAYED: ['EN_ROUTE', 'RESOLVED', 'CANCELLED'],
    };

    const session = await EmergencySession.findById(req.params.id);
    if (!session) return next(new AppError('Session not found', 404));

    const isOwner = session.userId.toString() === req.user.userId;
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    const isDriver = req.user.role.toLowerCase() === 'driver';

    if (!isOwner && !isAdmin && !isDriver) {
      return next(new AppError('Not authorized', 403));
    }

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
    }

    await session.save();

    if (['RESOLVED', 'CANCELLED'].includes(status)) {
      try { await cancelDelayDetection(session._id.toString()); } catch (e) { }
      if (session.ambulanceId) {
        try {
          await updateAmbulanceStatus(session.ambulanceId.toString(), 'AVAILABLE');
          await Ambulance.findByIdAndUpdate(session.ambulanceId, {
            status: 'AVAILABLE',
            assignedSessionId: null,
          });
        } catch (e) {
          logger.warn('Failed to reset ambulance on resolve', e.message);
        }
      }
    }

    emitToRoom(`session:${session._id}`, 'session_status_changed', {
      sessionId: session._id,
      previousStatus,
      newStatus: status,
      metadata,
      changedAt: new Date().toISOString(),
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/emergency/:id/arrive ────────────────────────────────────────
// Driver confirms arrival — GPS proximity check or OTP
exports.confirmArrival = async (req, res, next) => {
  try {
    const { driverLat, driverLng, otp } = req.body;

    if (req.user.role.toLowerCase() !== 'driver' && req.user.role.toLowerCase() !== 'admin') {
      return next(new AppError('Driver role required', 403));
    }

    const session = await EmergencySession.findById(req.params.id);
    if (!session) return next(new AppError('Session not found', 404));
    if (session.phase === 'POST_ARRIVAL') {
      return res.status(200).json({ success: true, message: 'Already confirmed', data: session });
    }

    const severity = session.severityLevel || 3;

    // Severity 4-5: GPS proximity check (within 100m)
    if (severity >= 4) {
      const { haversineDistance } = require('../services/mapsService');
      const distanceKm = haversineDistance(
        driverLat, driverLng,
        session.location.lat, session.location.lng
      );
      const distanceMeters = distanceKm * 1000;

      if (distanceMeters > 200) {
        return next(new AppError(
          `Driver is ${Math.round(distanceMeters)}m away from patient. Must be within 200m for auto-confirmation.`,
          400
        ));
      }
      logger.info(`Arrival confirmed via GPS proximity: ${Math.round(distanceMeters)}m`);
    } else {
      // Severity 1-3: OTP verification
      const storedOtp = await redis.get(`session:${session._id}:arrival_otp`);
      if (!storedOtp || storedOtp !== otp) {
        return next(new AppError('Invalid or expired OTP', 400));
      }
      await redis.del(`session:${session._id}:arrival_otp`);
      logger.info(`Arrival confirmed via OTP for session ${session._id}`);
    }

    // Confirm arrival
    session.phase = 'POST_ARRIVAL';
    session.arrivalConfirmedAt = new Date();
    session.addEvent('DRIVER_ARRIVED', {
      confirmedAt: new Date().toISOString(),
      method: severity >= 4 ? 'GPS_PROXIMITY' : 'OTP',
    });
    await session.save();

    // Emit to session room — patient sees confirmation
    emitToRoom(`session:${session._id}`, 'driver_arrived', {
      sessionId: session._id,
      confirmedAt: session.arrivalConfirmedAt,
    });

    // Emit hospital options to DRIVER only (post-arrival)
    if (session.hospitalRanking && session.hospitalRanking.length > 0) {
      emitToRoom(`session:${session._id}`, 'post_arrival_hospital_options', {
        sessionId: session._id,
        hospitalRanking: session.hospitalRanking,
        hasDescription: !!(session.description && session.description.trim().length >= 5),
      });
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/emergency/:id/generate-otp ──────────────────────────────────
// Generate arrival OTP for low severity sessions
exports.generateArrivalOtp = async (req, res, next) => {
  try {
    const session = await EmergencySession.findById(req.params.id);
    if (!session) return next(new AppError('Session not found', 404));

    const severity = session.severityLevel || 3;
    if (severity >= 4) {
      return next(new AppError('High severity sessions use GPS confirmation, not OTP', 400));
    }

    const otp = generateOTP();
    // Store in Redis for 10 minutes
    await redis.set(`session:${session._id}:arrival_otp`, otp, 'EX', 600);

    // Emit OTP to patient/bystander screen
    emitToRoom(`session:${session._id}`, 'arrival_otp_generated', {
      sessionId: session._id,
      otp,
      message: 'Share this code with the driver when they arrive',
      expiresInMinutes: 10,
    });

    res.status(200).json({
      success: true,
      message: 'OTP generated and sent to patient',
      otp, // also in response for testing
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/emergency/:id/get-route ─────────────────────────────────────
// Driver requests route to a destination (hospital or custom location)
exports.getRouteToDestination = async (req, res, next) => {
  try {
    if (req.user.role.toLowerCase() !== 'driver' && req.user.role.toLowerCase() !== 'admin') {
      return next(new AppError('Driver role required', 403));
    }

    const { driverLat, driverLng, destinationLat, destinationLng, destinationName } = req.body;

    if (!driverLat || !driverLng || !destinationLat || !destinationLng) {
      return next(new AppError('Driver and destination coordinates required', 400));
    }

    const { getSingleETA } = require('../services/mapsService');
    const etaMinutes = await getSingleETA(driverLat, driverLng, destinationLat, destinationLng);

    // Build Google Maps deep link for navigation
    const mapsUrl = `https://www.google.com/maps/dir/${driverLat},${driverLng}/${destinationLat},${destinationLng}`;

    res.status(200).json({
      success: true,
      data: {
        destinationName: destinationName || 'Destination',
        etaMinutes,
        mapsUrl,
        coordinates: { lat: destinationLat, lng: destinationLng },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/emergency/:id/chat ──────────────────────────────────────────
// Send a chat message in a session
exports.sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return next(new AppError('Message cannot be empty', 400));
    }

    const session = await EmergencySession.findById(req.params.id);
    if (!session) return next(new AppError('Session not found', 404));

    const chatMessage = {
      senderId: req.user.userId,
      senderRole: req.user.role.toUpperCase(),
      message: message.trim(),
      timestamp: new Date(),
    };

    session.chatMessages.push(chatMessage);
    await session.save();

    // Broadcast to session room
    emitToRoom(`session:${session._id}`, 'chat_message', {
      sessionId: session._id,
      ...chatMessage,
    });

    res.status(201).json({ success: true, data: chatMessage });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/emergency/:id/chat ────────────────────────────────────────────
// Get chat history for a session
exports.getChatHistory = async (req, res, next) => {
  try {
    const session = await EmergencySession.findById(req.params.id)
      .select('chatMessages');

    if (!session) return next(new AppError('Session not found', 404));

    res.status(200).json({
      success: true,
      data: session.chatMessages,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/emergency/:id/driver-replies ─────────────────────────────────
exports.getDriverReplies = async (req, res, next) => {
  try {
    const role = req.user.role.toLowerCase();
    if (role !== 'driver' && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Driver role required' });
    }

    const session = await EmergencySession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const { lastPatientMessage, etaMinutes = 5 } = req.body;
    if (!lastPatientMessage || lastPatientMessage.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'lastPatientMessage is required' });
    }

    const { generateDriverReplies } = require('../services/ai/driverAssistService');
    const replies = await generateDriverReplies(lastPatientMessage, session.emergencyType, etaMinutes);

    res.json({ success: true, replies });
  } catch (err) {
    next(err);
  }
};