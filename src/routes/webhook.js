import express from 'express';
import { saveSignal, fetchAndSaveDominance } from '../services/fetchAndSaveData.js';
import { parseSignal } from '../parseSignal.js';
import { parseDominance } from '../parseDominance.js';

const router = express.Router();

router.post('/signal', async (req, res, next) => {
  try {
    const parsed = parseSignal(req.body);   // parse antes de salvar
    await saveSignal(parsed);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook/signal] ERRO:', err);
    next(err);
  }
});

router.post('/dominance', async (req, res, next) => {
  try {
    const parsed = parseDominance(req.body);
    await fetchAndSaveDominance(parsed);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook/dominance] ERRO:', err);
    next(err);
  }
});

export default router;
