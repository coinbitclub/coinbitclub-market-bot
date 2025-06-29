import {
  saveSignal,
  fetchAndSaveDominance as saveDominance,
  fetchAndSaveFearGreed as saveFearGreed,
  fetchAndSaveMarket as saveMarketPrice
} from '../services/fetchAndSaveData.js';

import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signal', verifyToken, async (req, res, next) => {
  try {
    await saveSignal(req.body);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

router.post('/dominance', verifyToken, async (req, res, next) => {
  try {
    await saveDominance(req.body);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

router.post('/fear-greed', verifyToken, async (req, res, next) => {
  try {
    await saveFearGreed(req.body);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

router.post('/market', verifyToken, async (req, res, next) => {
  try {
    await saveMarketPrice(req.body);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

export default router;
