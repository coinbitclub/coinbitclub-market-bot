// backend/src/routes/webhook.js

import { Router } from 'express';
import { parseSignal }       from '../services/parseSignal.js';
import * as signalService    from '../services/signalService.js';

const router = new Router();

// POST /webhook/signal
router.post('/signal', async (req, res) => {
  const { token } = req.query;
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // valida e extrai ticker (symbol), price e side
  let payload;
  try {
    payload = parseSignal(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // insere no banco usando ticker (coluna não-null)
  const signal = await signalService.saveSignal(payload);
  return res.json({ ok: true, id: signal.id });
});

// POST /webhook/dominance
router.post('/dominance', async (req, res) => {
  const { token } = req.query;
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  const dominance = await signalService.saveDominance(req.body);
  return res.json({ ok: true, id: dominance.id });
});

export default router;
