// src/controllers/authController.js
import { createUser, getUserByEmail } from '../services/userService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function genTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    nome: user.nome || null
  };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
  return { access: accessToken, refresh: refreshToken };
}

export async function register(req, res) {
  const { name, email, password, referred_by } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  if (await getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, passwordHash: hashedPassword, referredBy: referred_by });
  res.status(201).json(user);
}

export async function login(req, res) {
  console.log('[LOGIN] req.body:', req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = await getUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  res.json(genTokens(user));
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Sem refresh token' });

  try {
    const data = jwt.verify(refreshToken, process.env.JWT_SECRET);
    res.json(genTokens(data));
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
}
