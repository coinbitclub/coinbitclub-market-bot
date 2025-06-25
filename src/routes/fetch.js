import express from 'express';
import { fetchFearGreed } from '../services/fearGreedService.js';
import { getBtcDominanceDiff } from '../services/dominanceService.js';
import { getMarketHistory } from '../services/marketService.js';

const router = express.Router();

// GET /fetch/fear_greed
router.get('/fear_greed', async (req, res) => {
  try {
    const data = await fetchFearGreed();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Erro em /fetch/fear_greed:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /fetch/dominance
router.get('/dominance', async (req, res) => {
  try {
    const diff = await getBtcDominanceDiff();
    res.json({ ok: true, diff });
  } catch (err) {
    console.error('Erro em /fetch/dominance:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /fetch/market
router.get('/market', async (req, res) => {
  try {
    const data = await getMarketHistory();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Erro em /fetch/market:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
