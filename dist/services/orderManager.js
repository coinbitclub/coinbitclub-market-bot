"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitorPositions = monitorPositions;
var _database = require("../database.js");
var _bybitAdapter = require("../adapters/bybitAdapter.js");
var _indicators = require("./indicators.js");
async function monitorPositions() {
  const res = await _database.pool.query(`SELECT * FROM positions WHERE status='open'`);
  for (const pos of res.rows) {
    const {
      id,
      symbol,
      side,
      qty,
      entry_price,
      tp_price,
      sl_price
    } = pos;

    // 1) Buscar últimos 9 candles e BTC.D para EMA/diff
    const mkt = await _database.pool.query(`SELECT close FROM market ORDER BY timestamp DESC LIMIT 9`);
    const dom = await _database.pool.query(`SELECT btc_dom FROM btc_dominance ORDER BY data_hora DESC LIMIT 9`);
    const closes = mkt.rows.map(r => r.close).reverse();
    const btcds = dom.rows.map(r => r.btc_dom).reverse();
    const ema9 = (0, _indicators.calcEMA)(closes, 9);
    const currentPrice = closes[closes.length - 1];
    const currentDiff = (0, _indicators.calcDiff)(btcds[btcds.length - 1], ema9[ema9.length - 1]);
    let shouldClose = false,
      reason = '';

    // 2) TP / SL
    if (tp_price && currentPrice >= tp_price) {
      shouldClose = true;
      reason = 'TP hit';
    } else if (sl_price && currentPrice <= sl_price) {
      shouldClose = true;
      reason = 'SL hit';
    }
    // 3) Diff exit ±0,1%
    else if (Math.abs(currentDiff) <= 0.001) {
      shouldClose = true;
      reason = 'Diff exit';
    }
    // 4) Reversão de EMA9
    else {
      const emaCurr = ema9[ema9.length - 1];
      if (side === 'Buy' && currentPrice < emaCurr) {
        shouldClose = true;
        reason = 'EMA reversal';
      } else if (side === 'Sell' && currentPrice > emaCurr) {
        shouldClose = true;
        reason = 'EMA reversal';
      }
    }

    // 5) Se atender saída, fecha posição
    if (shouldClose) {
      await (0, _bybitAdapter.closePosition)({
        symbol: `${symbol}USDT`,
        side,
        qty
      });
      await _database.pool.query(`UPDATE positions
            SET status='closed',
                closed_at=NOW(),
                exit_reason=$1
          WHERE id=$2`, [reason, id]);
      console.log(`🔒 Position ${id} closed (${reason})`);
    }
  }
}