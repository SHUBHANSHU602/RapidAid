const crypto = require('crypto');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  logger.info(`Incoming request`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
};

module.exports = requestLogger;