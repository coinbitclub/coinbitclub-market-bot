import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { saveSignal } from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';
import { saveFearGreed } from '../services/fearGreedService.js';
import { saveMarketPrice } from '../services/marketService.js';

const router = express.Router();

// Protege todas as rotas
router.use(verifyToken);

// POST /webhook/signal
router.post('/signal', async (req, res, next) => {
  try {
    await saveSignal(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/dominance
router.post('/dominance', async (req, res, next) => {
  try {
    await saveDominance(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/fear-greed
router.post('/fear-greed', async (req, res, next) => {
  try {
    await saveFearGreed(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/market
router.post('/market', async (req, res, next) => {
  try {
    await saveMarketPrice(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
