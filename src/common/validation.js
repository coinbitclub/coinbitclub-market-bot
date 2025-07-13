import Joi from '@hapi/joi';

/**
 * Gera um middleware que valida req.body contra um schema Joi
 * @param {Joi.ObjectSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ errors: messages });
    }
    req.body = value;
    next();
  };
}
