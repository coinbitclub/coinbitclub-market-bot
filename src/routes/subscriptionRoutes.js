src/routes/subscriptionRoutes.js
js
CopiarEditar
import { Router } from 'express';
import { createSubscription } from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/', requireAuth, createSubscription);
export default router;
