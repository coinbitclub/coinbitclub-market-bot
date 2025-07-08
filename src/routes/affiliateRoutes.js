src/routes/affiliateRoutes.js
js
CopiarEditar
import { Router } from 'express';
import { listCommissions } from '../controllers/affiliateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/commissions', requireAuth, listCommissions);
export default router;
