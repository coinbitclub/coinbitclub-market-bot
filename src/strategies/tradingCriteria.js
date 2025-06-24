// src/strategies/tradingCriteria.js
// Avaliação dos critérios globais e específicos de entrada/saída conforme premissas do projeto

import { getLatestFearGreed } from '../services/fearGreedService.js';
import { getLatestDominance } from '../services/dominanceService.js';

/**
 * Avalia se, no macro, o mercado permite LONG ou SHORT com base em Fear & Greed
 */
function allowSideByFearGreed(fearGreedValue, side) {
  if (fearGreedValue < 30 && side === 'BUY') return true;
  if (fearGreedValue > 75 && side === 'SELL') return true;
  if (fearGreedValue >= 30 && fearGreedValue <= 75) return true; // ambos permitidos entre 30 e 75
  return false;
}

/**
 * Avalia cenário de entrada LONG ou SHORT para um sinal específico
 * @param {object} signal  // objeto contendo: symbol, cruzou_acima_ema9, cruzou_abaixo_ema9, rsi_4h, rsi_15, momentum_15, diff_btc_ema7
 * @returns {Promise<boolean>} indica se todos os critérios foram atendidos
 */
export async function evaluateEntryCriteria(signal) {
  const fg = (await getLatestFearGreed()).value;
  const dom = await getLatestDominance();
  const diffDominance = signal.diff_btc_ema7;
  const side = signal.type === 'entry' && signal.cruzou_acima_ema9 ? 'BUY' : 'SELL';

  // 1. Macro: F&G
  if (!allowSideByFearGreed(fg, side)) return false;

  // 2. Cenário LONG
  if (side === 'BUY') {
    if (fg >= 75) return false;
    if (diffDominance <= 0.3) return false;
    if (!signal.cruzou_acima_ema9) return false;
    if (signal.rsi_4h >= 75 || signal.rsi_15 >= 75) return false;
    if (signal.momentum_15 <= 0) return false;
    return true;
  }

  // 3. Cenário SHORT
  if (side === 'SELL') {
    if (fg <= 30) return false;
    if (diffDominance >= -0.3) return false;
    if (!signal.cruzou_abaixo_ema9) return false;
    if (signal.rsi_4h <= 35 || signal.rsi_15 <= 35) return false;
    if (signal.momentum_15 >= 0) return false;
    return true;
  }

  return false;
}

/**
 * Avalia se deve encerrar posição aberta, com base nos gatilhos de saída
 * @param {object} position  // dados da posição incluindo tp, sl, side, entryPrice
 * @param {object} market   // dados atuais: diff_btc_ema7, cruzado reverso, price
 * @returns {boolean} true = encerra, false = mantém
 */
export function evaluateExitCriteria(position, market) {
  const { diff_btc_ema7, cruzou_acima_ema9, cruzou_abaixo_ema9, price } = market;
  const { side, entryPrice, leverage } = position;

  // 1) Gatilho diff da dominância retorna a ±0.1%
  if (Math.abs(diff_btc_ema7) <= 0.1) return true;

  // 2) Cruzamento reverso de EMA9
  if (side === 'BUY' && cruzou_abaixo_ema9) return true;
  if (side === 'SELL' && cruzou_acima_ema9) return true;

  // 3) TP/SL (já enviados como ordem OCO no momento da abertura)
  // A lógica de TP/SL fica a cargo da Bybit: aqui apenas monitoramos log

  return false; // mantém posição
}

/**
 * Calcula parâmetros de TP e SL com base em alavancagem
 * @param {number} leverage
 * @returns {{ tpPct: number, slPct: number }} TP e SL em %
 */
export function calculateTpsl(leverage = 5) {
  const tpPct = 0.5 * leverage;       // 0.5% x alavancagem
  const slPct = 2 * leverage * 1;     // 2x alavancagem
  return { tpPct, slPct };
}
