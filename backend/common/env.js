import Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  AMQP_URL: Joi.string().required(),
  OPENAI_API_KEY: Joi.string().required(),
  BYBIT_API_KEY: Joi.string().required(),
  BINANCE_API_KEY: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().required(),
  LOG_LEVEL: Joi.string().default('info')
}).unknown(true);

const { error, value } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export default value;
