"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeTrade = executeTrade;
var _bybitService = require("../services/bybitService.js");
var _marketService = require("../services/marketService.js");
var _signals = require("../db/signals.js");
var _tradeRules = require("../strategies/tradeRules.js");
var _trades = require("../db/trades.js");
// src/jobs/executeTrades.js

async function executeTrade(symbol, signalType, userId) {
  // 0) risco: no m�ximo 2 trades abertos
  const openCount = await (0, _trades.countOpenTrades)(userId);
  if (!(0, _tradeRules.riskAllows)(openCount)) return;

  // 1) macro-check
  if (!(await (0, _tradeRules.marketAllows)(signalType.toLowerCase()))) return;

  // 2) pega sinal e valida crit�rios espec�ficos
  const signal = await (0, _signals.getLatestSignal)(symbol);
  if (!signal) return;
  const ok = signalType === 'LONG' ? (0, _tradeRules.canOpenLong)(signal) : (0, _tradeRules.canOpenShort)(signal);
  if (!ok) return;

  // 3) saldo e qty
  const balance = await (0, _bybitService.getWalletBalance)('USDT');
  if (balance <= 0) return;
  const {
    lastPrice: price
  } = await (0, _marketService.getMarketTick)(symbol);
  const leverage = 5;
  const qty = Math.floor(balance * 0.3 * leverage / price);
  if (qty < 1) return; // n�o manda orden muito pequena

  // 4) envia ordem
  const side = signalType === 'LONG' ? 'Buy' : 'Sell';
  const result = await (0, _bybitService.placeMarketOrder)(symbol, side, qty, leverage);

  // 5) calcula TP/SL e grava no DB
  const tp = price * (1 + 0.005 * leverage);
  const sl = price * (1 - 0.02 * leverage);
  await (0, _trades.recordTrade)({
    userId,
    orderId: result.orderId,
    symbol,
    side: signalType,
    qty,
    entryPrice: price,
    tp,
    sl
  });
}