const crypto = require('crypto');
const logger = require('../utils/logger');

// Correlate HTTP requests with application errors and reverse-proxy logs.
module.exports = (req, res, next) => {
  const supplied = req.get('x-request-id');
  req.requestId = typeof supplied === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('http_request_completed', {
      requestId: req.requestId,
      method: req.method,
      route: req.route?.path || req.path.replace(/[a-f\d]{24}/gi, ':id'),
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      outcome: res.statusCode >= 500 ? 'server_error' : res.statusCode >= 400 ? 'client_error' : 'success'
    });
  });
  next();
};
