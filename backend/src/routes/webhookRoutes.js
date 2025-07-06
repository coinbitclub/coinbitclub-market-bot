// src/routes/webhookRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';

// a) importe dos parsers certos
import { parseSignal }    from '../parseSignal.js';
import { parseDominance } from '../parseDominance.js';
import { parseFearGreed } from '../parseFearGreed.js';
import { parseMarket }    from '../parseMarket.js';

// b) importe dos serviços certos
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
    res.json({ status: 'ok' });
    await saveSignal(req.userId ?? null, data);
  } catch (err) {
    next(err);
  }
});

router.post('/dominance', async (req, res, next) => {
  try {
    const data = parseDominance(req.body);
    res.json({ status: 'ok' });
    await insertDominance(data);
  } catch (err) {
    next(err);
  }
});

router.post('/fear-greed', async (req, res, next) => {
  try {
    const data = parseFearGreed(req.body);
    res.json({ status: 'ok' });
    await insertFearGreed(data);
  } catch (err) {
    next(err);
  }
});

router.post('/market', async (req, res, next) => {
  try {
    const data = parseMarket(req.body);
    res.json({ status: 'ok' });
    await insertMarket(data);
  } catch (err) {
    next(err);
  }
});

export default router;
