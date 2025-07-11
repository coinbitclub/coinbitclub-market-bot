// src/routes/aiTestRoutes.js
// Mock routes for IA tests (NODE_ENV=test)
import express from 'express';

const router = express.Router();

// 1) Decisão IA – order-decision
router.post('/order-decision', (_req, res) => {
  // Return a result object with a 'decisao' property
  res.json({ result: { decisao: 'OPERAR' } });
});

// 2) Racional – rationale
router.post('/rationale', (_req, res) => {
  // Return a non-empty string
  res.json({ result: 'Justificativa mock.' });
});

// 3) Overtrading – overtrading-check
router.post('/overtrading-check', (_req, res) => {
  // Return an object with a 'duplicidade' property
  res.json({ result: { duplicidade: false } });
});

// 4) Monitoramento de posição – monitor
router.post('/monitor', (_req, res) => {
  // Return an object with an 'acao' property
  res.json({ result: { acao: 'manter' } });
});

// 5) Verificação antifraude – antifraud-check
router.post('/antifraud-check', (_req, res) => {
  // Return an object with a 'suspeito' property
  res.json({ result: { suspeito: false } });
});

// 6) Logs resolver – logs-resolver
router.post('/logs-resolver', (_req, res) => {
  // Return an object with an 'acao' property
  res.json({ result: { acao: 'ignorar' } });
});

export default router;
