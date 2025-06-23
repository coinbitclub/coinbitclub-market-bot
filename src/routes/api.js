import express from 'express';
import { query } from '../services/databaseService.js';

const router = express.Router();

// GET /api/signals?limit=N
router.get('/signals', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  try {
    const result = await query(
      `SELECT * FROM public.signals
       ORDER BY received_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar signals', error: err.message });
  }
});

// GET /api/dominance?period=24h
router.get('/dominance', async (req, res) => {
  const period = req.query.period || '24h';
  try {
    const result = await query(
      `SELECT * FROM public.dominance
       WHERE timestamp >= now() - ($1)::interval
       ORDER BY timestamp DESC`,
      [period]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar dominance', error: err.message });
  }
});

// GET /api/fear-greed
router.get('/fear-greed', async (req, res) => {
  try {
    const result = await query(
      `SELECT index_value, value_classification, timestamp
         FROM public.fear_greed
        ORDER BY timestamp DESC
        LIMIT 1`,
      []
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar fear & greed', error: err.message });
  }
});

// GET /api/market?limit=N
router.get('/market', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  try {
    const result = await query(
      `SELECT symbol, price, timestamp
         FROM public.market
        ORDER BY timestamp DESC
        LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar market', error: err.message });
  }
});

export default router;
