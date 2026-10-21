require('./environment');
module.exports = async () => {
  const mongoose = require('mongoose');
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, retryStrategy: () => null, connectTimeout: 5000 });
  redis.on('error', () => {});
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await redis.connect();
    await redis.ping();
  } catch (error) {
    throw new Error('Isolated test services unavailable. Run docker compose -f compose.test.yml up -d --wait. ' + error.message);
  } finally {
    redis.disconnect();
    await mongoose.disconnect();
  }
};
