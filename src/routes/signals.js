import { Router } from 'express';
import logger from '../utils/logger.js';
import { parseSignal } from '../parseSignal.js';
import { saveSignal } from '../services/signals.js';

const router = Router();

router.post('/', async (req, res) => {
  const raw = req.body.trim();
  try {
    logger.info('[raw webhook/signal]', raw);
    const signal = parseSignal(raw);
    const userId = req.userId || null;
    await saveSignal(userId, signal);
    return res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Signal handler error', err);
    return res.status(500).json({ error: 'Signal processing failed' });
  }
});

export default router;
