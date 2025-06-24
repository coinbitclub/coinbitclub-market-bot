// src/jobs/executeTrades.js
import { getWalletBalance, placeMarketOrder } from '../services/bybitService.js';
import { getMarketTick } from '../services/marketService.js';
import { getLatestSignal } from '../db/signals.js';
import {
  marketAllows,
  canOpenLong,
  canOpenShort,
  riskAllows
} from '../strategies/tradeRules.js';
import { countOpenTrades, recordTrade } from '../db/trades.js';

export async function executeTrade(symbol, signalType, userId) {
  // 0) risco: no máximo 2 trades abertos
  const openCount = await countOpenTrades(userId);
  if (!riskAllows(openCount)) return;

  // 1) macro-check
  if (!await marketAllows(signalType.toLowerCase())) return;

  // 2) pega sinal e valida critérios específicos
  const signal = await getLatestSignal(symbol);
  if (!signal) return;
  const ok = signalType === 'LONG' ? canOpenLong(signal) : canOpenShort(signal);
  if (!ok) return;

  // 3) saldo e qty
  const balance = await getWalletBalance('USDT');
  if (balance <= 0) return;
  const { lastPrice: price } = await getMarketTick(symbol);
  const leverage = 5;
  const qty = Math.floor((balance * 0.3 * leverage) / price);
  if (qty < 1) return;  // não manda orden muito pequena

  // 4) envia ordem
  const side = signalType === 'LONG' ? 'Buy' : 'Sell';
  const result = await placeMarketOrder(symbol, side, qty, leverage);

  // 5) calcula TP/SL e grava no DB
  const tp = price * (1 + 0.005 * leverage);
  const sl = price * (1 - 0.02 * leverage);
  await recordTrade({
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
