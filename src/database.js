// src/services/databaseService.js
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Executa uma query no PostgreSQL
 * @param {string} text  – SQL com $1, $2…
 * @param {any[]} params – valores para cada placeholder
 */
export async function query(text, params) {
  return pool.query(text, params);
}

// ========== USUÁRIO ==========
export async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function getUserById(userId) {
  const { rows } = await pool.query(
    `SELECT id, nome, sobrenome, email, telefone, pais, created_at
       FROM users
      WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
}



// ========== LIMPEZAS ==========
export async function cleanExpiredTestUsers() {
  const { rowCount } = await pool.query(`
    DELETE FROM users
     WHERE is_test_user = true
       AND created_at < NOW() - INTERVAL '1 DAY'
  `);
  return rowCount;
}

export async function cleanOldInactiveUsers() {
  const { rowCount } = await pool.query(`
    DELETE FROM users
     WHERE is_test_user = false
       AND updated_at < NOW() - INTERVAL '30 DAYS'
  `);
  return rowCount;
}

// ========== MENSAGENS ==========
export async function addUserMessage(userId, message) {
  await pool.query(
    `INSERT INTO user_messages (user_id, message, created_at)
     VALUES ($1, $2, NOW())`,
    [userId, message]
  );
}

// ========== OPERAÇÕES ==========
export async function getUserOperations(userId) {
  const { rows } = await pool.query(
    `SELECT *
       FROM user_operations
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

// ========== SUBSCRIÇÃO ==========
export async function hasActiveSubscription(userId) {
  const { rows } = await pool.query(
    `SELECT 1
       FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND expires_at > NOW()
      LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

// ========== CREDENCIAIS – BINANCE ==========
export async function getBinanceCredentials(userId) {
  const { rows } = await pool.query(
    `SELECT
       exchange,
       api_key    AS "apiKey",
       api_secret AS "apiSecret",
       testnet
     FROM user_credentials
     WHERE user_id = $1
       AND exchange = 'binance'`,
    [userId]
  );
  return rows[0] || null;
}

export async function saveBinanceCredentials(userId, apiKey, apiSecret, testnet) {
  await pool.query(
    `INSERT INTO user_credentials
       (user_id, exchange, api_key, api_secret, testnet, created_at, updated_at)
     VALUES ($1, 'binance', $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id, exchange)
       DO UPDATE SET
         api_key    = EXCLUDED.api_key,
         api_secret = EXCLUDED.api_secret,
         testnet    = EXCLUDED.testnet,
         updated_at = NOW()`,
    [userId, apiKey, apiSecret, testnet]
  );
}

// ========== CREDENCIAIS – BYBIT ==========
export async function getBybitCredentials(userId) {
  const { rows } = await pool.query(
    `SELECT
       exchange,
       api_key    AS "apiKey",
       api_secret AS "apiSecret",
       testnet
     FROM user_credentials
     WHERE user_id = $1
       AND exchange = 'bybit'`,
    [userId]
  );
  return rows[0] || null;
}

export async function saveBybitCredentials(userId, apiKey, apiSecret, testnet) {
  await pool.query(
    `INSERT INTO user_credentials
       (user_id, exchange, api_key, api_secret, testnet, created_at, updated_at)
     VALUES ($1, 'bybit', $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id, exchange)
       DO UPDATE SET
         api_key    = EXCLUDED.api_key,
         api_secret = EXCLUDED.api_secret,
         testnet    = EXCLUDED.testnet,
         updated_at = NOW()`,
    [userId, apiKey, apiSecret, testnet]
  );
}
