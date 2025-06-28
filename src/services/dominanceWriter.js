import { pool } from '../database.js';

export async function saveDominance({ dominance, time }) {
  // insere em btc_dominance (value NUMERIC, captured_at TIMESTAMPTZ)
  const sql = `
    INSERT INTO btc_dominance (value, captured_at)
    VALUES ($1, $2)
  `;
  await pool.query(sql, [dominance, time]);
}




