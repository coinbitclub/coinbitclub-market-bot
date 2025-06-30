import express from 'express';
import { parseSignal } from '../parseSignal.js';
import { saveSignal } from '../services/signalService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const signal = parseSignal(req.body);
    const userId = req.userId || null;
    await saveSignal(userId, signal);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
