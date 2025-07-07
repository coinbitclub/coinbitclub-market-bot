import { Router } from 'express';
import { parseSignal } from '../services/parseSignal.js';
import { parseDominance } from '../services/parseDominance.js';
import * as signalService from '../services/signalService.js';

const router = new Router();

// POST /webhook/signal
router.post('/signal', async (req, res) => {
  const { token } = req.query;
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  // valida e extrai
  const payload = parseSignal(req.body);
  const { id } = await signalService.saveSignal(payload);
  return res.json({ ok: true, id });
});

// POST /webhook/dominance
router.post('/dominance', async (req, res) => {
  const { token } = req.query;
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  // valida e extrai
  const payload = parseDominance(req.body);
  const { id } = await signalService.saveDominance(payload);
  return res.json({ ok: true, id });
});

export default router;
