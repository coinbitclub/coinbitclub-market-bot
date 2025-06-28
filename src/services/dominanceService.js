import { pool } from '../database.js';

/**
 * Salva um novo valor de dominance
 * @param {Object} params - { btc_dom, ema7, timestamp }
 */
export async function saveDominance({ btc_dom, ema7, timestamp }) {
  await pool.query(
    `INSERT INTO dominance (btc_dom, ema7, timestamp)
     VALUES ($1, $2, $3)`,
    [btc_dom, ema7, timestamp]
  );
}

/**
 * Busca o Ãºltimo valor de dominance
 */
export async function fetchLastDominance() {
  const { rows } = await pool.query(
    `SELECT * FROM dominance ORDER BY created_at DESC LIMIT 1`
  );
  return rows[0] || null;
}




