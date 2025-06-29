// src/services/indicatorService.js
import { fetchKlines } from './marketService.js';

/**
 * Analisa cruzamento da EMA9 para reversão.
 *   – 'REVERSE_LONG' se o preço cruzou a EMA9 para baixo (inverte LONG),
 *   – 'REVERSE_SHORT' se cruzou para cima (inverte SHORT),
 *   – null caso contrário.
 */
export async function getEma9Cross(symbol) {
  // busca últimas 10 velas de 30m
  const klines = await fetchKlines(symbol, '30', 10);
  const closes = klines.map(k => parseFloat(k.close));
  if (closes.length < 10) return null;

  const period = 9;
  const alpha  = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((sum, x) => sum + x, 0) / period;
  const emaValues = [];

  for (let i = period; i < closes.length; i++) {
    ema = alpha * closes[i] + (1 - alpha) * ema;
    emaValues.push(ema);
  }
  if (emaValues.length < 2) return null;

  const prevClose = closes[closes.length - 2];
  const prevEma   = emaValues[emaValues.length - 2];
  const lastClose = closes[closes.length - 1];
  const lastEma   = emaValues[emaValues.length - 1];

  if (prevClose > prevEma && lastClose < lastEma) return 'REVERSE_LONG';
  if (prevClose < prevEma && lastClose > lastEma) return 'REVERSE_SHORT';
  return null;
}
