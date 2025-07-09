// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { pool } from '../database.js';

const { WEBHOOK_TOKEN, JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.error('❌ ERRO: variável JWT_SECRET não definida.');
  process.exit(1);
}

/**
 * Middleware de autenticação JWT ou token de webhook
 */
export function jwtMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");

  // 1) Verifica JWT
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }
  }

  // 2) Verifica token de webhook na query
  if (req.query.token && req.query.token === WEBHOOK_TOKEN) {
    return next();
  }

  // 3) Negado
  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * Apenas usuário autenticado (Bearer JWT)
 */
export function isUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'JWT inválido' });
  }
}

/**
 * Verifica role=admin no payload ou no banco
 */
export async function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const token = authHeader.slice(7).trim();
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'JWT inválido' });
  }

  // DEV: lista temporária de admins
  const adminsTest = [14, 1];
  const emailsTest = ['erica.andrade.santos@hotmail.com'];
  if (adminsTest.includes(payload.id) || emailsTest.includes(payload.email)) {
    req.admin = payload;
    return next();
  }

  // PRODUÇÃO: verifica role no banco
  try {
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [payload.id]);
    if (rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito ao admin' });
    }
    req.admin = payload;
    return next();
  } catch (err) {
    console.error('❌ ERRO no isAdmin:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

export const authenticate = isUser;
