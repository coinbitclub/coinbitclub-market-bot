// common/validation.js
import Joi from 'joi';

/**
 * Gera um middleware que valida req.body contra um schema Joi.
 * @param {Joi.ObjectSchema<any>} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({ errors: messages });
    }
    req.body = value;
    return next();
  };
}