import jwt from 'jsonwebtoken';
import { pool } from './dbMigrations.js';

export function generateTokens(payload) {
  const access = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { access, refresh };
}

export async function revokeToken(token) {
  await pool.query('INSERT INTO revoked_tokens(token) VALUES($1)', [token]);
}

export async function isRevoked(token) {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM revoked_tokens WHERE token=$1',
    [token]
  );
  return rowCount > 0;
}
