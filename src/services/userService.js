import { query } from './databaseService.js';

/**
 * Busca usuário pelo email
 * @param {string} email
 * @returns {Promise<Object>}
 */
export async function getUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email =  LIMIT 1';
  const result = await query(sql, [email]);
  return result.rows[0];
}
