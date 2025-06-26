import express from 'express';
import { query } from '../services/databaseService.js';

const router = express.Router();

// Exemplos de rotas existentes (ajuste o corpo conforme seu código atual):
router.get('/marketcap', async (req, res) => {
  // … seu código original …
});
router.get('/dominance', async (req, res) => {
  // … seu código original …
});
router.get('/feargreed', async (req, res) => {
  // … seu código original …
});
router.get('/volatility', async (req, res) => {
  // … seu código original …
});
router.get('/feargreed2', async (req, res) => {
  // … seu código original …
});
router.get('/extra', async (req, res) => {
  // … seu código original …
});

// Rotas do dashboard
router.get('/open_trades', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM open_trades ORDER BY created_at DESC LIMIT 10'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs_recent', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT 10'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
