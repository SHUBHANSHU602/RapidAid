function assertTestConnections() {
  if (process.env.NODE_ENV !== 'test') return;
  const mongo = new URL(process.env.MONGO_URI);
  const redis = new URL(process.env.REDIS_URL);
  const local = url => ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (mongo.protocol !== 'mongodb:' || !local(mongo) || mongo.port !== '27018' || !/^\/rapidaid_test_[a-z0-9_]+$/i.test(mongo.pathname) || mongo.search || mongo.username || mongo.password)
    throw new Error('Tests require loopback MongoDB and a rapidaid_test_ database');
  if (redis.protocol !== 'redis:' || !local(redis) || redis.port !== '6380' || redis.pathname !== '/15' || redis.search || redis.username || redis.password)
    throw new Error('Tests require loopback Redis database 15');
}
module.exports = { assertTestConnections };
