// src/db/users.js
import { query } from '../db.js';

/**
 * Retorna todos os usuários cadastrados (só o ID por enquanto).
 */
export async function listUsers() {
  const res = await query('SELECT id FROM users');
  return res.rows;
}
