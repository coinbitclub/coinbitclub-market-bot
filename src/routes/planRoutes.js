src/routes/planRoutes.js
js
CopiarEditar
import { Router } from 'express';
import { getPlans, addPlan, removePlan } from '../controllers/planController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/',    requireAuth, getPlans);
router.post('/',   requireAuth, addPlan);
router.delete('/:id', requireAuth, removePlan);
export default router;
