import express from 'express';
import { query } from '../services/databaseService.js';

const router = express.Router();

router.get('/signals', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM signals ORDER BY time DESC LIMIT 100');
    res.json(rows);
  } catch (err) { next(err); }
});

// Adicione rotas GET para market, dominance, fear_greed conforme estrutura do banco!

export default router;
