import Joi from 'joi';

export function validate(schema, data) {
  const { error, value } = schema.validate(data);
  if (error) throw new Error(error.message);
  return value;
}

export const tradingViewSchema = Joi.object({
  symbol: Joi.string().required(),
  side: Joi.string().valid('buy', 'sell').required(),
  price: Joi.number().required(),
  timestamp: Joi.date().timestamp().required()
});

export const coinStatsSchema = Joi.object({
  coin: Joi.string().required(),
  price: Joi.number().required(),
  change: Joi.number().required()
});

export const authSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const credentialSchema = Joi.object({
  apiKey: Joi.string().required(),
  secret: Joi.string().required(),
  exchange: Joi.string().valid('bybit', 'binance').required(),
  testnet: Joi.boolean().default(false)
});

export const orderSchema = Joi.object({
  userId: Joi.number().integer().required(),
  symbol: Joi.string().required(),
  side: Joi.string().valid('BUY', 'SELL').required(),
  quantity: Joi.number().positive().required(),
  price: Joi.number().positive().optional()
});

export const orderQuerySchema = Joi.object({
  userId: Joi.number().integer().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const planSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().required(),
  interval: Joi.string().valid('month', 'year').required()
});
