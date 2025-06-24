import { saveMarketPrice } from '../services/marketService.js';
import express from 'express';
import { saveSignal }       from '../services/signalsService.js';
import { saveDominance }    from '../services/dominanceService.js';
import { saveFearAndGreed } from '../services/fearGreedService.js';
import { verifyToken }      from '../middleware/auth.js';

const router = express.Router();

router.post('/signal', verifyToken, async (req, res) => {
  await saveSignal(req.body);
  res.json({ status: 'ok' });
});

router.post('/dominance', verifyToken, async (req, res) => {
  await saveDominance(req.body);
  res.json({ status: 'ok' });
});

router.post('/fear-greed', verifyToken, async (req, res) => {
  await saveFearAndGreed(req.body);
  res.json({ status: 'ok' });
});

router.post('/market', async (req, res) => {
  const { symbol, price, timestamp } = req.body;
  await saveMarketPrice({ symbol, price, timestamp });
  res.json({ status: 'ok' });
});

export default router;
