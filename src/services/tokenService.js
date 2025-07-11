// src/services/tokenService.js
import jwt from "jsonwebtoken";

/**
 * Revoga um refresh token (stub para não quebrar import em auth.js)
 */
export function revokeToken(token) {
  // Aqui você pode implementar blacklist em DB, se quiser.
  return;
}

/**
 * Indica se um token foi revogado (no teste sempre libera)
 */
export async function isRevoked(token) {
  return false;
}

/**
 * Gera par de tokens JWT (access + refresh)
 */
export function generateTokens(user) {
  const access  = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const refresh = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { access, refresh };
}
