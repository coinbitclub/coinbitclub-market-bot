"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculatePositionSize = calculatePositionSize;
exports.calculateTpsl = calculateTpsl;
exports.evaluateEntryCriteria = evaluateEntryCriteria;
// src/strategies/tradingCriteria.js
// Avalia critérios de entrada e saída e calcula TP/SL

/**
 * Verifica gatilhos globais e específicos para abrir posição LONG ou SHORT
 * @param {Object} signal - sinal vindo do Pine (JSON do webhook)
 * @param {Object} marketStats - { fearGreed, btcDominanceDiff, atrPct, volPct }
 * @returns {'long'|'short'|null} direção ou null para não operar
 */
function evaluateEntryCriteria(signal, marketStats) {
  const fg = marketStats.fearGreed;
  const diff = signal.diff_btc_ema7;
  const cruzouAcima = !!signal.cruzou_acima_ema9;
  const cruzouAbaixo = !!signal.cruzou_abaixo_ema9;
  const rsi4h = signal.rsi_4h;
  const rsi15 = signal.rsi_15;
  const mom = signal.momentum_15;

  // Gatilhos F&G
  if (fg < 30 && signal.side === 'short') return null;
  if (fg > 75 && signal.side === 'long') return null;

  // Filtros BTC volatilidade/volume
  if (marketStats.atrPct < 0.2 || marketStats.volPct < 0.7) return null;

  // Cenário LONG
  if (fg < 75 && diff > 0.3 && cruzouAcima && rsi4h < 75 && rsi15 < 75 && mom > 0) return 'long';

  // Cenário SHORT
  if (fg > 30 && diff < -0.3 && cruzouAbaixo && rsi4h > 35 && rsi15 > 35 && mom < 0) return 'short';
  return null;
}

/**
 * Calcula porcentagens de Take Profit e Stop Loss
 * @param {number} leverage - alavancagem selecionada
 * @returns {{tpPct: number, slPct: number}}
 */
function calculateTpsl(leverage) {
  const defaultLev = 6;
  const maxLev = 10;
  const lev = Math.min(leverage, maxLev);

  // TP = 0.5% x leverage
  const tpPct = 0.5 * lev;
  // SL = 3x alavancagem default
  const slPct = 3 * defaultLev;
  return {
    tpPct,
    slPct
  };
}

/**
 * Calcula tamanho de posição: 30% do saldo disponível
 * @param {number} balance - saldo em USDT
 * @returns {number}
 */
function calculatePositionSize(balance) {
  return parseFloat((balance * 0.3).toFixed(8));
}