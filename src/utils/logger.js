// src/utils/logger.js
import pino from 'pino';

// Usa configuração mínima, sem transportes externos
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

export default logger;
