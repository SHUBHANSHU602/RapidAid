const crypto = require('crypto');
const logger = require('../utils/logger');
const { observeRequest } = require('../services/metrics');

const requestLogger = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  const started = process.hrtime.bigint();
  res.on('finish', () => observeRequest(req.method, res.statusCode, Number(process.hrtime.bigint() - started) / 1e9));
  logger.info(`Incoming request`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
};

module.exports = requestLogger;