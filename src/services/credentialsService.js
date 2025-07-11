// src/services/credentialsService.js
import { pool } from './db.js';

export async function saveUserCredentials(userId, { exchange, api_key, api_secret, is_testnet }) {
  const { rows } = await pool.query(
    `
    INSERT INTO user_credentials
      (user_id, exchange, api_key, api_secret, is_testnet, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (user_id, exchange)
    DO UPDATE SET
      api_key    = EXCLUDED.api_key,
      api_secret = EXCLUDED.api_secret,
      is_testnet = EXCLUDED.is_testnet,
      updated_at = NOW()
    RETURNING
      user_id    AS "userId",
      exchange,
      api_key,
      api_secret,
      is_testnet;
    `,
    [userId, exchange, api_key, api_secret, is_testnet]
  );
  return rows[0];
}
