// src/common/auth.js
import 'dotenv/config';
import jwt from 'jsonwebtoken';

// Garante JWT_SECRET e fallback para dev
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️ JWT_SECRET não definido em env. Usando segredo padrão de desenvolvimento.');
  return 'dev-secret';
})();

/**
 * Middleware de autenticação JWT.
 * Lê token de Authorization header e popula req.user com payload.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Alias para compatibilidade com jwtMiddleware.
 */
export const jwtMiddleware = authMiddleware;

/**
 * Middleware que exige uma role específica.
 * @param {string} role
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}
