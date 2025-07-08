// src/db/users.js
import { query } from '../db.js';

/**
 * Retorna todos os usuÃ¡rios cadastrados (sÃ³ o ID por enquanto).
 */
export async function listUsers() {
  const res = await query('SELECT id FROM users');
  return res.rows;
}




