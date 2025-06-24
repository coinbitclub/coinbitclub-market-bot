"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canOpenLong = canOpenLong;
exports.canOpenShort = canOpenShort;
exports.marketAllows = marketAllows;
exports.riskAllows = riskAllows;
var _fetchAndSaveData = require("../services/fetchAndSaveData.js");
// src/strategies/tradeRules.js

const FNG_LONG_MAX = 30;
const FNG_SHORT_MIN = 75;
const MAX_OPEN_TRADES = 2;

// 0) Regras macro (F&G + ATR% e volume do BTC)
async function marketAllows(side) {
  const fng = await (0, _fetchAndSaveData.fetchFearGreed)();
  const {
    atrPct,
    volumeRatio
  } = await (0, _fetchAndSaveData.fetchBTCStats)();
  if (side === 'long' && fng > FNG_LONG_MAX) return false;
  if (side === 'short' && fng < FNG_SHORT_MIN) return false;
  if (atrPct <= 0.2 || volumeRatio <= 0.7) return false;
  return true;
}

// 1a) Entrada LONG
function canOpenLong({
  diff_btc_ema7,
  cruzou_acima_ema9,
  rsi_4h,
  rsi_15,
  momentum_15
}) {
  return diff_btc_ema7 > 0.3 && cruzou_acima_ema9 && rsi_4h < 75 && rsi_15 < 75 && momentum_15 > 0;
}

// 1b) Entrada SHORT
function canOpenShort({
  diff_btc_ema7,
  cruzou_abaixo_ema9,
  rsi_4h,
  rsi_15,
  momentum_15
}) {
  return diff_btc_ema7 < -0.3 && cruzou_abaixo_ema9 && rsi_4h > 35 && rsi_15 > 35 && momentum_15 < 0;
}

// 2) Gestão de risco (máx. 2 trades por user)
function riskAllows(openCount) {
  return openCount < MAX_OPEN_TRADES;
}