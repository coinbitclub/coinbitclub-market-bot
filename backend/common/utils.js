import logger from './logger.js';
import crypto from 'crypto';
import { env } from './env.js';

// Logging utilities
export function log(msg) {
  logger.info(msg);
}

export function error(err) {
  logger.error(err);
}

// Cryptography utilities
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export function hashPassword(password, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password, hash, salt) {
  const { hash: computedHash } = hashPassword(password, salt);
  return hash === computedHash;
}

export function createHmac(data, secret = env.JWT_SECRET) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Data validation utilities
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Time utilities
export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

export function isWithinTimeWindow(timestamp, windowMinutes = 30) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMinutes = (now - time) / 60000;
  return diffMinutes <= windowMinutes;
}

// Number utilities
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function roundToDecimals(number, decimals = 2) {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Array utilities
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
}

export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function uniqueBy(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// Error handling utilities
export function createError(message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  error.timestamp = new Date().toISOString();
  return error;
}

export function handleAsyncError(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Rate limiting utilities
const rateLimitStore = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }
  
  const requests = rateLimitStore.get(identifier);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: windowStart + windowMs };
  }
  
  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);
  
  return { 
    allowed: true, 
    remaining: maxRequests - validRequests.length,
    resetTime: windowStart + windowMs
  };
}

// Retry utilities
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn({ error, attempt, maxRetries }, 'Operation failed, retrying...');
      
      if (attempt < maxRetries) {
        await sleep(delay * attempt); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Object utilities
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function pick(obj, keys) {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

// Cache utilities (simple in-memory cache)
const cache = new Map();

export function setCache(key, value, ttlMs = 300000) { // 5 minutes default
  const expiry = Date.now() + ttlMs;
  cache.set(key, { value, expiry });
}

export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

export function clearCache(key = null) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Environment utilities
export function isProduction() {
  return env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return env.NODE_ENV === 'development';
}

export function isTest() {
  return env.NODE_ENV === 'test';
}

// Trading utilities
export function calculatePnL(entryPrice, exitPrice, quantity, side) {
  const diff = side === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
  return diff * quantity;
}

export function calculatePercentagePnL(entryPrice, exitPrice, side) {
  const pnl = side === 'BUY' ? (exitPrice - entryPrice) / entryPrice : (entryPrice - exitPrice) / entryPrice;
  return pnl * 100;
}

export function calculatePositionSize(balance, riskPercentage, entryPrice, stopLoss) {
  const riskAmount = balance * (riskPercentage / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  return riskAmount / riskPerUnit;
}

export function applyLeverage(amount, leverage) {
  return amount * leverage;
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute
