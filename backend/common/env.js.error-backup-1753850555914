import Joi from 'joi';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Load environment-specific variables if they exist
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ 
  path: path.join(__dirname, '..', 'api-gateway', `.env.${nodeEnv}`),
  override: false // Don't override already loaded variables
});

export const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8080),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().default('coinbitclub'),
  DATABASE_PASSWORD: Joi.string().allow('').default(''),
  DATABASE_NAME: Joi.string().default('coinbitclub'),

  // RabbitMQ
  AMQP_URL: Joi.string().default('amqp://localhost'),
  AMQP_HOST: Joi.string().default('localhost'),
  AMQP_PORT: Joi.number().default(5672),
  AMQP_USER: Joi.string().default('guest'),
  AMQP_PASSWORD: Joi.string().default('guest'),

  // API Keys
  OPENAI_API_KEY: Joi.string().allow('').default(''),
  COINSTATS_API_KEY: Joi.string().allow('').default(''),
  
  // Exchange APIs
  BYBIT_API_KEY: Joi.string().allow('').default(''),
  BYBIT_API_SECRET: Joi.string().allow('').default(''),
  BYBIT_TESTNET_API_KEY: Joi.string().allow('').default(''),
  BYBIT_TESTNET_API_SECRET: Joi.string().allow('').default(''),
  BINANCE_API_KEY: Joi.string().allow('').default(''),
  BINANCE_API_SECRET: Joi.string().allow('').default(''),
  BINANCE_TESTNET_API_KEY: Joi.string().allow('').default(''),
  BINANCE_TESTNET_API_SECRET: Joi.string().allow('').default(''),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  // SMTP
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().allow('').default(''),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().allow('').default(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').default(''),

  // Service Ports
  API_GATEWAY_PORT: Joi.number().default(8080),
  SIGNAL_INGESTOR_PORT: Joi.number().default(9001),
  SIGNAL_PROCESSOR_PORT: Joi.number().default(9012),
  DECISION_ENGINE_PORT: Joi.number().default(9011),
  ORDER_EXECUTOR_PORT: Joi.number().default(9013),
  ACCOUNTING_PORT: Joi.number().default(9010),
  NOTIFICATIONS_PORT: Joi.number().default(9014),
  ADMIN_PANEL_PORT: Joi.number().default(9015),

  // Risk Management
  MAX_CONCURRENT_OPERATIONS: Joi.number().default(2),
  MAX_CAPITAL_USAGE_PCT: Joi.number().default(60),
  MIN_BALANCE_USD: Joi.number().default(15),
  MIN_BALANCE_BRL: Joi.number().default(60),

  // Trading
  DEFAULT_LEVERAGE: Joi.number().default(10),
  TAKE_PROFIT_MULTIPLIER: Joi.number().default(1),
  STOP_LOSS_MULTIPLIER: Joi.number().default(3),

  // Timeframes
  SIGNAL_TIME_WINDOW: Joi.number().default(30),
  CLEANUP_INTERVAL_HOURS: Joi.number().default(72),

  // Thresholds
  FG_MIN_THRESHOLD: Joi.number().default(0),
  FG_MAX_THRESHOLD: Joi.number().default(100),
  BTC_DOMINANCE_THRESHOLD: Joi.number().default(0.3),

  // Monitoring
  PROMETHEUS_PORT: Joi.number().default(9090),
  GRAFANA_PORT: Joi.number().default(3001),

  // Cache
  REDIS_URL: Joi.string().default('redis://localhost:6379'),

  // Webhooks
  TRADINGVIEW_WEBHOOK_SECRET: Joi.string().allow('').default('')
}).unknown(true);

const { error, value } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export validated environment variables
export default value;
export const env = value;
