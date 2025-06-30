import { pool } from '../database.js';

/**
 * Cria usuário com possibilidade de teste (trial)
 */
export async function createUser({
  nome, email, telefone, cpf, data_nascimento,
  senha_hash, is_teste = true, data_inicio_teste, data_fim_teste
}) {
  const { rows } = await pool.query(
    `INSERT INTO users (nome, email, telefone, cpf, data_nascimento, password_hash, is_teste, data_inicio_teste, data_fim_teste)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [nome, email, telefone, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste]
  );
  return rows[0];
}

/**
 * Salva ou atualiza credenciais Bybit (real ou testnet)
 */
export async function saveBybitCredentials({ user_id, api_key, api_secret, is_testnet }) {
  const { rows } = await pool.query(
    `INSERT INTO user_bybit_credentials (user_id, api_key, api_secret, is_testnet, atualizado_em)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, is_testnet) DO UPDATE
     SET api_key = $2, api_secret = $3, atualizado_em = NOW()
     RETURNING *`,
    [user_id, api_key, api_secret, is_testnet]
  );
  return rows[0];
}

/**
 * Salva ou atualiza credenciais Binance (real ou testnet)
 */
export async function saveBinanceCredentials({ user_id, api_key, api_secret, is_testnet }) {
  const { rows } = await pool.query(
    `INSERT INTO user_binance_credentials (user_id, api_key, api_secret, is_testnet, atualizado_em)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, is_testnet) DO UPDATE
     SET api_key = $2, api_secret = $3, atualizado_em = NOW()
     RETURNING *`,
    [user_id, api_key, api_secret, is_testnet]
  );
  return rows[0];
}

/**
 * Busca credenciais Bybit (real ou testnet)
 */
export async function getBybitCredentials(user_id, is_testnet = false) {
  const { rows } = await pool.query(
    `SELECT api_key, api_secret FROM user_bybit_credentials WHERE user_id = $1 AND is_testnet = $2 LIMIT 1`,
    [user_id, is_testnet]
  );
  return rows[0];
}

/**
 * Busca credenciais Binance (real ou testnet)
 */
export async function getBinanceCredentials(user_id, is_testnet = false) {
  const { rows } = await pool.query(
    `SELECT api_key, api_secret FROM user_binance_credentials WHERE user_id = $1 AND is_testnet = $2 LIMIT 1`,
    [user_id, is_testnet]
  );
  return rows[0];
}

/**
 * Limpa usuários de teste expirados
 */
export async function cleanExpiredTestUsers() {
  await pool.query(
    `DELETE FROM users WHERE is_teste = TRUE AND data_fim_teste < NOW() - INTERVAL '1 day'`
  );
}

// Outras funções para assinaturas, upgrades, etc, seguem padrão similar.
