const Ambulance = require('../models/Ambulance');
const EmergencySession = require('../models/EmergencySession');
const AppError = require('../utils/AppError');
const redis = require('../config/redis');
const {
  updateAmbulanceStatus,
  updateAmbulanceLocation,
  getAmbulanceStatus,
  setAmbulanceOnline,
} = require('../services/ambulanceCache');

function createServiceArea(lat, lng, size = 0.05) {
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - size, lat - size],
      [lng + size, lat - size],
      [lng + size, lat + size],
      [lng - size, lat + size],
      [lng - size, lat - size],
    ]],
  };
}

async function dispatchOldestPendingEmergency() {
  const pending = await EmergencySession.findOne({
    status: 'INITIATED',
    ambulanceId: null,
  }).sort({ createdAt: 1 }).lean();

  if (!pending) return null;

  const { assignAmbulance } = require('../services/assignmentService');
  const result = await assignAmbulance(
    pending._id,
    pending.location.lat,
    pending.location.lng
  );

  if (result) {
    const { scheduleDelayDetection } = require('../workers/delayDetection.worker');
    await scheduleDelayDetection(
      pending._id,
      Math.max(1, Number(result.etaMinutes) || Number(result.etaSeconds) / 60)
    );
  }

  return result;
}

exports.getAllAmbulances = async (req, res, next) => {
  try {
    const ambulances = await Ambulance.find({}).populate('driverId', 'name email');
    res.status(200).json({ success: true, count: ambulances.length, data: ambulances });
  } catch (err) {
    next(err);
  }
};

exports.getMyAmbulance = async (req, res, next) => {
  try {
    if (req.user.role.toLowerCase() !== 'driver') {
      return next(new AppError('Driver role required', 403));
    }
    const ambulance = await Ambulance.findOne({ driverId: req.user.userId }).populate('driverId', 'name email');
    if (!ambulance) return next(new AppError('No ambulance is linked to this driver account', 404));

    const liveStatus = await getAmbulanceStatus(ambulance._id);
    res.status(200).json({ success: true, data: { ...ambulance.toObject(), liveStatus: liveStatus || ambulance.status } });
  } catch (err) {
    next(err);
  }
};

exports.provisionMyAmbulance = async (req, res, next) => {
  try {
    if (req.user.role.toLowerCase() !== 'driver') {
      return next(new AppError('Driver role required', 403));
    }

    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return next(new AppError('Valid driver latitude and longitude are required', 400));
    }

    let ambulance = await Ambulance.findOne({ driverId: req.user.userId });

    if (ambulance?.assignedSessionId) {
      const active = await EmergencySession.findById(ambulance.assignedSessionId).lean();
      if (active && ['ASSIGNED', 'EN_ROUTE', 'DELAYED'].includes(active.status)) {
        await updateAmbulanceLocation(ambulance._id, lat, lng, true);
        await setAmbulanceOnline(ambulance._id, true);
        const populated = await Ambulance.findById(ambulance._id).populate('driverId', 'name email');
        return res.status(200).json({
          success: true,
          message: 'Driver is online and already has an active assignment',
          data: { ...populated.toObject(), liveStatus: populated.status },
          assignment: { sessionId: active._id },
        });
      }
    }

    if (!ambulance) {
      ambulance = await Ambulance.create({
        driverId: req.user.userId,
        currentLocation: { lat, lng },
        status: 'AVAILABLE',
        lastPing: new Date(),
        assignedSessionId: null,
        serviceArea: createServiceArea(lat, lng),
      });
    } else {
      ambulance.serviceArea = createServiceArea(lat, lng);
      ambulance.assignedSessionId = null;
      await ambulance.save();
    }

    await updateAmbulanceLocation(ambulance._id, lat, lng, true);
    await updateAmbulanceStatus(ambulance._id, 'AVAILABLE');
    await setAmbulanceOnline(ambulance._id, true);

    const assignment = await dispatchOldestPendingEmergency();
    const populated = await Ambulance.findById(ambulance._id).populate('driverId', 'name email');
    const liveStatus = await getAmbulanceStatus(ambulance._id);

    res.status(200).json({
      success: true,
      message: assignment
        ? 'Driver is online and a pending emergency was dispatched'
        : 'Driver is online and available for assignments',
      data: { ...populated.toObject(), liveStatus: liveStatus || populated.status },
      assignment,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyActiveSession = async (req, res, next) => {
  try {
    if (req.user.role.toLowerCase() !== 'driver') {
      return next(new AppError('Driver role required', 403));
    }
    const ambulance = await Ambulance.findOne({ driverId: req.user.userId }).lean();
    if (!ambulance) return next(new AppError('No ambulance is linked to this driver account', 404));

    const session = await EmergencySession.findOne({
      ambulanceId: ambulance._id,
      status: { $in: ['ASSIGNED', 'EN_ROUTE', 'DELAYED'] },
    }).sort({ createdAt: -1 }).populate('hospitalId', 'name location address');

    if (!session) {
      return res.status(200).json({ success: true, data: null });
    }

    let etaMinutes = null;
    try {
      const etaRaw = await redis.get(`session:${session._id}:eta`);
      if (etaRaw) {
        const parsed = JSON.parse(etaRaw);
        if (Number.isFinite(Number(parsed.etaMinutes))) etaMinutes = Number(parsed.etaMinutes);
      }
    } catch {
      // Fall through to event-log recovery below.
    }

    if (etaMinutes == null) {
      const assignedEvent = [...(session.eventLog || [])]
        .reverse()
        .find((event) => event.status === 'ASSIGNED' && Number(event.meta?.etaSeconds) > 0);
      if (assignedEvent) etaMinutes = Math.max(1, Math.ceil(Number(assignedEvent.meta.etaSeconds) / 60));
    }

    res.status(200).json({
      success: true,
      data: { ...session.toObject(), ambulance, etaMinutes },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAmbulanceById = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id).populate('driverId', 'name email');
    if (!ambulance) return next(new AppError('Ambulance not found', 404));
    const liveStatus = await getAmbulanceStatus(req.params.id);
    res.status(200).json({ success: true, data: { ...ambulance.toObject(), liveStatus: liveStatus || ambulance.status } });
  } catch (err) {
    next(err);
  }
};

exports.updateAmbulanceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) return next(new AppError('Ambulance not found', 404));

    const role = req.user.role.toLowerCase();
    const ownsAmbulance = ambulance.driverId.toString() === req.user.userId.toString();
    if (role !== 'admin' && !(role === 'driver' && ownsAmbulance)) {
      return next(new AppError('You can only update your own ambulance', 403));
    }

    if (status === 'AVAILABLE' && ambulance.assignedSessionId) {
      const active = await EmergencySession.findById(ambulance.assignedSessionId).lean();
      if (active && ['ASSIGNED', 'EN_ROUTE', 'DELAYED'].includes(active.status)) {
        return next(new AppError('Cannot become AVAILABLE while assigned to an active emergency', 409));
      }
    }

    await updateAmbulanceStatus(req.params.id, status);
    if (role === 'driver') {
      await setAmbulanceOnline(req.params.id, status === 'AVAILABLE');
      if (status === 'AVAILABLE') await dispatchOldestPendingEmergency();
    }

    res.status(200).json({ success: true, message: `Ambulance status updated to ${status}`, data: { ambulanceId: req.params.id, status } });
  } catch (err) {
    next(err);
  }
};
