import express from 'express';
import { jwtMiddleware, requireRole } from '../common/auth.js';
import { createPlan, listPlans, updatePlan, deletePlan } from './service.js';
const router = express.Router();
router.get('/', listPlans);
router.post('/', jwtMiddleware, requireRole('admin'), createPlan);
router.put('/:id', jwtMiddleware, requireRole('admin'), updatePlan);
router.delete('/:id', jwtMiddleware, requireRole('admin'), deletePlan);
export default router;
