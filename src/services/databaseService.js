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

export const query = (text, params) => pool.query(text, params);

// Insere novo sinal na tabela signals
export async function insertSignal({ symbol, price, timestamp, ...rest }) {
  const ts = normalizeTimestamp(timestamp);
  const text = `
    INSERT INTO signals(symbol, price, timestamp, captured_at, raw_payload)
    VALUES($1, $2, $3, NOW(), $4);
  `;
  return pool.query(text, [symbol, price, ts, rest]);

// Insere novo dominance
export async function insertDominance({ value, captured_at, ...rest }) {
  const text = `
    INSERT INTO dominance(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);

// Insere novo Fear & Greed
export async function insertFearGreed({ value, captured_at, ...rest }) {
  const text = `
    INSERT INTO fear_greed(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  return pool.query(text, [value, captured_at, rest]);

// Adicionado automaticamente em 2025-06-28 22:21:51
  const { rows } = await query(
  
    'SELECT api_key, api_secret FROM bybit_credentials WHERE user_id =  AND is_testnet =  LIMIT 1',
    [user_id, is_testnet]
  );
    [user_id, is_testnet]
  );
  return rows[0] || null;

// Adicionado automaticamente em 2025-06-28 22:25:04
  const { rows } = await query(
    `SELECT api_key, api_secret FROM bybit_credentials WHERE user_id = $1 AND is_testnet = $2 LIMIT 1`,
    [user_id, is_testnet]
  );
  return rows[0] || null;
  
    'SELECT api_key, api_secret FROM bybit_credentials WHERE user_id =  AND is_testnet =  LIMIT 1',
    [user_id, is_testnet]
  );
  
    'SELECT api_key, api_secret FROM bybit_credentials WHERE user_id =  AND is_testnet =  LIMIT 1',
    [user_id, is_testnet]
  );
    'SELECT api_key, api_secret FROM bybit_credentials WHERE user_id =  AND is_testnet =  LIMIT 1',
    [user_id, is_testnet]
  );
export async function getBybitCredentials(user_id, is_testnet = false) {
  const { rows } = await pool.query(
    'SELECT api_key, api_secret FROM bybit_credentials WHERE user_id =  AND is_testnet =  LIMIT 1',
    [user_id, is_testnet]
  );
  return rows[0];
}
