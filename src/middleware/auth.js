import jwt from 'jsonwebtoken';

const { WEBHOOK_TOKEN, WEBHOOK_JWT_SECRET } = process.env;

// Middleware para rotas protegidas por token OU JWT
export function authenticate(req, res, next) {
  // 1) Tenta autenticação via Bearer JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, WEBHOOK_JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'JWT inválido' });
    }
  }

  // 2) Tenta autenticação via ?token= na query string
  if (req.query.token && req.query.token === WEBHOOK_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}
