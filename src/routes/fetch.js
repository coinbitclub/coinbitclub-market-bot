import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

router.get('/market', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM market ORDER BY captured_at DESC LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'No market data available' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/dominance', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM btc_dominance ORDER BY captured_at DESC LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'No dominance data available' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/fear_greed', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM fear_greed ORDER BY captured_at DESC LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'No fear/greed data available' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
