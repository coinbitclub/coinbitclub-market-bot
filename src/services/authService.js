// src/services/authService.js
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import {
  JWT_SECRET,
  JWT_EXPIRATION,
  REFRESH_TOKEN_SECRET,
  BASE_URL,        // ex: https://app.yoursite.com
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS
} from '../config.js';

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

export const registerUser = async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 8);
  const { rows } = await pool.query(
    'INSERT INTO users(nome, sobrenome, email, password) VALUES($1,$2,$3,$4) RETURNING id',
    [nome, sobrenome, email, hash]
  );
  const userId = rows[0].id;
  // create user_settings
  await pool.query(
    'INSERT INTO user_settings(user_id) VALUES($1)',
    [userId]
  );
  // email confirmation
  const token = uuidv4();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO email_confirmations(token, user_id, expires_at) VALUES($1,$2,$3)',
    [token, userId, expires]
  );
  const url = `${BASE_URL}/confirm-email?token=${token}`;
  await transporter.sendMail({
    to: email,
    subject: 'Confirme seu cadastro',
    text: `Clique no link para confirmar seu e-mail: ${url}`
  });
  res.status(201).json({ userId });
};

export const confirmEmail = async (req, res) => {
  const { token } = req.body;
  const { rows } = await pool.query(
    'SELECT user_id, expires_at FROM email_confirmations WHERE token=$1',
    [token]
  );
  if (!rows.length || rows[0].expires_at < new Date()) {
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
  const userId = rows[0].user_id;
  await pool.query(
    'UPDATE users SET status=\'active\' WHERE id=$1',
    [userId]
  );
  await pool.query(
    'DELETE FROM email_confirmations WHERE token=$1',
    [token]
  );
  res.json({ success: true });
};

export const loginUser = async (req, res) => {
  const { email, senha } = req.body;
  const { rows } = await pool.query(
    'SELECT id, password, status FROM users WHERE email=$1',
    [email]
  );
  if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });
  const user = rows[0];
  if (user.status !== 'active') return res.status(403).json({ error: 'E-mail não confirmado' });
  const match = await bcrypt.compare(senha, user.password);
  if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });
  const payload = { id: user.id };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  res.json({ accessToken, refreshToken });
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const newToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    res.json({ accessToken: newToken });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
};

export const resetPassword = async (req, res) => {
  const { email } = req.body;
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE email=$1',
    [email]
  );
  if (!rows.length) return res.json({ success: true });
  const userId = rows[0].id;
  const token = uuidv4();
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO password_resets(token, user_id, expires_at) VALUES($1,$2,$3)',
    [token, userId, expires]
  );
  const url = `${BASE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    to: email,
    subject: 'Redefinição de senha',
    text: `Use este link para redefinir sua senha: ${url}`
  });
  res.json({ success: true });
};

export const confirmReset = async (req, res) => {
  const { token, newPassword } = req.body;
  const { rows } = await pool.query(
    'SELECT user_id, expires_at FROM password_resets WHERE token=$1',
    [token]
  );
  if (!rows.length || rows[0].expires_at < new Date()) {
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
  const userId = rows[0].user_id;
  const hash = await bcrypt.hash(newPassword, 8);
  await pool.query(
    'UPDATE users SET password=$1 WHERE id=$2',
    [hash, userId]
  );
  await pool.query(
    'DELETE FROM password_resets WHERE token=$1',
    [token]
  );
  res.json({ success: true });
};
