import { pool } from '../database.js';

/**
 * Salva um novo valor do Ã­ndice Fear & Greed
 * @param {Object} params - { index_value, value_classification, timestamp }
 */
export async function saveFearGreed({ index_value, value_classification, timestamp }) {
  await pool.query(
    `INSERT INTO fear_greed (index_value, value_classification, timestamp)
     VALUES ($1, $2, $3)`,
    [index_value, value_classification, timestamp]
  );
}

/**
 * Busca o Ãºltimo valor Fear & Greed
 */
export async function fetchLastFearGreed() {
  const { rows } = await pool.query(
    `SELECT * FROM fear_greed ORDER BY captured_at DESC LIMIT 1`
  );
  return rows[0] || null;
}
