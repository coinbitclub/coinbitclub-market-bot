import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/open', authenticate, async (req, res) => {
  res.json([
    { symbol: "BTCUSDT", value: 500, exchange: "Bybit", mode: "Real", status: "Aberta" },
    { symbol: "ETHUSDT", value: 300, exchange: "Binance", mode: "Teste", status: "Aberta" }
  ]);
});

export default router;
