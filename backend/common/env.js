import Joi from 'joi';

const schema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  AMQP_URL: Joi.string().required(),
  LOG_LEVEL: Joi.string().default('info'),
}).unknown(true);

const { error, value } = schema.validate(process.env);
if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export default value;
