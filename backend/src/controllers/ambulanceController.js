const Ambulance = require('../models/Ambulance');
const EmergencySession = require('../models/EmergencySession');
const AppError = require('../utils/AppError');
const { updateAmbulanceStatus, getAmbulanceStatus } = require('../services/ambulanceCache');

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

    res.status(200).json({
      success: true,
      data: session ? { ...session.toObject(), ambulance } : null,
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
    res.status(200).json({ success: true, message: `Ambulance status updated to ${status}`, data: { ambulanceId: req.params.id, status } });
  } catch (err) {
    next(err);
  }
};
