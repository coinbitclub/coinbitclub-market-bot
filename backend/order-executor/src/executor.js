import ccxt from 'ccxt';
import { validateBalance, validateConcurrentOps, calculateQuantity } from './riskManager.js';

export async function executeOrder(order) {
  if (!(await validateBalance(order.userId))) return;
  if (!(await validateConcurrentOps(order.userId))) return;
  const qty = calculateQuantity(order.balance);
  const exchange = new ccxt.binance({ apiKey: order.key, secret: order.secret });
  await exchange.createMarketOrder(order.symbol, order.side, qty);
}
