import express from 'express';
import { fetchFearGreed } from '../services/fearGreedService.js';
import { getBtcDominanceDiff } from '../services/dominanceService.js';
import { getMarketOverview } from '../services/marketService.js';

const router = express.Router();

router.get('/fear_greed', async (req, res) => {
  try {
    const fg = await fetchFearGreed();
    res.json(fg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dominance', async (req, res) => {
  try {
    const diff = await getBtcDominanceDiff();
    res.json({ diff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/market', async (req, res) => {
  try {
    const mkt = await getMarketOverview();
    res.json(mkt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
