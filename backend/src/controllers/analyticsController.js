const EmergencySession = require('../models/EmergencySession');
const Ambulance = require('../models/Ambulance');
const User = require('../models/User');

exports.getOverview = async (req, res, next) => {
  try {
    const [totalSessions, activeSessions, totalAmbulances, availableAmbulances, activeDrivers] = await Promise.all([
      EmergencySession.countDocuments(),
      EmergencySession.countDocuments({ status: { $nin: ['RESOLVED', 'CANCELLED'] } }),
      Ambulance.countDocuments(),
      Ambulance.countDocuments({ status: 'AVAILABLE' }),
      User.countDocuments({ role: { $regex: /^driver$/i } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        totalAmbulances,
        availableAmbulances,
        activeDrivers
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmergencyTypes = async (req, res, next) => {
  try {
    const stats = await EmergencySession.aggregate([
      { $group: { _id: '$emergencyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formatted = stats.map(stat => ({
      type: stat._id,
      count: stat.count
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

exports.getDelayStats = async (req, res, next) => {
  try {
    const delayedSessions = await EmergencySession.find({ 'eventLog.status': 'DELAYED' });
    
    let totalDrift = 0;
    let delayCount = 0;

    delayedSessions.forEach(session => {
      const delayEvents = session.eventLog.filter(e => e.status === 'DELAYED');
      delayEvents.forEach(e => {
        if (e.meta && e.meta.drift) {
          totalDrift += e.meta.drift;
          delayCount++;
        }
      });
    });

    const averageDrift = delayCount > 0 ? (totalDrift / delayCount).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDelayed: delayedSessions.length,
        averageDriftMinutes: parseFloat(averageDrift)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getResponseTimes = async (req, res, next) => {
  try {
    const sessions = await EmergencySession.find({ 'eventLog.status': { $all: ['INITIATED', 'DRIVER_ARRIVED'] } });

    let totalResponseTimeMs = 0;
    let count = 0;

    sessions.forEach(session => {
      const initiatedEvent = session.eventLog.find(e => e.status === 'INITIATED') || session.eventLog[0];
      const arrivedEvent = session.eventLog.find(e => e.status === 'DRIVER_ARRIVED');

      if (initiatedEvent && arrivedEvent && initiatedEvent.timestamp && arrivedEvent.timestamp) {
        const timeDiff = new Date(arrivedEvent.timestamp) - new Date(initiatedEvent.timestamp);
        if (timeDiff > 0) {
          totalResponseTimeMs += timeDiff;
          count++;
        }
      }
    });

    const averageResponseTimeMinutes = count > 0 ? (totalResponseTimeMs / count / 1000 / 60).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        sessionsAnalyzed: count,
        averageResponseTimeMinutes: parseFloat(averageResponseTimeMinutes)
      }
    });
  } catch (err) {
    next(err);
  }
};
