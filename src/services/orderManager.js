import { pool } from '../database.js';
import { closePosition } from '../adapters/bybitAdapter.js';
import { calcEMA, calcDiff } from './indicators.js';

export async function monitorPositions() {
  const res = await pool.query(`SELECT * FROM positions WHERE status='open'`);
  for (const pos of res.rows) {
    const { id, symbol, side, qty, entry_price, tp_price, sl_price } = pos;

    // Buscar candles e BTC.D
    const mkt = await pool.query(
      `SELECT close FROM market ORDER BY timestamp DESC LIMIT 9`
    );
    const dom = await pool.query(
      `SELECT btc_dom FROM btc_dominance ORDER BY data_hora DESC LIMIT 9`
    );
    const closes = mkt.rows.map(r => r.close).reverse();
    const btcds = dom.rows.map(r => r.btc_dom).reverse();
    const ema9 = calcEMA(closes, 9);
    const currentPrice = closes[closes.length - 1];
    const currentDiff = calcDiff(btcds[btcds.length - 1], ema9[ema9.length - 1]);

    let shouldClose = false, reason = '';

    // TP/SL
    if (tp_price && currentPrice >= tp_price) { shouldClose = true; reason = 'TP hit'; }
    if (sl_price && currentPrice <= sl_price) { shouldClose = true; reason = 'SL hit'; }

    if (shouldClose) {
      await closePosition({ id, symbol, side, reason });
    }
  }
}




