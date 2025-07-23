import Joi from 'joi';

// Generic validation function
export function validate(schema, data, options = {}) {
  const defaultOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  };
  
  const { error, value } = schema.validate(data, { ...defaultOptions, ...options });
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));
    
    const validationError = new Error('Validation failed');
    validationError.code = 'VALIDATION_ERROR';
    validationError.statusCode = 400;
    validationError.details = errorDetails;
    throw validationError;
  }
  
  return value;
}

// Middleware for validating request body
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = validate(schema, req.body);
      next();
    } catch (error) {
      return res.status(error.statusCode || 400).json({ 
        error: error.message,
        details: error.details 
      });
    }
  };
};

// Middleware for validating query parameters
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = validate(schema, req.query);
      next();
    } catch (error) {
      return res.status(error.statusCode || 400).json({ 
        error: error.message,
        details: error.details 
      });
    }
  };
};

// Common field schemas
const commonFields = {
  email: Joi.string().email().lowercase().trim(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/),
  id: Joi.number().integer().positive(),
  uuid: Joi.string().uuid(),
  symbol: Joi.string().min(3).max(20).uppercase(),
  exchange: Joi.string().valid('bybit', 'binance'),
  side: Joi.string().valid('BUY', 'SELL'),
  timestamp: Joi.date().timestamp(),
  amount: Joi.number().positive(),
  percentage: Joi.number().min(0).max(100)
};

// Authentication schemas
export const authSchema = {
  register: Joi.object({
    email: commonFields.email.required(),
    password: commonFields.password.required().messages({
      'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
    }),
    name: Joi.string().min(2).max(100).trim().required(),
    referralCode: Joi.string().optional()
  }),
  
  login: Joi.object({
    email: commonFields.email.required(),
    password: Joi.string().required()
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),
  
  resetPassword: Joi.object({
    email: commonFields.email.required()
  }),
  
  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: commonFields.password.required().messages({
      'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
    })
  })
};

// Webhook schemas
export const tradingViewSchema = Joi.object({
  symbol: commonFields.symbol.required(),
  side: Joi.string().valid('buy', 'sell').required(),
  price: commonFields.amount.required(),
  timestamp: commonFields.timestamp.required(),
  timeframe: Joi.string().valid('1m', '5m', '15m', '30m', '1h', '4h', '1d').default('1h'),
  indicators: Joi.object().optional(),
  exchange: commonFields.exchange.optional()
});

export const coinStatsSchema = Joi.object({
  coin: Joi.string().required(),
  price: commonFields.amount.required(),
  change: Joi.number().required(),
  fearGreedIndex: Joi.number().min(0).max(100).optional(),
  btcDominance: Joi.number().min(0).max(100).optional(),
  marketCap: commonFields.amount.optional(),
  volume24h: commonFields.amount.optional()
});

// Credentials schema
export const credentialSchema = Joi.object({
  apiKey: Joi.string().required(),
  apiSecret: Joi.string().required(),
  exchange: commonFields.exchange.required(),
  isTestnet: Joi.boolean().default(false),
  name: Joi.string().max(100).optional()
});

// Order schemas
export const orderSchema = Joi.object({
  userId: commonFields.uuid.required(),
  symbol: commonFields.symbol.required(),
  side: commonFields.side.required(),
  orderType: Joi.string().valid('market', 'limit', 'stop_market', 'stop_limit').default('market'),
  quantity: commonFields.amount.required(),
  price: commonFields.amount.when('orderType', {
    is: Joi.string().valid('limit', 'stop_limit'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  stopPrice: commonFields.amount.when('orderType', {
    is: Joi.string().valid('stop_market', 'stop_limit'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  leverage: Joi.number().integer().min(1).max(100).default(1),
  takeProfit: commonFields.amount.optional(),
  stopLoss: commonFields.amount.optional()
});

export const orderQuerySchema = Joi.object({
  userId: commonFields.uuid.optional(),
  symbol: commonFields.symbol.optional(),
  status: Joi.string().valid('pending', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired', 'failed').optional(),
  side: commonFields.side.optional(),
  exchange: commonFields.exchange.optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('created_at', 'executed_at', 'symbol', 'side').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Plan schema
export const planSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().valid('USD', 'BRL').default('USD'),
  interval: Joi.string().valid('month', 'year').required(),
  features: Joi.array().items(Joi.string()).optional(),
  maxConcurrentTrades: Joi.number().integer().min(1).optional(),
  maxCapitalUsage: commonFields.percentage.optional(),
  aiDecisionsEnabled: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true)
});

// User management schemas
export const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().max(20).optional(),
  timezone: Joi.string().max(50).optional(),
  language: Joi.string().max(10).optional(),
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  riskTolerance: Joi.string().valid('low', 'medium', 'high').optional(),
  maxConcurrentTrades: Joi.number().integer().min(1).max(10).optional()
});

// Signal schemas
export const signalSchema = Joi.object({
  symbol: commonFields.symbol.required(),
  side: commonFields.side.required(),
  timeframe: Joi.string().valid('1m', '5m', '15m', '30m', '1h', '4h', '1d').required(),
  confidence: commonFields.percentage.optional(),
  source: Joi.string().valid('tradingview', 'coinstats', 'ai', 'manual').required(),
  indicators: Joi.object().optional(),
  marketConditions: Joi.object().optional(),
  expiresAt: Joi.date().optional()
});

// Notification schemas
export const notificationSchema = Joi.object({
  type: Joi.string().valid('email', 'sms', 'push', 'system').required(),
  category: Joi.string().valid('order_execution', 'order_closure', 'risk_alert', 'account_update', 'system_maintenance', 'marketing').required(),
  title: Joi.string().max(200).required(),
  message: Joi.string().required(),
  data: Joi.object().optional()
});

// Dashboard and analytics schemas
export const dashboardQuerySchema = Joi.object({
  timeframe: Joi.string().valid('1d', '7d', '30d', '90d', '1y').default('30d'),
  exchange: commonFields.exchange.optional(),
  currency: Joi.string().valid('USD', 'BTC').default('USD')
});

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Generic ID params schema
export const idParamsSchema = Joi.object({
  id: Joi.alternatives().try(commonFields.id, commonFields.uuid).required()
});

export default {
  validate,
  validateBody,
  validateQuery,
  authSchema,
  tradingViewSchema,
  coinStatsSchema,
  credentialSchema,
  orderSchema,
  orderQuerySchema,
  planSchema,
  userUpdateSchema,
  signalSchema,
  notificationSchema,
  dashboardQuerySchema,
  paginationSchema,
  idParamsSchema
};
