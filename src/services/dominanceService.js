import { query } from '../db.js';

export async function saveDominance(data) {
  const btc_dom = data.btc_dom ?? data.dominance;
  const { eth_dom = null, timestamp } = data;
  let sql, params;
  if (eth_dom != null) {
    sql = `INSERT INTO dominance (btc_dom, eth_dom, timestamp, created_at) VALUES ($1, $2, $3, now())`;
    params = [btc_dom, eth_dom, timestamp];
  } else {
    sql = `INSERT INTO dominance (btc_dom, timestamp, created_at) VALUES ($1, $2, now())`;
    params = [btc_dom, timestamp];
  }
  await query(sql, params);
}

export async function getBtcDominanceDiff() {
  const rows = await query(
    `SELECT btc_dom AS close,
            AVG(btc_dom) OVER (ORDER BY timestamp ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ema7
       FROM dominance
      ORDER BY timestamp DESC
      LIMIT 1`
  );
  if (!rows.length) return 0;
  const close = parseFloat(rows[0].close), ema7 = parseFloat(rows[0].ema7);
  if (!ema7) return 0;
  return (close - ema7) / ema7 * 100;
}