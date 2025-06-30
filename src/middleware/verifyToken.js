// src/middleware/verifyToken.js
import jwt from 'jsonwebtoken'

const { WEBHOOK_TOKEN, JWT_SECRET } = process.env

/**
 * Autentica Bearer JWT ou ?token= na query string
 */
export function verifyToken(req, res, next) {
  // 1) Bearer JWT
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      jwt.verify(token, JWT_SECRET)
      return next()
    } catch {
      return res.status(401).json({ error: 'JWT inválido' })
    }
  }

  // 2) ?token=
  if (req.query.token && req.query.token === WEBHOOK_TOKEN) {
    return next()
  }

  return res.status(401).json({ error: 'Unauthorized' })
}
