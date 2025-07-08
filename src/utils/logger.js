// src/utils/logger.js
import pino from 'pino';

const level = process.env.LOG_LEVEL
  || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// ISO timestamp format for all logs
const logger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
