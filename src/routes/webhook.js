import express from 'express';
import { parseSignal } from '../parseSignal.js';
import { saveSignal } from '../services/signalService.js';

const router = express.Router();

// Rota para receber sinais do TradingView/CoinStats
router.post('/signal', async (req, res, next) => {
  try {
    // Garante que o payload já é JSON e monta o objeto no formato padrão
    const signal = parseSignal(req.body);
    // userId pode ser null (público) ou autenticado/tokenizado
    const userId = req.userId || null;
    await saveSignal(userId, signal);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
