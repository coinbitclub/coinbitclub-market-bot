import express from 'express';
import { jwtMiddleware, requireRole } from '../common/auth.js';
import { createPlan, listPlans, updatePlan, deletePlan } from './service.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const plans = await listPlans();
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  jwtMiddleware,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const plan = await createPlan(req.body);
      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  jwtMiddleware,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const updated = await updatePlan(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  jwtMiddleware,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      await deletePlan(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
