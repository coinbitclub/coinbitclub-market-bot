import { pool } from '../database.js';

export async function saveFearGreed({ fear_greed, time }) {
  const sql = `
    INSERT INTO fear_greed (value, timestamp)
    VALUES ($1, $2)
  `;
  await pool.query(sql, [fear_greed, time]);
}