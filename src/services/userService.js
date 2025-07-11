// src/services/userService.js
import {
  pool,
  getUserByEmail,
  getUserById,
  getBinanceCredentials,
  getBybitCredentials,
  saveBinanceCredentials,
  saveBybitCredentials,
  getUserOperations
} from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Cadastra um novo usuário
 */
export async function registerUser({ nome, sobrenome, email, senha, telefone, pais, isTestUser = false }) {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error('Email já cadastrado');
  const hashed = await bcrypt.hash(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (nome, sobrenome, email, senha, telefone, pais, is_test_user, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     RETURNING id, nome, sobrenome, email, telefone, pais, created_at`,
    [nome, sobrenome, email, hashed, telefone, pais, isTestUser]
  );
  return rows[0];
}

/**
 * Autentica o usuário e gera JWT
 */
export async function loginUser({ email, senha }) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Usuário não encontrado');
  const valid = await bcrypt.compare(senha, user.senha);
  if (!valid) throw new Error('Credenciais inválidas');

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

/**
 * Retorna credenciais de API já salvas
 */
export async function getUserSettings(userId) {
  const binance = await getBinanceCredentials(userId);
  const bybit = await getBybitCredentials(userId);
  return { binance, bybit };
}

/**
 * Retorna status do usuário
 */
export async function getUserStatus(userId) {
  const { rows } = await pool.query(
    'SELECT status FROM users WHERE id = $1',
    [userId]
  );
  return rows[0]?.status ?? null;
}

/**
 * Histórico de trades (user_operations)
 */
export async function getTradeHistory(userId) {
  return await getUserOperations(userId);
}

/**
 * Persiste credenciais de exchange
 */
export async function saveCredentials(userId, exchange, apiKey, apiSecret, testnet) {
  if (exchange === 'binance') {
    await saveBinanceCredentials(userId, apiKey, apiSecret, testnet);
  } else if (exchange === 'bybit') {
    await saveBybitCredentials(userId, apiKey, apiSecret, testnet);
  } else {
    throw new Error(`Exchange inválida: ${exchange}`);
  }
  return { exchange };
}

/**
 * Lista apenas as operações da tabela operations
 */
export async function getOperations(userId) {
  const { rows } = await pool.query(
    `SELECT id, symbol, side, price, quantity AS amount, created_at
       FROM operations
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}
