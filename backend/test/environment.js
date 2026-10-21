process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27018/rapidaid_test_jest';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:6380/15';
process.env.JWT_SECRET = 'local-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'local-test-refresh-secret';
process.env.GROQ_API_KEY = '';
process.env.GOOGLE_MAPS_API_KEY = '';
require('../src/config/testSafety').assertTestConnections();
