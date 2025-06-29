import express from 'express';
import { parseSignal } from '../parseSignal.js';
import { saveSignal } from '../services/signalService.js';

const router = express.Router();

function normalizeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'string') {
    if (/^\d+$/.test(ts)) return new Date(Number(ts));
    if (!isNaN(Date.parse(ts))) return new Date(ts);
  }
  return new Date();
}

// POST /webhook/signal  (sem autenticação por padrão)
router.post('/signal', async (req, res, next) => {
  try {
    const { ticker, price, time } = req.body;
    if (!ticker || !price || !time)
      return res.status(400).json({ error: 'ticker, price, time obrigatórios' });

    const parsedTime = normalizeTimestamp(time);
    if (isNaN(parsedTime))
      return res.status(400).json({ error: 'timestamp inválido' });

    const signal = parseSignal({
      ...req.body,
      time: parsedTime,
      price: Number(price)
    });

    // Ajuste para ambientes sem userId:
    await saveSignal(null, signal); // ou só saveSignal(signal) se sua função não espera userId

    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
