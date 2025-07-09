// src/middleware/validatePayload.js
import Joi from 'joi'

export const validate = schema => (req, res, next) => {
  const { error } = schema.validate(req.body)  // ✅ valida apenas o corpo, como esperado
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
