import { pool } from '../database.js';

// CRUD Usuários
export async function createUser({ nome, email, telefone_whatsapp, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste }) {
  const { rows } = await pool.query(
    `INSERT INTO users (nome, email, telefone_whatsapp, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [nome, email, telefone_whatsapp, cpf, data_nascimento, senha_hash, is_teste, data_inicio_teste, data_fim_teste]
  );
  return rows[0];
}

// CRUD Credenciais Bybit
export async function saveBybitCredentials({ user_id, api_key, api_secret, is_testnet }) {
  const { rows } = await pool.query(
    `INSERT INTO user_bybit_credentials (user_id, api_key, api_secret, is_testnet)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, is_testnet) DO UPDATE SET api_key = $2, api_secret = $3, atualizado_em = NOW()
     RETURNING *`,
    [user_id, api_key, api_secret, is_testnet]
  );
  return rows[0];
}

// Buscar credenciais para operar (real ou test)
export async function getBybitCredentials(user_id, is_testnet = false) {
  const { rows } = await pool.query(
    `SELECT api_key, api_secret FROM user_bybit_credentials WHERE user_id = $1 AND is_testnet = $2 LIMIT 1`,
    [user_id, is_testnet]
  );
  return rows[0];
}

// Função para apagar usuários de teste expirados
export async function cleanExpiredTestUsers() {
  await pool.query(
    `DELETE FROM users WHERE is_teste = TRUE AND data_fim_teste < NOW() - INTERVAL '1 day'`
  );
}

// Outras funções: cadastro de Binance, subscriptions, etc (semelhante ao Bybit)
