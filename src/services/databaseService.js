import { pool } from '../database.js';

// Função utilitária para normalizar timestamp
function normalizeTimestamp(ts) {
  if (typeof ts === 'number') {
    return new Date(ts).toISOString();
  }
  if (typeof ts === 'string') {
    if (/^\d+$/.test(ts)) {
      return new Date(Number(ts)).toISOString();
    }
    if (!isNaN(Date.parse(ts))) {
      return new Date(ts).toISOString();
    }
  }
  return new Date().toISOString();
}

export const query = (text, params) => pool.query(text, params);

// Insere novo sinal na tabela signals
export async function insertSignal({ symbol, price, timestamp, ...rest }) {
  const ts = normalizeTimestamp(timestamp);
  const text = `
    INSERT INTO signals(symbol, price, timestamp, captured_at, raw_payload)
    VALUES($1, $2, $3, NOW(), $4);
  `;
  return pool.query(text, [symbol, price, ts, rest]);
}

// Insere novo dominance
export async function insertDominance({ value, captured_at, ...rest }) {
  const text = `
    INSERT INTO dominance(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);
}

// Insere novo Fear & Greed
export async function insertFearGreed({ value, captured_at, ...rest }) {
  const text = `
    INSERT INTO fear_greed(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);
}
