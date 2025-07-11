// src/routes/ai.js
import express from 'express';
import {
  orderDecision,
  rationale as rationaleService,
  overtradingCheck,
  monitorPosition,
  antifraudCheck,
  logsResolver
} from '../services/aiService.js';

const router = express.Router();

// 1) Decisão IA - order-decision
router.post('/order-decision', async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.body.userId;
    const { signal, contexto } = req.body;
    const result = await orderDecision(userId, signal, contexto);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// 2) Racional - rationale
router.post('/rationale', async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.body.userId;
    const { trade, contexto } = req.body;
    const raw = await rationaleService(userId, trade, contexto);
    let output;
    if (typeof raw === 'string') {
      output = raw;
    } else if (raw && (raw.justificativa || raw.mensagem)) {
      output = raw.justificativa || raw.mensagem;
    } else {
      output = JSON.stringify(raw || {});
    }
    res.json({ result: output });
  } catch (err) {
    next(err);
  }
});

// 3) Checagem de overtrading - overtrading-check
router.post('/overtrading-check', async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.body.userId;
    const { signal, contexto } = req.body;
    const result = await overtradingCheck(userId, signal, contexto);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// 4) Monitoramento de posição - monitor
router.post('/monitor', async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.body.userId;
    const { trade, contexto } = req.body;
    const result = await monitorPosition(userId, trade, contexto);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// 5) Verificação antifraude - antifraud-check
router.post('/antifraud-check', async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.body.userId;
    const { evento, contexto } = req.body;
    const result = await antifraudCheck(userId, evento, contexto);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// 6) Logs resolver - logs-resolver
router.post('/logs-resolver', async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.body.userId;
    const { logId, logMsg, contexto } = req.body;
    const result = await logsResolver(userId, { logId, logMsg }, contexto);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

export default router;