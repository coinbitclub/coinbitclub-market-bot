// src/routes/signal.js
import express from 'express';
import { saveSignal } from '../services/signalService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    // req.userId pode vir de algum auth middleware, ou deixe null
    await saveSignal(req.userId, req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
