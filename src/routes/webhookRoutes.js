// src/routes/webhookRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import signalRouter    from './signal.js';
import dominanceRouter from './dominance.js';
import fearGreedRouter  from './fearGreed.js';
import marketRouter     from './market.js';

const router = express.Router();

// Aplica autenticação em todos os webhooks
router.use(verifyToken);

// Sub-rotas para cada tipo de webhook
router.use('/signal',     signalRouter);
router.use('/dominance',  dominanceRouter);
router.use('/fear-greed', fearGreedRouter);
router.use('/market',     marketRouter);

export default router;
