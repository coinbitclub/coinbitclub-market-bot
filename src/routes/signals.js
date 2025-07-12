// src/routes/signals.js
import express from 'express';
import { getRecentSignals, getRecentIndicators } from '../services/signalService.js';

const router = express.Router();

// GET /signals
router.get('/', async (req, res, next) => {
  try {
    const signals = await getRecentSignals();
    res.json(signals);
  } catch (err) {
    next(err);
  }
});

// GET /signals/indicators
router.get('/indicators', async (req, res, next) => {
  try {
    const indicators = await getRecentIndicators();
    res.json(indicators);
  } catch (err) {
    next(err);
  }
});

export default router;
