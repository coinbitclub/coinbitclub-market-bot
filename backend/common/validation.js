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

// Common field schemas
const commonFields = {
  email: Joi.string().email().lowercase().trim(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/),
  id: Joi.number().integer().positive(),
  uuid: Joi.string().uuid(),
  symbol: Joi.string().pattern(/^[A-Z]+\/[A-Z]+$/).uppercase(),
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
    password: commonFields.password.required(),
    name: Joi.string().min(2).max(50).trim().required(),
    referralCode: Joi.string().optional()
  }),
  
  login: Joi.object({
    email: commonFields.email.required(),
    password: Joi.string().required()
  }),
  
  resetPassword: Joi.object({
    email: commonFields.email.required()
  }),
  
  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: commonFields.password.required()
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  })
};

// User management schemas
export const userSchema = {
  profile: Joi.object({
    name: Joi.string().min(2).max(50).trim(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    timezone: Joi.string(),
    language: Joi.string().valid('en', 'pt', 'es').default('en')
  }),
  
  preferences: Joi.object({
    emailNotifications: Joi.boolean().default(true),
    smsNotifications: Joi.boolean().default(false),
    riskTolerance: Joi.string().valid('low', 'medium', 'high').default('medium'),
    maxConcurrentTrades: Joi.number().integer().min(1).max(5).default(2)
  })
};

// Credential schemas
export const credentialSchema = {
  create: Joi.object({
    exchange: commonFields.exchange.required(),
    apiKey: Joi.string().min(10).required(),
    apiSecret: Joi.string().min(10).required(),
    testnet: Joi.boolean().default(false),
    name: Joi.string().max(50).trim().optional()
  }),
  
  update: Joi.object({
    name: Joi.string().max(50).trim().optional(),
    isActive: Joi.boolean().optional()
  }),
  
  test: Joi.object({
    credentialId: commonFields.id.required()
  })
};

// Trading schemas
export const tradingSchema = {
  webhook: {
    tradingView: Joi.object({
      symbol: commonFields.symbol.required(),
      side: commonFields.side.required(),
      price: commonFields.amount.required(),
      timestamp: commonFields.timestamp.required(),
      strategy: Joi.string().max(50),
      timeframe: Joi.string().valid('1m', '5m', '15m', '30m', '1h', '4h', '1d'),
      indicators: Joi.object({
        ema9: Joi.number(),
        rsi: Joi.number().min(0).max(100),
        momentum: Joi.number()
      }).optional()
    }),
    
    coinStats: Joi.object({
      fearGreedIndex: Joi.number().min(0).max(100).required(),
      btcDominance: Joi.number().min(0).max(100).required(),
      timestamp: commonFields.timestamp.required()
    })
  },
  
  signal: Joi.object({
    symbol: commonFields.symbol.required(),
    side: commonFields.side.required(),
    confidence: Joi.number().min(0).max(100),
    timeframe: Joi.string().valid('1m', '5m', '15m', '30m', '1h', '4h', '1d'),
    source: Joi.string().valid('tradingview', 'coinstats', 'ai'),
    indicators: Joi.object().optional(),
    metadata: Joi.object().optional()
  }),
  
  order: {
    create: Joi.object({
      userId: commonFields.id.required(),
      symbol: commonFields.symbol.required(),
      side: commonFields.side.required(),
      quantity: commonFields.amount.required(),
      orderType: Joi.string().valid('market', 'limit').default('market'),
      price: commonFields.amount.when('orderType', {
        is: 'limit',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      leverage: Joi.number().integer().min(1).max(100).default(10),
      stopLoss: commonFields.amount.optional(),
      takeProfit: commonFields.amount.optional()
    }),
    
    update: Joi.object({
      status: Joi.string().valid('pending', 'executed', 'cancelled', 'failed'),
      executionPrice: commonFields.amount.optional(),
      executedQuantity: commonFields.amount.optional(),
      executedAt: commonFields.timestamp.optional()
    }),
    
    query: Joi.object({
      userId: commonFields.id.optional(),
      symbol: commonFields.symbol.optional(),
      side: commonFields.side.optional(),
      status: Joi.string().valid('pending', 'executed', 'cancelled', 'failed').optional(),
      exchange: commonFields.exchange.optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().valid('createdAt', 'executedAt', 'symbol').default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  }
};

// Plan and subscription schemas
export const planSchema = {
  create: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(500),
    price: commonFields.amount.required(),
    currency: Joi.string().valid('USD', 'BRL').default('USD'),
    interval: Joi.string().valid('month', 'year').required(),
    features: Joi.array().items(Joi.string()).required(),
    maxConcurrentTrades: Joi.number().integer().min(1).max(10).default(2),
    maxCapitalUsage: commonFields.percentage.default(60),
    isActive: Joi.boolean().default(true)
  }),
  
  subscription: Joi.object({
    planId: commonFields.id.required(),
    paymentMethodId: Joi.string().required()
  })
};

// Administrative schemas
export const adminSchema = {
  userManagement: {
    suspend: Joi.object({
      userId: commonFields.id.required(),
      reason: Joi.string().min(10).max(500).required(),
      duration: Joi.number().integer().positive().optional() // days
    }),
    
    reactivate: Joi.object({
      userId: commonFields.id.required(),
      reason: Joi.string().min(10).max(500).required()
    }),
    
    setAffiliate: Joi.object({
      userId: commonFields.id.required(),
      affiliateId: commonFields.id.required(),
      commissionRate: commonFields.percentage.default(10)
    })
  },
  
  audit: {
    logs: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      userId: commonFields.id.optional(),
      action: Joi.string().optional(),
      level: Joi.string().valid('info', 'warn', 'error').optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50)
    })
  }
};

// Risk management schemas
export const riskSchema = {
  assessment: Joi.object({
    userId: commonFields.id.required(),
    balance: commonFields.amount.required(),
    openPositions: Joi.number().integer().min(0).required(),
    requestedQuantity: commonFields.amount.required(),
    symbol: commonFields.symbol.required(),
    leverage: Joi.number().integer().min(1).max(100).required()
  }),
  
  limits: Joi.object({
    maxConcurrentPositions: Joi.number().integer().min(1).max(10),
    maxCapitalUsage: commonFields.percentage,
    maxLeverage: Joi.number().integer().min(1).max(100),
    maxPositionSize: commonFields.amount,
    stopLossRequired: Joi.boolean().default(true)
  })
};

// AI and decision engine schemas
export const aiSchema = {
  decision: Joi.object({
    action: Joi.string().valid('BUY', 'SELL', 'HOLD').required(),
    confidence: Joi.number().min(0).max(100).required(),
    reason: Joi.string().min(10).max(1000).required(),
    quantity: commonFields.amount.required(),
    takeProfitPct: commonFields.percentage.optional(),
    stopLossPct: commonFields.percentage.optional(),
    metadata: Joi.object().optional()
  }),
  
  context: Joi.object({
    symbol: commonFields.symbol.required(),
    currentPrice: commonFields.amount.required(),
    indicators: Joi.object().required(),
    marketConditions: Joi.object().required(),
    userPreferences: Joi.object().optional(),
    riskMetrics: Joi.object().optional()
  })
};

// Notification schemas
export const notificationSchema = {
  email: Joi.object({
    to: commonFields.email.required(),
    subject: Joi.string().min(1).max(200).required(),
    body: Joi.string().min(1).required(),
    template: Joi.string().optional(),
    data: Joi.object().optional()
  }),
  
  push: Joi.object({
    userId: commonFields.id.required(),
    title: Joi.string().min(1).max(100).required(),
    message: Joi.string().min(1).max(500).required(),
    type: Joi.string().valid('info', 'warning', 'error', 'success').default('info'),
    data: Joi.object().optional()
  })
};

// Middleware for validation
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = validate(schema, req.body);
      next();
    } catch (error) {
      res.status(error.statusCode || 400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = validate(schema, req.query);
      next();
    } catch (error) {
      res.status(error.statusCode || 400).json({
        error: 'Query validation failed',
        details: error.details
      });
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = validate(schema, req.params);
      next();
    } catch (error) {
      res.status(error.statusCode || 400).json({
        error: 'Parameter validation failed',
        details: error.details
      });
    }
  };
}

// Order query schema
export const orderQuerySchema = Joi.object({
  userId: commonFields.id.required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
  symbol: commonFields.symbol.optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});
