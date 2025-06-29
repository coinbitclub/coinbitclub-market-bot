// src/routes/fetch.js
import express from 'express';
import { query } from '../services/databaseService.js';

const router = express.Router();

// GET /api/signals
router.get('/signals', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM signals ORDER BY signal_time DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/market
router.get('/market', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM market ORDER BY "timestamp" DESC LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'No market data' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/dominance
router.get('/dominance', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM btc_dominance ORDER BY captured_at DESC LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'No dominance data' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/fear-greed
router.get('/fear-greed', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM fear_greed ORDER BY captured_at DESC LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'No fear & greed data' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
