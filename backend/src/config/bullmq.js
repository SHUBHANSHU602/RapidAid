const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 20;

function getBullMQConnection() {
  require('./testSafety').assertTestConnections();
  const url = new URL(process.env.REDIS_URL);
  return {
    host: url.hostname,
    db: Number(url.pathname.slice(1)) || 0,
    port: parseInt(url.port) || 6379,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    tls: process.env.REDIS_URL.startsWith('rediss://') 
      ? { rejectUnauthorized: true } 
      : undefined,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    connectTimeout: 30000,
  };
}

module.exports = { getBullMQConnection };