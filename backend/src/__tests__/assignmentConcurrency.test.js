const mongoose = require('mongoose');
const redis = require('../config/redis');
const User = require('../models/User');
const Ambulance = require('../models/Ambulance');
const EmergencySession = require('../models/EmergencySession');

jest.mock('../sockets/emergencyRoom', () => ({
  getIO: () => ({ to: () => ({ emit: () => {} }) })
}));
const { assignAmbulance } = require('../services/assignmentService');
const { reconcileAssignments } = require('../services/assignmentReconciliation');
const { updateAmbulanceStatus } = require('../services/ambulanceCache');

describe('Assignment: simultaneous patients competing for one ambulance', () => {
  let users = [], ambulance, sessions = [];
  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') throw new Error('This suite requires NODE_ENV=test');
    await mongoose.connect(process.env.MONGO_URI);
    const unique = Date.now().toString(36);
    users = await Promise.all([0,1,2].map(i => User.create({
      name: 'Concurrency Test', email: `concurrent-${unique}-${i}@test.invalid`,
      password: 'Test@1234', role: i === 0 ? 'DRIVER' : 'USER'
    })));
    const lat = 25.3176, lng = 82.9739;
    ambulance = await Ambulance.create({
      driverId: users[0]._id, currentLocation: { lat, lng },
      status: 'AVAILABLE', lastPing: new Date(),
      serviceArea: { type: 'Polygon', coordinates: [[
        [lng-0.05,lat-0.05], [lng+0.05,lat-0.05],
        [lng+0.05,lat+0.05], [lng-0.05,lat+0.05], [lng-0.05,lat-0.05]
      ]] }
    });
    const id = ambulance._id.toString();
    await redis.set(`ambulance:${id}:status`, 'AVAILABLE');
    await redis.sadd('ambulance:available', id);
    await redis.sadd('ambulance:online', id);
    await redis.geoadd('ambulance:positions', lng, lat, id);
    await redis.set(`ambulance:${id}:location`, JSON.stringify({ lat, lng, updatedAt: new Date().toISOString() }), 'EX', 300);
    sessions = await Promise.all([1,2].map(i => EmergencySession.create({
      userId: users[i]._id, location: { lat: lat+0.01, lng: lng+0.01 },
      emergencyType: 'ACCIDENT', severityLevel: 3
    })));
  });
  afterAll(async () => {
    if (ambulance) {
      const id = ambulance._id.toString();
      await redis.del(`ambulance:${id}:status`, `ambulance:${id}:reservation`, `ambulance:${id}:location`);
      await redis.srem('ambulance:available', id);
      await redis.srem('ambulance:online', id);
      await redis.zrem('ambulance:positions', id);
      await Ambulance.deleteOne({ _id: ambulance._id });
    }
    await EmergencySession.deleteMany({ _id: { $in: sessions.map(x=>x._id) } });
    await User.deleteMany({ _id: { $in: users.map(x=>x._id) } });
    await mongoose.disconnect();
  });
  test('exactly one session gets the available ambulance', async () => {
    const results = await Promise.all(sessions.map(s =>
      assignAmbulance(s._id, s.location.lat, s.location.lng)));
    expect(results.filter(Boolean)).toHaveLength(1);
    const docs = await EmergencySession.find({ _id: { $in: sessions.map(x=>x._id) } });
    expect(docs.filter(s => s.status === 'ASSIGNED')).toHaveLength(1);
    expect(docs.filter(s => String(s.ambulanceId) === String(ambulance._id))).toHaveLength(1);
    const persistentAmbulance = await Ambulance.findById(ambulance._id);
    expect(String(persistentAmbulance.assignedSessionId)).toBe(String(docs.find(s => s.status === 'ASSIGNED')._id));
    expect(await redis.get(`ambulance:${ambulance._id}:status`)).toBe('BUSY');
    await expect(updateAmbulanceStatus(ambulance._id, 'AVAILABLE')).rejects.toThrow('still has an assigned session');
    expect(await redis.sismember('ambulance:available', ambulance._id.toString())).toBe(0);
  });
  test('reconciler restores BUSY in Redis for a durably assigned ambulance', async () => {
    const id = ambulance._id.toString();
    await redis.set(`ambulance:${id}:status`, 'AVAILABLE');
    await redis.sadd('ambulance:available', id);
    await reconcileAssignments();
    expect(await redis.get(`ambulance:${id}:status`)).toBe('BUSY');
    expect(await redis.sismember('ambulance:available', id)).toBe(0);
  });

  test('reconciler removes stale AVAILABLE membership even if both statuses read BUSY', async () => {
    const id = ambulance._id.toString();
    await redis.set(`ambulance:${id}:status`, 'BUSY');
    await redis.sadd('ambulance:available', id);
    await reconcileAssignments();
    expect(await redis.get(`ambulance:${id}:status`)).toBe('BUSY');
    expect(await redis.sismember('ambulance:available', id)).toBe(0);
  });


});
