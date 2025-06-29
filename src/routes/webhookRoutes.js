// src/routes/webhookRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { parseSignal } from '../services/parseSignal.js';
import { saveSignal } from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';
import { saveFearGreed } from '../services/fearGreedService.js';
import { saveMarketPrice } from '../services/marketService.js';

const router = express.Router();

// todas as rotas protegidas
router.use(verifyToken);

// POST /webhook/signal
router.post('/signal', async (req, res, next) => {
  try {
    const signal = parseSignal(req.body);
    await saveSignal(req.userId || null, signal);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/dominance
router.post('/dominance', async (req, res, next) => {
  try {
    const { timestamp, btc_dom, ema7 } = req.body;
    await saveDominance({ timestamp, btc_dom, ema7 });
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/fear-greed
router.post('/fear-greed', async (req, res, next) => {
  try {
    const { timestamp, index_value, value_classification } = req.body;
    await saveFearGreed({ timestamp, index_value, value_classification });
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/market
router.post('/market', async (req, res, next) => {
  try {
    const { timestamp, symbol, price } = req.body;
    await saveMarketPrice({ timestamp, symbol, price });
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
