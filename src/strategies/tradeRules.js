// src/strategies/tradeRules.js
import { fetchFearGreed, fetchDominance, fetchBTCStats } from '../services/fetchAndSaveData.js';

const FNG_LONG_MAX = 30;
const FNG_SHORT_MIN = 75;
const MAX_OPEN_TRADES = 2;

// 0) Regras macro (F&G + ATR% e volume do BTC)
export async function marketAllows(side) {
  const fng = await fetchFearGreed();
  const { atrPct, volumeRatio } = await fetchBTCStats();
  if (side === 'long' && fng > FNG_LONG_MAX) return false;
  if (side === 'short' && fng < FNG_SHORT_MIN) return false;
  if (atrPct <= 0.2 || volumeRatio <= 0.7) return false;
  return true;
}

// 1a) Entrada LONG
export function canOpenLong({ diff_btc_ema7, cruzou_acima_ema9, rsi_4h, rsi_15, momentum_15 }) {
  return (
    diff_btc_ema7 > 0.3 &&
    cruzou_acima_ema9 &&
    rsi_4h < 75 &&
    rsi_15 < 75 &&
    momentum_15 > 0
  );
}

// 1b) Entrada SHORT
export function canOpenShort({ diff_btc_ema7, cruzou_abaixo_ema9, rsi_4h, rsi_15, momentum_15 }) {
  return (
    diff_btc_ema7 < -0.3 &&
    cruzou_abaixo_ema9 &&
    rsi_4h > 35 &&
    rsi_15 > 35 &&
    momentum_15 < 0
  );
}

// 2) GestÃ£o de risco (mÃ¡x. 2 trades por user)
export function riskAllows(openCount) {
  return openCount < MAX_OPEN_TRADES;
}
