// src/services/indicatorService.js
import { fetchKlines } from './marketService.js';

/**
 * Retorna:
 *   – 'REVERSE_LONG' se o preço cruzou a EMA9 para baixo (inverteria um LONG),
 *   – 'REVERSE_SHORT' se o preço cruzou a EMA9 para cima (inverteria um SHORT),
 *   – ou null caso não haja reversão.
 */
export async function getEma9Cross(symbol) {
  // busca as últimas 10 velas de 30m
  const klines = await fetchKlines(symbol, '30', 10);
  const closes = klines.map(k => parseFloat(k.close));
  if (closes.length < 10) return null;

  const period = 9;
  const alpha  = 2 / (period + 1);
  // inicializa com SMA dos primeiros 9 pontos
  let ema = closes.slice(0, period).reduce((sum, x) => sum + x, 0) / period;
  const emaValues = [];

  // calcula o EMA para cada novo close
  for (let i = period; i < closes.length; i++) {
    ema = alpha * closes[i] + (1 - alpha) * ema;
    emaValues.push(ema);
  }
  if (emaValues.length < 2) return null;

  const prevClose = closes[closes.length - 2];
  const prevEma   = emaValues[emaValues.length - 2];
  const lastClose = closes[closes.length - 1];
  const lastEma   = emaValues[emaValues.length - 1];

  // cross under → possível reversão LONG
  if (prevClose > prevEma && lastClose < lastEma) {
    return 'REVERSE_LONG';
  }
  // cross over → possível reversão SHORT
  if (prevClose < prevEma && lastClose > lastEma) {
    return 'REVERSE_SHORT';
  }
  return null;
}
