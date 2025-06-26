 import express from 'express';
import { query } from '../services/databaseService.js';

 const router = express.Router();

 // já existia...
 router.get('/marketcap',   /* ... */);
 router.get('/dominance',   /* ... */);
 router.get('/feargreed',   /* ... */);
 router.get('/volatility',  /* ... */);
 router.get('/feargreed2',  /* ... */);
 router.get('/extra',       /* ... */);

// Trades abertas
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

// Logs recentes
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
