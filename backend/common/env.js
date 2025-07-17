import Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().default(''),
  AMQP_URL: Joi.string().default('amqp://localhost'),
  OPENAI_API_KEY: Joi.string().allow('').default(''),
  BYBIT_API_KEY: Joi.string().allow('').default(''),
  BINANCE_API_KEY: Joi.string().allow('').default(''),
  JWT_SECRET: Joi.string().default('secret'),
  SMTP_HOST: Joi.string().allow('').default('localhost'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().allow('').default(''),
  LOG_LEVEL: Joi.string().default('info')
}).unknown(true);

const { error, value } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export default value;
