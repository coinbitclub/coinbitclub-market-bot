import { pool } from '../database.js';

/**
 * Salva dominance no formato btc_dominance (value NUMERIC, captured_at TIMESTAMPTZ)
 */
export async function saveDominance({ dominance, time }) {
  const sql = `
    INSERT INTO btc_dominance (value, captured_at)
    VALUES ($1, $2)
  `;
  await pool.query(sql, [dominance, time]);
}
