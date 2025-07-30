import express from 'express';'
import { db } from '../../../common/db.js';'
import { handleAsyncError } from '../../../common/utils.js';'
import logger from '../../../common/logger.js';'
import Joi from 'joi';'

const router = express.Router();

// Validation schemas
const riskParametersSchema = Joi.object({
  leverage: Joi.number().min(1).max(10).required(),
  capitalPerOrder: Joi.number().min(1).max(100).required(),
  maxStopLoss: Joi.number().min(1).max(50).required(),
  riskLevel: Joi.string().valid('conservative', 'moderate', 'aggressive').required(),'
  maxDailyOperations: Joi.number().min(1).max(50).default(10),
  maxSimultaneousOperations: Joi.number().min(1).max(10).default(3)
});

const tradingPreferencesSchema = Joi.object({
  preferredExchange: Joi.string().valid('bybit', 'binance', 'both').default('both'),'
  preferredAssets: Joi.array().items(Joi.string()).default(['BTC', 'ETH']),'
  tradingHours: Joi.object({
    enabled: Joi.boolean().default(false),
    start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),'
    end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('18:00'),'
    timezone: Joi.string().default('America/Sao_Paulo')'
  }).default(),
  enableWeekendTrading: Joi.boolean().default(true),
  autoTakeProfit: Joi.boolean().default(true),
  trailingStop: Joi.boolean().default(false)
});

const notificationPreferencesSchema = Joi.object({
  email: Joi.object({
    enabled: Joi.boolean().default(true),
    operations: Joi.boolean().default(true),
    profits: Joi.boolean().default(true),
    losses: Joi.boolean().default(true),
    systemAlerts: Joi.boolean().default(true),
    marketUpdates: Joi.boolean().default(false)
  }).default(),
  push: Joi.object({
    enabled: Joi.boolean().default(false),
    operations: Joi.boolean().default(false),
    profits: Joi.boolean().default(true),
    losses: Joi.boolean().default(true),
    systemAlerts: Joi.boolean().default(true)
  }).default(),
  sms: Joi.object({
    enabled: Joi.boolean().default(false),
    urgentOnly: Joi.boolean().default(true)
  }).default()
});

// Get user risk parameters and preferences
export const getUserSettings = handleAsyncError(async (req, res) => {
  const userId = req.user.id;

  // Get user risk parameters
  const riskParams = await db('user_risk_parameters')'
    .where({ user_id: userId })
    .first();

  // Get trading preferences
  const tradingPrefs = await db('user_trading_preferences')'
    .where({ user_id: userId })
    .first();

  // Get notification preferences
  const notificationPrefs = await db('notification_preferences')'
    .where({ user_id: userId })
    .first();

  // Get system default parameters for comparison
  const systemDefaults = {
    leverage: 3,
    capitalPerOrder: 5,
    maxStopLoss: 10,
    riskLevel: 'moderate','
    maxDailyOperations: 10,
    maxSimultaneousOperations: 3
  };

  // Merge with defaults if user hasn't set custom parameters'
  const userRiskParams = riskParams ? {
    leverage: riskParams.leverage,
    capitalPerOrder: riskParams.capital_per_order,
    maxStopLoss: riskParams.max_stop_loss,
    riskLevel: riskParams.risk_level,
    maxDailyOperations: riskParams.max_daily_operations,
    maxSimultaneousOperations: riskParams.max_simultaneous_operations
  } : systemDefaults;

  const userTradingPrefs = tradingPrefs ? {
    preferredExchange: tradingPrefs.preferred_exchange,
    preferredAssets: tradingPrefs.preferred_assets || ['BTC', 'ETH'],'
    tradingHours: tradingPrefs.trading_hours || {
      enabled: false,
      start: '09:00','
      end: '18:00','
      timezone: 'America/Sao_Paulo''
    },
    enableWeekendTrading: tradingPrefs.enable_weekend_trading,
    autoTakeProfit: tradingPrefs.auto_take_profit,
    trailingStop: tradingPrefs.trailing_stop
  } : {
    preferredExchange: 'both','
    preferredAssets: ['BTC', 'ETH'],'
    tradingHours: {
      enabled: false,
      start: '09:00','
      end: '18:00','
      timezone: 'America/Sao_Paulo''
    },
    enableWeekendTrading: true,
    autoTakeProfit: true,
    trailingStop: false
  };

  const userNotificationPrefs = notificationPrefs ? notificationPrefs.preferences : {
    email: {
      enabled: true,
      operations: true,
      profits: true,
      losses: true,
      systemAlerts: true,
      marketUpdates: false
    },
    push: {
      enabled: false,
      operations: false,
      profits: true,
      losses: true,
      systemAlerts: true
    },
    sms: {
      enabled: false,
      urgentOnly: true
    }
  };

  res.json({
    riskParameters: {
      current: userRiskParams,
      systemDefaults,
      isCustom: !!riskParams
    },
    tradingPreferences: userTradingPrefs,
    notificationPreferences: userNotificationPrefs,
    profile: {
      autoMode: req.user.auto_trading_enabled || false,
      tradingStatus: req.user.trading_status || 'active''
    }
  });
});

// Update user risk parameters
export const updateRiskParameters = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  // Validate input
  const { error, value } = riskParametersSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid parameters', '
      details: error.details 
    });
  }

  const {
    leverage,
    capitalPerOrder,
    maxStopLoss,
    riskLevel,
    maxDailyOperations,
    maxSimultaneousOperations
  } = value;

  // Check if user already has custom parameters
  const existingParams = await db('user_risk_parameters')'
    .where({ user_id: userId })
    .first();

  const paramData = {
    user_id: userId,
    leverage,
    capital_per_order: capitalPerOrder,
    max_stop_loss: maxStopLoss,
    risk_level: riskLevel,
    max_daily_operations: maxDailyOperations,
    max_simultaneous_operations: maxSimultaneousOperations,
    updated_at: new Date()
  };

  if (existingParams) {
    // Update existing parameters
    await db('user_risk_parameters')'
      .where({ user_id: userId })
      .update(paramData);
  } else {
    // Create new parameters
    paramData.created_at = new Date();
    await db('user_risk_parameters').insert(paramData);'
  }

  // Log the change
  await db('audit_logs').insert({'
    user_id: userId,
    action: 'risk_parameters_updated','
    details: {
      old_params: existingParams,
      new_params: paramData
    },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),'
    created_at: new Date()
  });

  logger.info({ userId, riskLevel, leverage }, 'User risk parameters updated');'

  res.json({
    success: true,
    message: 'Parâmetros de risco atualizados com sucesso','
    parameters: {
      leverage,
      capitalPerOrder,
      maxStopLoss,
      riskLevel,
      maxDailyOperations,
      maxSimultaneousOperations
    }
  });
});

// Update trading preferences
export const updateTradingPreferences = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  // Validate input
  const { error, value } = tradingPreferencesSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid preferences', '
      details: error.details 
    });
  }

  // Check if user already has preferences
  const existingPrefs = await db('user_trading_preferences')'
    .where({ user_id: userId })
    .first();

  const prefData = {
    user_id: userId,
    preferred_exchange: value.preferredExchange,
    preferred_assets: JSON.stringify(value.preferredAssets),
    trading_hours: JSON.stringify(value.tradingHours),
    enable_weekend_trading: value.enableWeekendTrading,
    auto_take_profit: value.autoTakeProfit,
    trailing_stop: value.trailingStop,
    updated_at: new Date()
  };

  if (existingPrefs) {
    await db('user_trading_preferences')'
      .where({ user_id: userId })
      .update(prefData);
  } else {
    prefData.created_at = new Date();
    await db('user_trading_preferences').insert(prefData);'
  }

  // Log the change
  await db('audit_logs').insert({'
    user_id: userId,
    action: 'trading_preferences_updated','
    details: {
      old_prefs: existingPrefs,
      new_prefs: prefData
    },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),'
    created_at: new Date()
  });

  res.json({
    success: true,
    message: 'Preferências de trading atualizadas com sucesso','
    preferences: value
  });
});

// Update notification preferences
export const updateNotificationPreferences = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  // Validate input
  const { error, value } = notificationPreferencesSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid notification preferences', '
      details: error.details 
    });
  }

  // Check if user already has notification preferences
  const existingPrefs = await db('notification_preferences')'
    .where({ user_id: userId })
    .first();

  const prefData = {
    user_id: userId,
    preferences: JSON.stringify(value),
    updated_at: new Date()
  };

  if (existingPrefs) {
    await db('notification_preferences')'
      .where({ user_id: userId })
      .update(prefData);
  } else {
    prefData.created_at = new Date();
    await db('notification_preferences').insert(prefData);'
  }

  res.json({
    success: true,
    message: 'Preferências de notificação atualizadas com sucesso','
    preferences: value
  });
});

// Toggle auto trading mode
export const toggleAutoTrading = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {'
    return res.status(400).json({ error: 'enabled must be a boolean' });'
  }

  // Update user auto trading status
  await db('users')'
    .where({ id: userId })
    .update({ 
      auto_trading_enabled: enabled,
      updated_at: new Date()
    });

  // Log the change
  await db('audit_logs').insert({'
    user_id: userId,
    action: enabled ? 'auto_trading_enabled' : 'auto_trading_disabled','
    details: { enabled },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),'
    created_at: new Date()
  });

  logger.info({ userId, enabled }, 'Auto trading toggled');'

  res.json({
    success: true,
    message: `Trading automático ${enabled ? 'ativado' : 'desativado'} com sucesso`,'
    autoTradingEnabled: enabled
  });
});

// Reset to system defaults
export const resetToDefaults = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { type } = req.body; // 'risk', 'trading', 'notifications', or 'all''

  const validTypes = ['risk', 'trading', 'notifications', 'all'];'
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid reset type' });'
  }

  try {
    if (type === 'risk' || type === 'all') {'
      await db('user_risk_parameters')'
        .where({ user_id: userId })
        .del();
    }

    if (type === 'trading' || type === 'all') {'
      await db('user_trading_preferences')'
        .where({ user_id: userId })
        .del();
    }

    if (type === 'notifications' || type === 'all') {'
      await db('notification_preferences')'
        .where({ user_id: userId })
        .del();
    }

    // Log the reset
    await db('audit_logs').insert({'
      user_id: userId,
      action: `settings_reset_${type}`,
      details: { resetType: type },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),'
      created_at: new Date()
    });

    res.json({
      success: true,
      message: `Configurações ${type === 'all' ? 'gerais' : type} restauradas para o padrão do sistema`'
    });
  } catch (error) {
    logger.error({ error, userId, type }, 'Failed to reset settings');'
    res.status(500).json({ error: 'Erro ao restaurar configurações' });'
  }
});

// Get available assets and exchanges
export const getAvailableOptions = handleAsyncError(async (req, res) => {
  // This would typically come from a configuration or external API
  const availableAssets = [
    { symbol: 'BTC', name: 'Bitcoin', popular: true },'
    { symbol: 'ETH', name: 'Ethereum', popular: true },'
    { symbol: 'ADA', name: 'Cardano', popular: true },'
    { symbol: 'SOL', name: 'Solana', popular: true },'
    { symbol: 'MATIC', name: 'Polygon', popular: false },'
    { symbol: 'DOT', name: 'Polkadot', popular: false },'
    { symbol: 'LINK', name: 'Chainlink', popular: false },'
    { symbol: 'UNI', name: 'Uniswap', popular: false }'
  ];

  const availableExchanges = [
    { id: 'bybit', name: 'Bybit', supported: true },'
    { id: 'binance', name: 'Binance', supported: true },'
    { id: 'both', name: 'Ambas as exchanges', supported: true }'
  ];

  const riskLevels = [
    { 
      level: 'conservative', '
      name: 'Conservador','
      description: 'Menor risco, menor retorno potencial','
      defaultLeverage: 2,
      defaultCapital: 3,
      defaultStopLoss: 5
    },
    { 
      level: 'moderate', '
      name: 'Moderado','
      description: 'Equilibrio entre risco e retorno','
      defaultLeverage: 3,
      defaultCapital: 5,
      defaultStopLoss: 10
    },
    { 
      level: 'aggressive', '
      name: 'Agressivo','
      description: 'Maior risco, maior retorno potencial','
      defaultLeverage: 5,
      defaultCapital: 8,
      defaultStopLoss: 15
    }
  ];

  res.json({
    assets: availableAssets,
    exchanges: availableExchanges,
    riskLevels,
    timezones: [
      { id: 'America/Sao_Paulo', name: 'São Paulo (UTC-3)' },'
      { id: 'America/New_York', name: 'Nova York (UTC-5)' },'
      { id: 'Europe/London', name: 'Londres (UTC+0)' },'
      { id: 'Asia/Tokyo', name: 'Tóquio (UTC+9)' }'
    ]
  });
});

// Routes
router.get('/', getUserSettings);'
router.put('/risk', updateRiskParameters);'
router.put('/trading', updateTradingPreferences);'
router.put('/notifications', updateNotificationPreferences);'
router.put('/auto-trading', toggleAutoTrading);'
router.post('/reset', resetToDefaults);'
router.get('/options', getAvailableOptions);'

export default router;
