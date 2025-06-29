// src/middleware/auth.js
import jwt from 'jsonwebtoken';

const { WEBHOOK_TOKEN, WEBHOOK_JWT_SECRET } = process.env;

/**
 * Autentica via Bearer JWT ou ?token= na query string
 */
export function verifyToken(req, res, next) {
  // 1) Tenta Bearer JWT
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, WEBHOOK_JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'JWT inválido' });
    }
  }

  // 2) Fallback para ?token=
  if (req.query.token && req.query.token === WEBHOOK_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}
