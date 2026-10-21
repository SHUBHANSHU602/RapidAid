const { assertTestConnections } = require('../config/testSafety');
const { resourceCount } = require('../config/resources');
require('../../app');
const { delayQueue, startDelayWorker } = require('../workers/delayDetection.worker');
const { mapsQueue, getQueuedETA, startMapsWorker } = require('../workers/mapsQueue.worker');
const { QueueEvents } = require('bullmq');
const { getBullMQConnection } = require('../config/bullmq');
const { lazyResource } = require('../config/resources');

test('route imports do not create BullMQ connections or consumers', () => {
  expect(resourceCount()).toBe(0);
});

test.each([
  ['MONGO_URI', 'mongodb://cloud.invalid:27018/rapidaid_test_jest'],
  ['MONGO_URI', 'mongodb://127.0.0.1:27018/production'],
  ['MONGO_URI', 'mongodb://127.0.0.1:27017/rapidaid_test_jest'],
  ['MONGO_URI', 'mongodb://127.0.0.1:27018/rapidaid_test_jest?replicaSet=production'],
  ['REDIS_URL', 'redis://cloud.invalid:6380/15'],
  ['REDIS_URL', 'redis://127.0.0.1:6380/0'],
  ['REDIS_URL', 'redis://127.0.0.1:6379/15'],
])('refuses unsafe %s target %s before connecting', (key, value) => {
  const previous = process.env[key];
  try { process.env[key] = value; expect(assertTestConnections).toThrow(); }
  finally { process.env[key] = previous; }
});

test('BullMQ honors the same isolated Redis database as ioredis', () => {
  expect(getBullMQConnection().db).toBe(15);
});

test('delay consumer starts explicitly and processes queued work', async () => {
  const job = await delayQueue.add('test-missing-session', { sessionId: '000000000000000000000001' });
  expect(await job.getState()).toBe('waiting');
  const events = lazyResource(() => new QueueEvents('delay-detection', { connection: getBullMQConnection() }));
  await events.waitUntilReady();
  expect(startDelayWorker()).toBe(startDelayWorker());
  await job.waitUntilFinished(events, 5000);
  expect(await job.getState()).toBe('completed');
});

test('maps consumer starts explicitly and returns an offline fallback ETA', async () => {
  expect(startMapsWorker()).toBe(startMapsWorker());
  const eta = await getQueuedETA(25.31, 82.97, 25.32, 82.98);
  expect(eta).toBeGreaterThan(0);
  expect(await mapsQueue.getCompletedCount()).toBe(1);
});
