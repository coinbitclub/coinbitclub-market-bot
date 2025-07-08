// src/services/indicators.js
import { RSI, EMA, ATR } from 'technicalindicators';

/**
 * Calcula RSI de um array de closes.
 */
export function calcRSI(closes, period) {
  return RSI.calculate({ values: closes, period });
}

/**
 * Calcula EMA de um array de closes.
 */
export function calcEMA(closes, period) {
  return EMA.calculate({ values: closes, period });
}

/**
 * Calcula ATR de arrays de high, low e close.
 */
export function calcATR(high, low, close, period) {
  return ATR.calculate({ high, low, close, period });
}

/**
 * Calcula momentum simples (close[i] - close[i-period]).
 */
export function calcMomentum(closes, period) {
  return closes
    .map((v, i, arr) => (i >= period ? v - arr[i - period] : undefined))
    .filter(v => v !== undefined);
}

/**
 * Diferença atual vs EMA de mesmo índice.
 */
export function calcDiff(current, emaValue) {
  return current - emaValue;
}
