// src/services/aiService.js

import * as real from './aiRealService.js';
import {
  orderDecision   as mockOrderDecision,
  rationale       as mockRationale,
  overtradingCheck as mockOvertradingCheck,
  antifraudCheck  as mockAntifraudCheck,
  logsResolver    as mockLogsResolver,
  monitorPosition as mockMonitorPosition
} from './aiMockService.js';

// Escolhe impl real ou mock conforme env var
const useReal = process.env.USE_REAL_AI === 'true';

/**
 * Decide ordem (BUY|SELL|NONE)
 */
export const orderDecision = useReal
  ? real.orderDecisionReal
  : mockOrderDecision;

/**
 * Gera texto racional (string)
 */
export const rationale = useReal
  ? real.rationaleReal
  : mockRationale;

/**
 * Checa overtrading ( { duplicidade } )
 */
export const overtradingCheck = useReal
  ? real.overtradingCheckReal
  : mockOvertradingCheck;

/**
 * Verificação antifraude ( { suspeito } )
 */
export const antifraudCheck = useReal
  ? real.antifraudCheckReal
  : mockAntifraudCheck;

/**
 * Resolve logs e retorna próxima ação ( { acao } )
 */
export const logsResolver = useReal
  ? real.logsResolverReal
  : mockLogsResolver;

/**
 * Monitora posição e devolve ação ( { acao } )
 */
export const monitorPosition = useReal
  ? real.monitorPositionReal
  : mockMonitorPosition;
