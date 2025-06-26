import express from 'express';
import { query } from '../services/databaseService.js';

const router = express.Router();

// Preços de mercado: GET /api/market?limit=10
router.get('/market', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const { rows } = await query(
      'SELECT * FROM market ORDER BY captured_at DESC LIMIT $1',
      [limit]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Logs recentes: GET /api/logs_recent
router.get('/logs_recent', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT 10'
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Trades abertas: GET /api/open_trades
router.get('/open_trades', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM open_trades ORDER BY created_at DESC LIMIT 10'
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// (Opcional) demais rotas antigas – preserve seu código aqui:
router.get('/dominance',   async (req, res) => { /* … */ });
router.get('/feargreed',   async (req, res) => { /* … */ });
router.get('/volatility',  async (req, res) => { /* … */ });
router.get('/feargreed2',  async (req, res) => { /* … */ });
router.get('/extra',       async (req, res) => { /* … */ });

export default router;
