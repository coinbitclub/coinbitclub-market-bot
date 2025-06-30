import jwt from 'jsonwebtoken';
import { pool } from '../database.js';

const { WEBHOOK_TOKEN, JWT_SECRET } = process.env;

/**
 * Autentica via Bearer JWT ou ?token= na query string (para webhooks)
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'JWT inválido' });
    }
  }
  if (req.query.token && req.query.token === WEBHOOK_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Autenticação JWT padrão para usuários logados
 */
export function isUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET || 'segredo123');
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ error: 'JWT inválido' });
    }
  }
  return res.status(401).json({ error: 'Não autenticado' });
}

/**
 * Autenticação de admin (precisa role=admin no banco)
 * Com lista fixa temporária para facilitar testes
 */
export async function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET || 'segredo123');

      // -------- LIBERAÇÃO TEMPORÁRIA PARA TESTES -----------
      const adminsTest = [14, 1]; // IDs liberados
      const emailsTest = ['erica.andrade.santos@hotmail.com'];
      if (adminsTest.includes(payload.id) || emailsTest.includes(payload.email)) {
        req.admin = payload;
        return next();
      }
      // -------- FIM DA LIBERAÇÃO TEMPORÁRIA ---------------

      // Validação padrão: role=admin no banco
      const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [payload.id]);
      if (rows[0]?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito ao admin' });
      }
      req.admin = payload;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'JWT inválido' });
    }
  }
  return res.status(401).json({ error: 'Não autenticado' });
}
