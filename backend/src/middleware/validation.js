import Joi from 'joi';

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });
  req.body = value;
  next();
};

// Schemas
export const signalSchema = Joi.object({
  token: Joi.string().required(),
  symbol: Joi.string().required(),
  side: Joi.string().valid('buy', 'sell').required(),
  price: Joi.number().required(),
  quantity: Joi.number().required(),
});

export const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().required(),
  method: Joi.string().valid('bank', 'paypal').required(),
});

export const commissionReportSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});