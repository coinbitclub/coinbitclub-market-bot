import express from 'express';
import { isUser } from '../middleware/auth.js';
import {
  monitorPosition,
  rationale,
  antifraudCheck,
  logsResolver,
  orderDecision,
  overtradingCheck // 👈 Adicionada aqui
} from '../services/aiService.js';

const router = express.Router();

router.post('/monitor', isUser, monitorPosition);
router.post('/rationale', isUser, rationale);
router.post('/antifraud-check', isUser, antifraudCheck);
router.post('/logs-resolver', isUser, logsResolver);
router.post('/order-decision', isUser, orderDecision);
router.post('/overtrading-check', isUser, overtradingCheck); // 👈 Rota final incluída

export default router;
