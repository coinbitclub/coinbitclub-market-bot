import { pool } from '../database.js';

// Expõe query genérica
export const query = (text, params) => pool.query(text, params);

export async function insertSignal({ symbol, price, timestamp, ...rest }) {
  const text = `
    INSERT INTO signals(symbol, price, timestamp, captured_at, raw_payload)
    VALUES($1, $2, $3, NOW(), $4);
  `;
  return pool.query(text, [symbol, price, timestamp, rest]);
}

export async function insertDominance({ value, captured_at, ...rest }) {
  const text = `
    INSERT INTO dominance(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);
}

export async function insertFearGreed({ value, captured_at, ...rest }) {
  const text = `
    INSERT INTO fear_greed(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);
}
