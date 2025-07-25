/**
 * Middleware de Validação
 * Valida requisições usando express-validator
 */
import { validationResult } from 'express-validator';
import logger from '../../common/logger.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Erro de validação:', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body
    });
    
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};
