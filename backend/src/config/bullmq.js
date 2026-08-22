const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 20;

function getBullMQConnection() {
  const url = new URL(process.env.REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    tls: process.env.REDIS_URL.startsWith('rediss://') 
      ? { rejectUnauthorized: false } 
      : undefined,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    connectTimeout: 30000,
  };
}

module.exports = { getBullMQConnection };