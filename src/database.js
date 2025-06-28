// src/database.js
import pkg from 'pg';
const { Pool } = pkg;

// Pool global
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ========== USUÁRIO ==========
export async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return rows[0];
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows[0];
}

export async function createUser({ nome, email, telefone_whatsapp, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste }) {
  const { rows } = await pool.query(
    `INSERT INTO users (nome, email, telefone_whatsapp, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [nome, email, telefone_whatsapp, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste]
  );
  return rows[0];
}

// ========== BYBIT ==========
export async function saveBybitCredentials({ user_id, api_key, api_secret, is_testnet }) {
  // Faz upsert (atualiza se já existir para esse user+testnet)
  const { rows } = await pool.query(
    `INSERT INTO user_bybit_credentials (user_id, api_key, api_secret, is_testnet)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, is_testnet) DO UPDATE
     SET api_key = $2, api_secret = $3, atualizado_em = NOW()
     RETURNING *`,
    [user_id, api_key, api_secret, is_testnet]
  );
  return rows[0];
}

export async function getBybitCredentials(user_id, is_testnet = false) {
  const { rows } = await pool.query(
    `SELECT api_key, api_secret FROM user_bybit_credentials WHERE user_id = $1 AND is_testnet = $2 LIMIT 1`,
    [user_id, is_testnet]
  );
  return rows[0];
}

// ========== BINANCE ==========
export async function saveBinanceCredentials({ user_id, api_key, api_secret }) {
  const { rows } = await pool.query(
    `INSERT INTO user_binance_credentials (user_id, api_key, api_secret)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
     SET api_key = $2, api_secret = $3, atualizado_em = NOW()
     RETURNING *`,
    [user_id, api_key, api_secret]
  );
  return rows[0];
}

export async function getBinanceCredentials(user_id) {
  const { rows } = await pool.query(
    `SELECT api_key, api_secret FROM user_binance_credentials WHERE user_id = $1 LIMIT 1`,
    [user_id]
  );
  return rows[0];
}

// ========== ASSINATURAS ==========
export async function hasActiveSubscription(user_id) {
  const { rows } = await pool.query(
    `SELECT 1 FROM user_subscriptions
     WHERE user_id = $1 AND status = 'ativo'
     AND data_inicio <= NOW() AND data_fim >= NOW()`,
    [user_id]
  );
  return !!rows.length;
}

// ========== OPERAÇÕES ==========
export async function getUserOperations(user_id) {
  const { rows } = await pool.query(
    `SELECT * FROM user_operations WHERE user_id = $1 ORDER BY opened_at DESC LIMIT 50`,
    [user_id]
  );
  return rows;
}

// ========== MENSAGENS ==========
export async function addUserMessage(user_id, tipo_mensagem, mensagem) {
  await pool.query(
    `INSERT INTO user_messages (user_id, tipo_mensagem, mensagem)
     VALUES ($1, $2, $3)`,
    [user_id, tipo_mensagem, mensagem]
  );
}

// ========== LIMPEZA TESTE ==========
export async function cleanExpiredTestUsers() {
  await pool.query(
    `DELETE FROM users WHERE is_teste = TRUE AND data_fim_teste < NOW() - INTERVAL '1 day'`
  );
}

export async function updateUser(user_id, fields) {
  const allowed = ['nome', 'email', 'telefone_whatsapp', 'cpf', 'data_nascimento', 'senha_hash'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [user_id, ...keys.map(k => fields[k])];

  const { rows } = await pool.query(
    `UPDATE users SET ${sets}, atualizado_em = NOW() WHERE id = $1 RETURNING *`,
    values
  );
  return rows[0];
}


/**
 * Remove dados dos usuários cuja última assinatura terminou há mais de 60 dias.
 * Mantém apenas registros de usuários que ainda têm assinatura vigente ou expirou há menos de 60 dias.
 */
export async function cleanOldInactiveUsers() {
  await pool.query(`
    DELETE FROM users
    WHERE id IN (
      SELECT u.id
      FROM users u
      LEFT JOIN user_subscriptions s ON u.id = s.user_id
      WHERE (
        -- Nunca assinou ou todas as assinaturas já expiraram há mais de 60 dias
        (
          SELECT COALESCE(MAX(s2.data_fim), u.criado_em)
          FROM user_subscriptions s2
          WHERE s2.user_id = u.id
        ) < NOW() - INTERVAL '60 days'
      )
    );
  `);
}

