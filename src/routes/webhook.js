// src/routes/webhook.js
import { Router } from 'express';
import * as signalService from '../services/signalService.js';
import { parseSignal } from '../services/parseSignal.js';
import { parseDominance } from '../services/parseDominance.js';

const router = new Router();

// POST /webhook/signal
router.post('/signal', async (req, res, next) => {
  const { token } = req.query;
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  let payload;
  try {
    payload = parseSignal(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const { id } = await signalService.saveSignal(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    return next(err);
  }
});

// POST /webhook/dominance
router.post('/dominance', async (req, res, next) => {
  const { token } = req.query;
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  let payload;
  try {
    payload = parseDominance(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const { id } = await signalService.saveDominance(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    return next(err);
  }
});

export default router;
