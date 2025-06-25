import { pool } from '../database.js';

export async function saveFearGreed({ fear_greed: value, time }) {
  await pool.query(
    `INSERT INTO fear_greed (value, timestamp, captured_at)
     VALUES ($1, $2, NOW())`,
    [value, time]
  );
}

/** Persiste no banco um novo valor de Fear & Greed. */
export async function saveFearGreed({ fear_greed: value, time }) {
  await pool.query(
    \INSERT INTO fear_greed (value, \"timestamp\", captured_at) VALUES (, , NOW())\,
    [value, time]
  );
}
