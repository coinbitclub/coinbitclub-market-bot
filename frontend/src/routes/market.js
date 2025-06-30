import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/summary', authenticate, async (req, res) => {
  res.json({
    aiSummary: "BTC segue tendência neutra, RSI em zona de consolidação, aguardando breakout para direção de trade.",
    direction: { label: "LONG", color: "#18e57c", desc: "Baseado no sinal de alta e confirmação de volume." }
  });
});

// Indicadores
router.get('/indicators', authenticate, async (req, res) => {
  res.json({
    btcDominance: 53.2,
    fearGreed: { value: 59, label: "Neutro" },
    btcPrice: { price: 67000, ema21: 66900, rsi: 51 }
  });
});

export default router;
