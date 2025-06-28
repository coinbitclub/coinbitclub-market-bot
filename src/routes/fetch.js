import express from 'express';
import { fetchRecentSignals } from '../services/signalService.js';
import { fetchLastDominance } from '../services/dominanceService.js';
import { fetchLastFearGreed } from '../services/fearGreedWriter.js';

const router = express.Router();

router.get('/signals', async (_req, res, next) => {
  try {
    const rows = await fetchRecentSignals();
    if (!rows || !Array.isArray(rows) || rows.length === 0)
      return res.status(404).json({ error: 'No signals found' });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/dominance', async (_req, res, next) => {
  try {
    const row = await fetchLastDominance();
    if (!row) return res.status(404).json({ error: 'No dominance data available' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.get('/fear_greed', async (_req, res, next) => {
  try {
    const row = await fetchLastFearGreed();
    if (!row) return res.status(404).json({ error: 'No fear/greed data available' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

export default router;
