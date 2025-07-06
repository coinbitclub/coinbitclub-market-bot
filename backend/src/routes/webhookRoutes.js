// src/routes/webhookRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';

import {
  parseSignal,
  parseDominance,
  parseFearGreed,
  parseMarket
} from '../services/parserService.js';

import {
  saveSignal,
  insertDominance,
  insertFearGreed,
  insertMarket
} from '../services/webhookService.js';

const router = express.Router();

// Autenticação (Bearer JWT ou ?token=…) para todas as rotas
router.use(verifyToken);

/**
 * POST /webhook/signal
 * Responde 200 imediatamente e salva sinal em background.
 */
router.post('/signal', async (req, res, next) => {
  try {
    const data = parseSignal(req.body);
    res.status(200).json({ status: 'received' });
    await saveSignal({ ...data, userId: req.userId ?? null });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /webhook/dominance
 */
router.post('/dominance', async (req, res, next) => {
  try {
    const data = parseDominance(req.body);
    res.status(200).json({ status: 'received' });
    await insertDominance(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /webhook/fear-greed
 */
router.post('/fear-greed', async (req, res, next) => {
  try {
    const data = parseFearGreed(req.body);
    res.status(200).json({ status: 'received' });
    await insertFearGreed(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /webhook/market
 */
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
