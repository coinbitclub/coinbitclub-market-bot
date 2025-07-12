// src/services/userService.js
import {
  pool,
  getUserByEmail,
  getUserById,
  getBinanceCredentials,
  getBybitCredentials,
  saveBinanceCredentials,
  saveBybitCredentials,
  getUserOperations,
  createPasswordResetToken,
  getPasswordResetToken,
  deletePasswordResetToken,
  createEmailConfirmationToken,
  confirmUserEmail
} from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import {
  JWT_SECRET,
  BASE_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS
} from '../config.js';

// Configura o transporte de e-mail
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

/**
 * Cadastra um novo usuário
 */
export async function registerUser({ nome, sobrenome, email, senha, telefone, pais, isTestUser = false }) {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error('Email já cadastrado');
  const hashed = await bcrypt.hash(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (nome, sobrenome, email, password_hash, telefone, pais, is_test_user, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     RETURNING id, nome, sobrenome, email, telefone, pais, created_at`,
    [nome, sobrenome, email, hashed, telefone, pais, isTestUser]
  );
  const user = rows[0];

  // Gera e envia token de confirmação de e-mail
  const emailToken = uuidv4();
  const emailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await createEmailConfirmationToken(user.id, emailToken, emailExpires);

  const confirmUrl = `${BASE_URL}/confirm-email?token=${emailToken}`;
  await transporter.sendMail({
    to: email,
    subject: 'Confirme seu cadastro',
    text: `Olá ${nome},\n\nPara confirmar seu e-mail, acesse:\n${confirmUrl}`
  });

  return user;
}

/**
 * Confirma o e-mail do usuário
 */
export async function confirmEmail(token) {
  const ok = await confirmUserEmail(token);
  if (!ok) throw new Error('Token de confirmação inválido ou expirado');
  return { success: true };
}

/**
 * Autentica o usuário e gera JWT
 */
export async function loginUser({ email, senha }) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Usuário não encontrado');
  const valid = await bcrypt.compare(senha, user.password_hash);
  if (!valid) throw new Error('Credenciais inválidas');

  // Verifica se e-mail foi confirmado
  if (user.status !== 'active') {
    throw new Error('E-mail não confirmado');
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

/**
 * Solicita redefinição de senha: gera token e envia e-mail
 */
export async function requestPasswordReset({ email }) {
  const user = await getUserByEmail(email);
  if (!user) return { success: true }; // não vaza existência

  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await createPasswordResetToken(user.id, resetToken, resetExpires);

  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    to: email,
    subject: 'Redefinição de senha',
    text: `Olá,\n\nPara redefinir sua senha, acesse:\n${resetUrl}`
  });

  return { success: true };
}

/**
 * Redefine a senha usando o token
 */
export async function resetPassword({ token, newPassword }) {
  const record = await getPasswordResetToken(token);
  if (!record || record.expires_at < new Date()) {
    throw new Error('Token inválido ou expirado');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
    [hashed, record.user_id]
  );
  await deletePasswordResetToken(token);

  return { success: true };
}

/**
 * Retorna credenciais de API já salvas
 */
export async function getUserSettings(userId) {
  const binance = await getBinanceCredentials(userId);
  const bybit  = await getBybitCredentials(userId);
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
