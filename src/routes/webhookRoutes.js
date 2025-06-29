import express from 'express';
import { verifyToken } from '../middleware/auth.js';

import signalRouter    from './signal.js';
import dominanceRouter from './dominance.js';
import fearGreedRouter  from './fearGreed.js';
import marketRouter     from './market.js';

const router = express.Router();

// aplica autenticação a todas as sub-rotas
router.use(verifyToken);

// monta as 4 endpoints:
router.use('/signal',     signalRouter);
router.use('/dominance',  dominanceRouter);
router.use('/fear-greed', fearGreedRouter);
router.use('/market',     marketRouter);

export default router;
