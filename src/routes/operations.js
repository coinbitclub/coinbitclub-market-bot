// src/routes/operations.js
import express from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { saveOperation, getOperationsByUser } from '../services/operationsService.js';
import { validate } from '../middleware/validatePayload.js';
import Joi from 'joi';

const router = express.Router();

// Validation schema
const operationSchema = Joi.object({
  exchange: Joi.string().required(),
  operation_type: Joi.string().required(),
  symbol: Joi.string().required(),
  order_id: Joi.string().required(),
  qty: Joi.number().required(),
  price: Joi.number().required(),
  leverage: Joi.number().required(),
  pnl: Joi.number().required(),
  status: Joi.string().required(),
  opened_at: Joi.date().iso().required(),
  closed_at: Joi.date().iso().optional().allow(null)
});

// GET /operations — histórico de operações do usuário
router.get(
  '/',
  jwtMiddleware,
  async (req, res, next) => {
    try {
      const ops = await getOperationsByUser(req.user.id);
      res.json(ops);
    } catch (err) {
      next(err);
    }
  }
);

// POST /operations — registra nova operação
router.post(
  '/',
  jwtMiddleware,
  validate(operationSchema),
  async (req, res, next) => {
    try {
      const params = { user_id: req.user.id, ...req.body };
      const result = await saveOperation(params);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
