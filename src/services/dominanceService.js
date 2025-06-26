import { pool } from '../database.js';

export async function saveDominance({ dominance: value, time }) {
  await pool.query(
    `INSERT INTO btc_dominance (value, captured_at)
     VALUES ($1, $2)`,
    [value, time]
  );
}