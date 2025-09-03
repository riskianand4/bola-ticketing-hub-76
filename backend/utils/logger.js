const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  transports
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create HTTP logger middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Database logger
const dbLogger = {
  query: (text, params) => {
    logger.debug('Database Query', { query: text, params });
  },
  error: (error, query) => {
    logger.error('Database Error', { error: error.message, query, stack: error.stack });
  }
};

// Performance logger
const performanceLogger = {
  start: (operation) => {
    return {
      operation,
      startTime: Date.now()
    };
  },
  
  end: (timer, additional = {}) => {
    const duration = Date.now() - timer.startTime;
    logger.info(`Performance: ${timer.operation} completed in ${duration}ms`, {
      operation: timer.operation,
      duration,
      ...additional
    });
    return duration;
  }
};

// Error logger with stack trace
const logError = (error, context = {}) => {
  logger.error(error.message, {
    error: error.message,
    stack: error.stack,
    context
  });
};

// Security logger
const securityLogger = {
  loginAttempt: (email, success, ip) => {
    logger.info(`Login attempt: ${email} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      email,
      success,
      ip,
      type: 'login_attempt'
    });
  },
  
  rateLimitHit: (ip, endpoint) => {
    logger.warn(`Rate limit exceeded: ${ip} - ${endpoint}`, {
      ip,
      endpoint,
      type: 'rate_limit'
    });
  },
  
  suspiciousActivity: (activity, context) => {
    logger.warn(`Suspicious activity: ${activity}`, {
      activity,
      context,
      type: 'suspicious_activity'
    });
  }
};

module.exports = {
  logger,
  httpLogger,
  dbLogger,
  performanceLogger,
  logError,
  securityLogger
};