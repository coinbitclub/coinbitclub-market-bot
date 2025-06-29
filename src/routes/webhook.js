import express from 'express';
import { parseSignal } from '../parseSignal.js';
import { saveSignal } from '../services/signalService.js';
import { parseDominance } from '../parseDominance.js';
import { saveDominance } from '../services/dominanceService.js';

const router = express.Router();

router.use((req, _res, next) => {
  req.userId = req.query.userId || (req.user && req.user.id);
  next();
});

// Função utilitária para timestamp
function normalizeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'string') {
    if (/^\d+$/.test(ts)) return new Date(Number(ts));
    if (!isNaN(Date.parse(ts))) return new Date(ts);
  }
  return new Date();
}

router.post('/signal', async (req, res, next) => {
  try {
    const { ticker, price, time } = req.body;
    if (!ticker || !price || !time) return res.status(400).json({ error: 'ticker, price, time obrigatórios' });
    const parsedTime = normalizeTimestamp(time);
    if (isNaN(parsedTime)) return res.status(400).json({ error: 'timestamp inválido' });
    const signal = parseSignal({ ...req.body, time: parsedTime, price: Number(price) });
    await saveSignal(req.userId, signal);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

router.post('/dominance', async (req, res, next) => {
  try {
    const value = req.body.value || req.body.btc_dom;
    if (typeof value === 'undefined') return res.status(400).json({ error: 'value (btc_dom) obrigatório' });
    const capturedAt = normalizeTimestamp(req.body.captured_at) || new Date();
    const dom = parseDominance({ ...req.body, value: Number(value), captured_at: capturedAt });
    await saveDominance(req.userId, dom);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

export default router;
