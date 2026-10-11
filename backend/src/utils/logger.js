const { createLogger, format, transports } = require('winston');

// Emit machine-readable logs to stdout/stderr so hosted services can collect
// them without relying on local disk or an extra logging service.
const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: { service: 'rapidaid-api' },
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
