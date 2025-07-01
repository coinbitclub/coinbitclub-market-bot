import express from "express";
import {
  orderDecision,
  monitorPosition,
  rationale,
  signalProbability,
  overtradingCheck,
  antifraudCheck,
  logsResolver
} from "../services/aiService.js";

const router = express.Router();

/**
 * HEAD TRADER — Aprovação/Reprovação de sinal antes de qualquer trade
 * Body: { userId, signal, contexto }
 */
router.post("/order-decision", orderDecision);

/**
 * MONITORAMENTO de posições abertas (ajuste de stop, take, encerramento antecipado)
 * Body: { userId, trade, contexto }
 */
router.post("/monitor-position", monitorPosition);

/**
 * RACIONAL — Gera explicação/resumo do motivo da operação (entrada/saída)
 * Body: { userId, trade, contexto }
 */
router.post("/rationale", rationale);

/**
 * Probabilidade de sucesso do sinal (para exibir % ao usuário/admin)
 * Body: { userId, signal, contexto }
 */
router.post("/signal-probability", signalProbability);

/**
 * Detecção de duplicidade/overtrading
 * Body: { userId, signal, contexto }
 */
router.post("/overtrading-check", overtradingCheck);

/**
 * Monitoramento antifraude/comportamento suspeito
 * Body: { userId, evento, contexto }
 */
router.post("/antifraud-check", antifraudCheck);

/**
 * RESOLUÇÃO AUTOMÁTICA DE LOGS — IA sugere ou executa ação corretiva em logs simples
 * Body: { logId, logMsg, contexto }
 */
router.post("/logs-resolver", logsResolver);

export default router;
