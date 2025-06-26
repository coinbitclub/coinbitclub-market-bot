import { pool } from '../database.js';

export async function saveSignal({ time, ticker: symbol, payload }) {
  await pool.query(
    `INSERT INTO market (symbol, price, captured_at)
     VALUES ($1, $2, $3)`,
    [symbol, payload.close, time]
  );
}
