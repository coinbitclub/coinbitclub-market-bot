import { pool } from '../database.js';

// FunÃ§Ã£o utilitÃ¡ria para normalizar timestamp
function normalizeTimestamp(ts) {
  if (typeof ts === 'number') {
    // Unix timestamp (ms)
    return new Date(ts).toISOString();
  }
  if (typeof ts === 'string') {
    if (/^\d+$/.test(ts)) {
      // String sÃ³ de nÃºmeros, trata como timestamp (ms)
      return new Date(Number(ts)).toISOString();
    }
    if (!isNaN(Date.parse(ts))) {
      // String de data vÃ¡lida
      return new Date(ts).toISOString();
    }
  }
  // Valor invÃ¡lido: retorna agora
  return new Date().toISOString();
}

export const query = (text, params) => pool.query(text, params);

export async function insertSignal({ symbol, price, timestamp, ...rest }) {
  const ts = normalizeTimestamp(timestamp);

  const text = `
    INSERT INTO signals(symbol, price, timestamp, captured_at, raw_payload)
    VALUES($1, $2, $3, NOW(), $4);
  `;
  return pool.query(text, [symbol, price, ts, rest]);
}

export async function insertDominance({ value, captured_at, ...rest }) {
  // Ajuste similar se precisar normalizar captured_at
  const text = `
    INSERT INTO dominance(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);
}

export async function insertFearGreed({ value, captured_at, ...rest }) {
  // Ajuste similar se precisar normalizar captured_at
  const text = `
    INSERT INTO fear_greed(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);
}




