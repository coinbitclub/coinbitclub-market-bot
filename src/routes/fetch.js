import express from 'express';
import { query } from '../services/databaseService.js';

const router = express.Router();

// GET /fetch/market — retorna o último registro de market
router.get('/market', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM market ORDER BY captured_at DESC LIMIT 1'
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'No market data available' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /fetch/dominance — retorna o último registro de dominance
router.get('/dominance', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM dominance ORDER BY created_at DESC LIMIT 1'
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'No dominance data available' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /fetch/fear_greed — retorna o último registro de fear_greed
router.get('/fear_greed', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM fear_greed ORDER BY created_at DESC LIMIT 1'
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'No fear/greed data available' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
