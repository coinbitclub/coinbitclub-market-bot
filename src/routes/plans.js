// src/routes/plans.js
import express from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validatePayload.js';
import * as planService from '../services/planService.js';

const router = express.Router();

// Validação opcional de query string
const getPlansSchema = Joi.object({
  query: Joi.object({
    pais: Joi.string().optional()
  })
});

// GET /plans - lista de planos ativos, com filtro opcional por país
router.get(
  '/',
  validate(getPlansSchema),
  async (req, res, next) => {
    try {
      const { pais } = req.query;
      const plans = await planService.getActivePlans(pais);
      res.json(plans);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
