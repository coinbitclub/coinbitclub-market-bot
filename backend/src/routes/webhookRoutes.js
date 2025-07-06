// src/routes/webhookRoutes.js
import express from 'express';
import parseSignal from '../utils/parseSignal.js';
import { saveSignal } from '../services/signalService.js';
import {
  parseDominance,
  parseFearGreed,
  parseMarket
} from '../services/parserService.js';
import {
  insertDominance,
  insertFearGreed,
  insertMarket
} from '../services/databaseService.js';

// â”€â”€â”€ Middleware de Bearer Token â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function requireWebhookToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.WEBHOOK_TOKEN}`) {
    return res.sendStatus(401);
  }
  next();
}

const router = express.Router();

// aplica em todas as rotas abaixo
router.use(requireWebhookToken);

// POST /webhook/signal
router.post('/signal', async (req, res, next) => {
  try {
    const signal = parseSignal(req.body);
    const userId = req.userId ?? null;
    await Promise.resolve();
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/dominance
router.post('/dominance', async (req, res, next) => {
  try {
    const dom = parseDominance(req.body);
    await insertDominance(dom);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/fear-greed
router.post('/fear-greed', async (req, res, next) => {
  try {
    const fg = parseFearGreed(req.body);
    await insertFearGreed(fg);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/market
router.post('/market', async (req, res, next) => {
  try {
    const mk = parseMarket(req.body);
    await insertMarket(mk);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;

