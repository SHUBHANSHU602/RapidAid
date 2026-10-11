require('dotenv').config();
const mongoose = require('mongoose');

const { assignAmbulance } = require('../services/assignmentService');
const EmergencySession = require('../models/EmergencySession');
const User = require('../models/User');
const logger = require('./logger');

// Varanasi coordinates with slight variation to simulate real requests
const TEST_COORDS = [
  { lat: 25.3176, lng: 82.9739 },
  { lat: 25.3200, lng: 82.9800 },
  { lat: 25.3150, lng: 82.9700 },
  { lat: 25.3250, lng: 82.9850 },
  { lat: 25.3100, lng: 82.9650 },
];

async function runBenchmark() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_BENCHMARK !== 'true') throw new Error('Benchmark requires explicit ALLOW_BENCHMARK=true in an isolated environment');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Benchmark against explicitly prepared test fixtures; never reset live online state.

  // Get a test user
  const user = await User.findOne({ role: 'USER' }).lean();
  if (!user) throw new Error('No USER found — run seed first');

  const results = [];
  const testSessionIds = [];

  for (let i = 0; i < 5; i++) {
    const coords = TEST_COORDS[i % TEST_COORDS.length];

    // Create a real session so assignAmbulance has a valid sessionId
    const session = await EmergencySession.create({
      userId: user._id,
      location: coords,
      emergencyType: 'CARDIAC',
      severityLevel: 3,
    });

    testSessionIds.push(session._id);
    const result = await assignAmbulance(session._id, coords.lat, coords.lng);

    if (result) {
      results.push(result.latency);
      console.log(`Run ${i + 1}: assignment=${result.latency}ms`);
    } else {
      console.log(`Run ${i + 1}: No ambulances available`);
    }
  }

  if (results.length) {
    const sorted = [...results].sort((a, b) => a - b);
    const pct = p => sorted[Math.ceil(p * sorted.length) - 1];
    console.log(JSON.stringify({
      successes: results.length, attempts: 5,
      meanMs: Math.round(results.reduce((a,b) => a+b, 0)/results.length),
      p50Ms: pct(0.5), p95Ms: pct(0.95), p99Ms: pct(0.99)
    }, null, 2));
    console.log('Warning: five runs are insufficient for production latency claims.');
  }

  // Cleanup
  await EmergencySession.deleteMany({ _id: { $in: testSessionIds }, status: 'INITIATED', ambulanceId: null });
  // Assigned benchmark sessions are intentionally not deleted; deleting them
  // would orphan live ambulance assignments. Run only on an isolated fixture DB.
  await mongoose.connection.close();
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err.message);
  process.exit(1);
});