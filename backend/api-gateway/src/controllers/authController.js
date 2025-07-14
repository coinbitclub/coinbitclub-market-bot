import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../../common/db.js';
import { sendResetEmail } from '../services/emailService.js';
import { validate, authSchema } from '../../../common/validation.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function register(req, res) {
  let data;
  try {
    data = validate(authSchema, req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const { email, password, name } = data;
  const hash = await bcrypt.hash(password, 10);
  const [user] = await db('users').insert({ email, password_hash: hash, name }).returning('*');
  res.status(201).json({ id: user.id, email: user.email });
}

export async function login(req, res) {
  let data;
  try {
    data = validate(authSchema, req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const { email, password } = data;
  const user = await db('users').where({ email }).first();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
}

export async function refresh(req, res) {
  try {
    const { token } = req.body;
    const payload = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken, refreshToken });
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

export async function resetPassword(req, res) {
  await sendResetEmail(req.body.email);
  res.json({ sent: true });
}

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/reset-password', resetPassword);

export default router;
