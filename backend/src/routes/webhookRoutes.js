// src/routes/webhookRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';

import { parseSignal }    from '../parseSignal.js';
import { parseDominance } from '../parseDominance.js';
import { parseFearGreed } from '../parseFearGreed.js';
import { parseMarket }    from '../parseMarket.js';

import { saveSignal } from '../services/signalService.js';
import {
  insertDominance,
  insertFearGreed,
  insertMarket
} from '../services/databaseService.js';

const router = express.Router();

router.use(verifyToken);

router.post('/signal', async (req, res, next) => {
  try {
    const data = parseSignal(req.body);
    res.status(200).json({ status: 'received' });
    await saveSignal({ ...data, userId: req.userId ?? null });
  } catch (err) {
    next(err);
  }
});

router.post('/dominance', async (req, res, next) => {
  try {
    const data = parseDominance(req.body);
    res.status(200).json({ status: 'received' });
    await insertDominance(data);
  } catch (err) {
    next(err);
  }
});

router.post('/fear-greed', async (req, res, next) => {
  try {
    const data = parseFearGreed(req.body);
    res.status(200).json({ status: 'received' });
    await insertFearGreed(data);
  } catch (err) {
    next(err);
  }
});

router.post('/market', async (req, res, next) => {
  try {
    const data = parseMarket(req.body);
    res.status(200).json({ status: 'received' });
    await insertMarket(data);
  } catch (err) {
    next(err);
  }
});

export default router;
