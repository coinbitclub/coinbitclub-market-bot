import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool de conexão
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

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

export async function updateUser(userId, data) {
  const keys = ['nome', 'sobrenome', 'telefone', 'pais'];
  const updates = [];
  const values = [];
  let idx = 1;

  for (const key of keys) {
    if (data[key] !== undefined) {
      updates.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (updates.length === 0) throw new Error('Nenhum campo para atualizar.');

  values.push(userId);
  const sql = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *`;
  const { rows } = await pool.query(sql, values);
  return rows[0];
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
    `SELECT * FROM operations
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

// ========== CREDENCIAIS - BINANCE ==========
export async function getBinanceCredentials(userId) {
  const { rows } = await pool.query(
    `SELECT api_key AS apiKey, api_secret AS apiSecret, testnet
     FROM users
     WHERE id = $1 AND exchange = 'binance'`,
    [userId]
  );
  return rows[0] || null;
}

export async function saveBinanceCredentials(userId, apiKey, apiSecret, testnet) {
  await pool.query(
    `UPDATE users
     SET api_key = $1, api_secret = $2, testnet = $3, exchange = 'binance'
     WHERE id = $4`,
    [apiKey, apiSecret, testnet, userId]
  );
}

// ========== CREDENCIAIS - BYBIT ==========
export async function getBybitCredentials(userId) {
  const { rows } = await pool.query(
    `SELECT api_key AS apiKey, api_secret AS apiSecret, testnet
     FROM users
     WHERE id = $1 AND exchange = 'bybit'`,
    [userId]
  );
  return rows[0] || null;
}

export async function saveBybitCredentials(userId, apiKey, apiSecret, testnet) {
  await pool.query(
    `UPDATE users
     SET api_key = $1, api_secret = $2, testnet = $3, exchange = 'bybit'
     WHERE id = $4`,
    [apiKey, apiSecret, testnet, userId]
  );
}
