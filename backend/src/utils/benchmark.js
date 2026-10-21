require('dotenv').config();
const mongoose = require('mongoose');
const EmergencySession = require('../models/EmergencySession');
const Ambulance = require('../models/Ambulance');
const User = require('../models/User');
const redis = require('../config/redis');
const { assignAmbulance } = require('../services/assignmentService');

async function runBenchmark() {
  if (process.env.ALLOW_BENCHMARK !== 'true' || process.env.NODE_ENV === 'production' ||
      !/(localhost|127\\.0\\.0\\.1|_test|_demo|rapidaid_benchmark)/.test(process.env.MONGO_URI || '')) {
    throw new Error('Benchmark requires ALLOW_BENCHMARK=true on an isolated local/test database');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const runId = Date.now();
  const testUsers = [];
  const latencies = [];
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const coords = { lat: 25.3176 + i * 0.001, lng: 82.9739 + i * 0.001 };
    const user = await User.create({ name: 'Benchmark User', email: `rapidaid-benchmark-${runId}-${i}@example.invalid`, password: require('crypto').randomBytes(16).toString('hex'), role: 'USER' });
    testUsers.push(user._id);
    const session = await EmergencySession.create({
      userId: user._id, location: coords, emergencyType: 'CARDIAC', severityLevel: 3
    });
    ids.push(session._id);
    const result = await assignAmbulance(session._id, coords.lat, coords.lng);
    if (result && Number.isFinite(result.latency)) latencies.push(result.latency);
  }

  const ordered = [...latencies].sort((a,b) => a-b);
  const percentile = p => ordered.length ? ordered[Math.ceil(p*ordered.length)-1] : null;
  console.log(JSON.stringify({
    attempts: ids.length, successfulAssignments: latencies.length,
    p50Ms: percentile(0.50), p95Ms: percentile(0.95), p99Ms: percentile(0.99),
    note: 'Five sequential attempts are diagnostic only; not a production performance claim.'
  }, null, 2));

  // Only cleanup benchmark sessions, and only after resetting their ambulance claim.
  for (const id of ids) {
    const session = await EmergencySession.findById(id).lean();
    if (!session) continue;
    if (session.ambulanceId) {
      const ambulanceId = String(session.ambulanceId);
      const released = await Ambulance.updateOne(
        { _id: session.ambulanceId, assignedSessionId: id },
        { $set: { status: 'AVAILABLE', assignedSessionId: null } }
      );
      if (released.modifiedCount === 1) {
        const pipeline = redis.pipeline();
        pipeline.set(`ambulance:${ambulanceId}:status`, 'AVAILABLE');
        pipeline.sadd('ambulance:available', ambulanceId);
        pipeline.del(`ambulance:${ambulanceId}:reservation`);
        pipeline.del(`session:${id}:eta`);
        await pipeline.exec();
      }
    }
    await EmergencySession.deleteOne({ _id: id });
  }
  await User.deleteMany({ _id: { $in: testUsers } });
  await redis.quit();
  await mongoose.disconnect();
}
runBenchmark().catch(err => { console.error(err.message); process.exitCode = 1; });
