import { query } from '../db.js';

export async function saveSignal({ time, ticker, payload }) {
  const sql = `
    INSERT INTO signals (time, ticker, payload, created_at, updated_at)
    VALUES ($1, $2, $3, now(), now())
  `;
  await query(sql, [time, ticker, payload]);
}