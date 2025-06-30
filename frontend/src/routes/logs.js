import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  // Simula logs recentes
  res.json([
    "[08:35] Ordem BUY executada (BTCUSDT, +12%)",
    "[08:32] Sinal de trade processado (ETHUSDT)",
    "[08:27] Mercado neutro, aguardando breakout",
    "[08:19] Ordem SELL fechada (ETHUSDT, +7%)",
    "[08:10] Falha na API CoinStats (recuperado)"
  ]);
});

export default router;
