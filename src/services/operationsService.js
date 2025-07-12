// src/services/operationsService.js
import { pool } from './database.js';

/**
 * Persiste uma operação (histórico manual do usuário)
 */
export async function saveOperation({
  user_id,
  exchange,
  operation_type,
  symbol,
  order_id,
  qty,
  price,
  leverage,
  pnl,
  status,
  opened_at,
  closed_at
}) {
  const { rows } = await pool.query(
    `INSERT INTO operations
      (user_id, exchange, operation_type, symbol, order_id, qty, price, leverage, pnl, status, opened_at, closed_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [user_id, exchange, operation_type, symbol, order_id, qty, price, leverage, pnl, status, opened_at, closed_at]
  );
  return rows[0];
}

/**
 * Busca todas operações de um usuário
 */
export async function getOperationsByUser(user_id) {
  const { rows } = await pool.query(
    `SELECT * FROM operations WHERE user_id = $1 ORDER BY opened_at DESC`,
    [user_id]
  );
  return rows;
}

/**
 * Inicia o bot para um usuário
 */
export async function startBot(user_id) {
  await pool.query(
    `UPDATE users SET status = 'running' WHERE id = $1`,
    [user_id]
  );
  return { ok: true, status: 'running' };
}

/**
 * Para o bot para um usuário
 */
export async function stopBot(user_id) {
  await pool.query(
    `UPDATE users SET status = 'stopped' WHERE id = $1`,
    [user_id]
  );
  return { ok: true, status: 'stopped' };
}

/**
 * Retorna o status atual do bot do usuário
 */
export async function getBotStatus(user_id) {
  const { rows } = await pool.query(
    `SELECT status FROM users WHERE id = $1`,
    [user_id]
  );
  return { status: rows[0]?.status || null };
}
