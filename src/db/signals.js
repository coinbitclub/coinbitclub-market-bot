// src/db/signals.js
import { query } from '../db.js';

export async function getLatestSignal(symbol) {
  const res = await query(
    `SELECT * FROM signals WHERE ticker = $1 ORDER BY time DESC LIMIT 1`,
    [symbol]
  );
  return res.rows[0];  // jÃ¡ vem com diff_btc_ema7, cruzou_acima_ema9, etc.
}




