// ========================================
// MARKETBOT BACKEND - ENVIRONMENT CONFIGURATION
// ========================================
// Sistema Enterprise para 1000+ usuários simultâneos
// Performance Critical - Zero Tolerance for Errors

import dotenv from 'dotenv';
import { z, ZodError } from 'zod';

// Load environment variables
dotenv.config();

// Validation schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('MARKETBOT'),
  APP_URL: z.string().url(),

  // Database - PostgreSQL Railway
  DATABASE_URL: z.string().url(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // JWT & Authentication
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),

  // Rate Limiting & Security
  RATE_LIMIT_WINDOW_MS: z.string().default('3600000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('300').transform(Number),
  CORS_ORIGIN: z.string().url(),
  WEBHOOK_SECRET: z.string().min(16),

  // IP Fixo NGROK (OBRIGATÓRIO)
  NGROK_IP_FIXO: z.string(), // Can be comma-separated list of IPs
  NGROK_AUTH_TOKEN: z.string(),
  NGROK_SUBDOMAIN: z.string(),
  WEBHOOK_BASE_URL: z.string().url(),

  // OpenAI Integration
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: z.string().default('1000').transform(Number),
  OPENAI_TEMPERATURE: z.string().default('0.1').transform(Number),

  // Market Data APIs
  COINSTATS_API_KEY: z.string(),
  COINSTATS_FEAR_GREED_URL: z.string().url(),
  COINSTATS_MARKETS_URL: z.string().url(),

  // Binance Exchange
  BINANCE_API_KEY: z.string(),
  BINANCE_API_SECRET: z.string(),
  BINANCE_BASE_URL: z.string().url(),
  BINANCE_TESTNET_URL: z.string().url(),
  BINANCE_FUTURES_URL: z.string().url(),
  BINANCE_TESTNET_FUTURES_URL: z.string().url(),

  // Bybit Exchange
  BYBIT_BASE_URL: z.string().url(),
  BYBIT_TESTNET_URL: z.string().url(),

  // Twilio SMS
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),

  // Stripe Payment
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_SUCCESS_URL: z.string().url(),
  STRIPE_CANCEL_URL: z.string().url(),

  // Trading Configuration
  ENABLE_REAL_TRADING: z.string().default('true').transform((val: string) => val === 'true'),
  ENABLE_TESTNET_TRADING: z.string().default('true').transform((val: string) => val === 'true'),
  MAINNET_PRIORITY: z.string().default('true').transform((val: string) => val === 'true'),
  MAX_CONCURRENT_OPERATIONS: z.string().default('2').transform(Number),
  OPERATION_TIMEOUT_SECONDS: z.string().default('120').transform(Number),
  SIGNAL_VALIDATION_SECONDS: z.string().default('30').transform(Number),

  // Default Trading Parameters
  DEFAULT_LEVERAGE: z.string().default('5').transform(Number),
  DEFAULT_STOP_LOSS_MULTIPLIER: z.string().default('2').transform(Number),
  DEFAULT_TAKE_PROFIT_MULTIPLIER: z.string().default('3').transform(Number),
  DEFAULT_POSITION_SIZE_PERCENT: z.string().default('30').transform(Number),
  COIN_BLOCK_TIME_MINUTES: z.string().default('120').transform(Number),

  // Redis Cache
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),
  CACHE_TTL_SECONDS: z.string().default('300').transform(Number),

  // Commission Rates
  MONTHLY_PLAN_COMMISSION: z.string().default('0.10').transform(Number),
  PREPAID_PLAN_COMMISSION: z.string().default('0.20').transform(Number),
  AFFILIATE_NORMAL_RATE: z.string().default('0.015').transform(Number),
  AFFILIATE_VIP_RATE: z.string().default('0.05').transform(Number),
  COMMISSION_BONUS_CONVERSION: z.string().default('0.10').transform(Number),

  // Withdrawal Configuration
  MIN_WITHDRAWAL_BRL: z.string().default('50').transform(Number),
  MIN_WITHDRAWAL_USD: z.string().default('10').transform(Number),
  WITHDRAWAL_FEE_BRL: z.string().default('10').transform(Number),
  WITHDRAWAL_FEE_USD: z.string().default('2').transform(Number),
  WITHDRAWAL_DATES: z.string().default('5,20'),

  // Coupon System
  COUPON_EXPIRY_DAYS: z.string().default('30').transform(Number),
  COUPON_CODE_LENGTH: z.string().default('8').transform(Number),
  MAX_COUPONS_PER_USER_TYPE: z.string().default('1').transform(Number),

  // Exchange Rate API
  EXCHANGE_RATE_API_URL: z.string().url().default('https://api.exchangerate-api.com/v4/latest/USD'),
  EXCHANGE_RATE_UPDATE_INTERVAL_MINUTES: z.string().default('15').transform(Number),

  // Logging & Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/marketbot.log'),
  LOG_MAX_SIZE: z.string().default('10m'),
  LOG_MAX_FILES: z.string().default('5').transform(Number),

  // Cleanup & Maintenance
  CLEANUP_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  CLEANUP_SCHEDULE: z.string().default('0 2 * * *'),
  LOG_RETENTION_DAYS: z.string().default('90').transform(Number),
  SESSION_CLEANUP_DAYS: z.string().default('30').transform(Number),
  FAILED_LOGIN_CLEANUP_DAYS: z.string().default('7').transform(Number),
  EXPIRED_COUPON_CLEANUP_DAYS: z.string().default('1').transform(Number),

  // Health Check & Monitoring
  HEALTH_CHECK_INTERVAL_SECONDS: z.string().default('30').transform(Number),
  API_TIMEOUT_SECONDS: z.string().default('10').transform(Number),
  MAX_RETRIES: z.string().default('3').transform(Number),

  // Webhook Endpoints
  TRADINGVIEW_WEBHOOK_SECRET: z.string().min(16),
  WEBHOOK_RATE_LIMIT_PER_HOUR: z.string().default('300').transform(Number),

  // Development
  ENABLE_SWAGGER: z.string().default('true').transform((val: string) => val === 'true'),
  ENABLE_DEBUG_LOGS: z.string().default('false').transform((val: string) => val === 'true'),
  MOCK_EXTERNAL_APIS: z.string().default('false').transform((val: string) => val === 'true'),
});

// Parse and validate environment variables
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      const missingVars = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = parseEnv();

// Export individual configuration objects for better organization
export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  appName: env.APP_NAME,
  appUrl: env.APP_URL,
} as const;

export const databaseConfig = {
  url: env.DATABASE_URL,
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
} as const;

export const authConfig = {
  jwtSecret: env.JWT_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
} as const;

export const tradingConfig = {
  enableRealTrading: env.ENABLE_REAL_TRADING,
  enableTestnetTrading: env.ENABLE_TESTNET_TRADING,
  mainnetPriority: env.MAINNET_PRIORITY,
  maxConcurrentOperations: env.MAX_CONCURRENT_OPERATIONS,
  operationTimeout: env.OPERATION_TIMEOUT_SECONDS,
  signalValidation: env.SIGNAL_VALIDATION_SECONDS,
  defaultLeverage: env.DEFAULT_LEVERAGE,
  defaultStopLoss: env.DEFAULT_STOP_LOSS_MULTIPLIER,
  defaultTakeProfit: env.DEFAULT_TAKE_PROFIT_MULTIPLIER,
  defaultPositionSize: env.DEFAULT_POSITION_SIZE_PERCENT,
  coinBlockTime: env.COIN_BLOCK_TIME_MINUTES,
} as const;

export const exchangeConfig = {
  binance: {
    apiKey: env.BINANCE_API_KEY,
    apiSecret: env.BINANCE_API_SECRET,
    baseUrl: env.BINANCE_BASE_URL,
    testnetUrl: env.BINANCE_TESTNET_URL,
    futuresUrl: env.BINANCE_FUTURES_URL,
    testnetFuturesUrl: env.BINANCE_TESTNET_FUTURES_URL,
  },
  bybit: {
    baseUrl: env.BYBIT_BASE_URL,
    testnetUrl: env.BYBIT_TESTNET_URL,
  },
} as const;

export const stripeConfig = {
  publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  secretKey: env.STRIPE_SECRET_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: env.STRIPE_SUCCESS_URL,
  cancelUrl: env.STRIPE_CANCEL_URL,
} as const;

export const webhookConfig = {
  secret: env.WEBHOOK_SECRET,
  baseUrl: env.WEBHOOK_BASE_URL,
  tradingViewSecret: env.TRADINGVIEW_WEBHOOK_SECRET,
  rateLimit: env.WEBHOOK_RATE_LIMIT_PER_HOUR,
  ngrok: {
    ipFixo: env.NGROK_IP_FIXO,
    authToken: env.NGROK_AUTH_TOKEN,
    subdomain: env.NGROK_SUBDOMAIN,
  },
} as const;

export const commissionConfig = {
  monthlyPlan: env.MONTHLY_PLAN_COMMISSION,
  prepaidPlan: env.PREPAID_PLAN_COMMISSION,
  affiliateNormal: env.AFFILIATE_NORMAL_RATE,
  affiliateVip: env.AFFILIATE_VIP_RATE,
  bonusConversion: env.COMMISSION_BONUS_CONVERSION,
} as const;

export const withdrawalConfig = {
  minBrl: env.MIN_WITHDRAWAL_BRL,
  minUsd: env.MIN_WITHDRAWAL_USD,
  feeBrl: env.WITHDRAWAL_FEE_BRL,
  feeUsd: env.WITHDRAWAL_FEE_USD,
  dates: env.WITHDRAWAL_DATES.split(',').map(Number),
} as const;

export const cleanupConfig = {
  enabled: env.CLEANUP_ENABLED,
  schedule: env.CLEANUP_SCHEDULE,
  logRetentionDays: env.LOG_RETENTION_DAYS,
  sessionCleanupDays: env.SESSION_CLEANUP_DAYS,
  failedLoginCleanupDays: env.FAILED_LOGIN_CLEANUP_DAYS,
  expiredCouponCleanupDays: env.EXPIRED_COUPON_CLEANUP_DAYS,
} as const;

// ========================================
// PERFORMANCE VALIDATION
// ========================================
// Critical validation for enterprise requirements

console.log(`
🚀 MARKETBOT BACKEND - ENVIRONMENT VALIDATED
✅ Node Environment: ${env.NODE_ENV}
✅ Port: ${env.PORT}
✅ IP Fixo NGROK: ${env.NGROK_IP_FIXO}
✅ Database: ${env.POSTGRES_DB}
✅ Trading: ${env.ENABLE_REAL_TRADING ? 'REAL' : 'TEST'} mode
✅ Mainnet Priority: ${env.MAINNET_PRIORITY}
✅ Max Concurrent: ${env.MAX_CONCURRENT_OPERATIONS}
✅ Commission Monthly: ${env.MONTHLY_PLAN_COMMISSION * 100}%
✅ Commission Prepaid: ${env.PREPAID_PLAN_COMMISSION * 100}%
✅ Cleanup Enabled: ${env.CLEANUP_ENABLED}
📊 Ready for 1000+ users enterprise operation
`);

// Runtime validation for critical configurations
export const validateCriticalConfig = (): void => {
  const critical = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NGROK_IP_FIXO',
    'BINANCE_API_KEY',
    'STRIPE_SECRET_KEY',
    'TWILIO_AUTH_TOKEN',
    'OPENAI_API_KEY',
  ];

  const missing = critical.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(`Critical environment variables missing: ${missing.join(', ')}`);
  }
};

// Export individual configs for easier access
export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ENABLE_REAL_TRADING,
  MAINNET_PRIORITY,
  DEFAULT_LEVERAGE,
  MONTHLY_PLAN_COMMISSION,
  PREPAID_PLAN_COMMISSION,
  AFFILIATE_NORMAL_RATE,
  AFFILIATE_VIP_RATE,
} = env;

// Helper functions
export const isDevelopment = (): boolean => NODE_ENV === 'development';
export const isProduction = (): boolean => NODE_ENV === 'production';
export const isTest = (): boolean => NODE_ENV === 'test';
