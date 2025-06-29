import { Router } from 'express';
import logger from '../utils/logger.js';
import { parseSignal } from '../parseSignal.js';
import { saveSignal } from '../services/signalService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    logger.info('[raw webhook/signal]', req.body);
    const signal = parseSignal(req.body); // já é objeto
    const userId = req.userId || null;
    await saveSignal(userId, signal);
    return res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Signal handler error', err);
    return res.status(500).json({ error: 'Signal processing failed' });
  }
});

export default router;
