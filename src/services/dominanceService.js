import { query } from '../db.js';

// INSERÇÃO DE NOVO DOMINANCE (BTC)
export async function saveDominance(data) {
  const btc_dom = data.btc_dom || data.dominance; // Permite ambos os formatos
  const { eth_dom = null, timestamp } = data;

  // Insert dinâmico (com ou sem ETH dominance)
  let sql, params;
  if (eth_dom !== null && eth_dom !== undefined) {
    sql = `
      INSERT INTO dominance (btc_dom, eth_dom, timestamp, created_at)
      VALUES ($1, $2, $3, NOW())
    `;
    params = [btc_dom, eth_dom, timestamp];
  } else {
    sql = `
      INSERT INTO dominance (btc_dom, timestamp, created_at)
      VALUES ($1, $2, NOW())
    `;
    params = [btc_dom, timestamp];
  }

  return query(sql, params);
}

// CONSULTA DIFERENÇA PERCENTUAL
export async function getBtcDominanceDiff() {
  try {
    const rows = await query(`
      SELECT close, ema7
        FROM dominance
       ORDER BY timestamp DESC
       LIMIT 1
    `);

    if (rows.length === 0) return 0;

    const closeVal = parseFloat(rows[0].close);
    const ema7Val  = parseFloat(rows[0].ema7);

    if (isNaN(closeVal) || isNaN(ema7Val) || ema7Val === 0) return 0;

    return ((closeVal - ema7Val) / ema7Val) * 100;
  } catch (err) {
    return 0;
  }
}
