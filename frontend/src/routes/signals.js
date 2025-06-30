import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  res.json([
    { symbol: "BTCUSDT", signal: "COMPRA", time: "10:31", status: "Processado" },
    { symbol: "ETHUSDT", signal: "VENDA", time: "10:41", status: "Processado" },
    { symbol: "BTCUSDT", signal: "COMPRA", time: "09:52", status: "Aguardando" }
  ]);
});

export default router;
