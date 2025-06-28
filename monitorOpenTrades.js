// src/jobs/monitorOpenTrades.js
import { getOpenTrades, closeTrade } from '../db/trades.js';
import { getMarketData } from '../services/marketService.js';

/**
 * Verifica todas as trades abertas de um usuário e fecha
 * automaticamente ao atingir TP ou SL.
 */
export async function monitorOpenTrades(userId) {
  console.log(`[Monitor] Checando trades abertas do user ${userId}...`);

  // 1) Pega trades abertas
  const trades = await getOpenTrades(userId);

  for (const trade of trades) {
    const { order_id, symbol, tp, sl } = trade;

    // 2) Puxa preço atual
    const { lastPrice } = await getMarketData(symbol);

    // 3) Verifica TP / SL
    let exitReason = null;
    if (tp != null && lastPrice >= tp) {
      exitReason = 'tp-hit';
    }
    if (sl != null && lastPrice <= sl) {
      exitReason = 'sl-hit';
    }

    // 4) Se bateu alguma condição, fecha a trade
    if (exitReason) {
      await closeTrade(order_id, lastPrice, exitReason);
      console.log(`[Monitor] Trade ${order_id} de ${symbol} fechada por ${exitReason} @ ${lastPrice}`);
    }
  }
}




