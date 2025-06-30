import { pool } from '../database.js';

// Verifica se usuário tem assinatura ativa para operar
export async function isUserAuthorized(user_id) {
  const { rows } = await pool.query(
    `SELECT 1 FROM user_subscriptions
     WHERE user_id = $1 AND status = 'ativo'
     AND data_inicio <= NOW() AND data_fim >= NOW()`,
    [user_id]
  );
  return !!rows.length;
}
