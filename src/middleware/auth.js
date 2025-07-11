// src/middleware/auth.js
import jwt from "jsonwebtoken";

// Verifica e popula req.user
export function isUser(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Token não enviado" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Alias para isUser
export const jwtMiddleware = isUser;

// (Futuro) verificação de admin
export function isAdmin(req, res, next) {
  return next();
}

export const authenticate = isUser;
