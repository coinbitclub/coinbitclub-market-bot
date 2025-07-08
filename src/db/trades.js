// src/db/trades.js
import { query } from '../db.js';

/**
 * Conta quantas trades abertas um usuÃ¡rio possui.
 */
export async function countOpenTrades(userId) {
  const rows = await query(
    `SELECT COUNT(*) AS count
       FROM trades
      WHERE user_id = $1
        AND status  = 'open'`,
    [userId]
  );
  return parseInt(rows[0].count, 10);
}

/**
 * Registra uma nova trade como aberta, incluindo TP e SL.
 */
export async function recordTrade({ userId, orderId, symbol, side, qty, entryPrice, tp, sl, tpPercent, slPercent }) {
  await query(
    `INSERT INTO trades
      (user_id, order_id, symbol, side, qty, entry_price, tp, sl, tp_percent, sl_percent, status, opened_at)
     VALUES
      ($1,     $2,       $3,     $4,   $5,  $6,          $7, $8, $9,         $10,        'open', NOW())`,
    [userId, orderId, symbol, side, qty, entryPrice, tp, sl, tpPercent, slPercent]
  );
}

/**
 * Fecha uma trade existente, marcando status, preÃ§o de saÃ­da e motivo.
 */
export async function closeTrade(orderId, exitPrice, exitReason) {
  await query(
    `UPDATE trades
       SET status      = 'closed',
           exit_price  = $2,
           exit_reason = $3,
           closed_at   = NOW()
     WHERE order_id   = $1`,
    [orderId, exitPrice, exitReason]
  );
}

/**
 * Retorna todas as trades abertas de um usuÃ¡rio.
 */
export async function getOpenTrades(userId) {
  return await query(
    `SELECT * FROM trades
      WHERE user_id = $1
        AND status  = 'open'
   ORDER BY opened_at DESC`,
    [userId]
  );
}

/**
 * Retorna todas as trades fechadas de um usuÃ¡rio.
 */
export async function getClosedTrades(userId) {
  return await query(
    `SELECT * FROM trades
      WHERE user_id = $1
        AND status  = 'closed'
   ORDER BY closed_at DESC`,
    [userId]
  );
}

/**
 * Retorna todas as trades de um usuÃ¡rio (abertas + fechadas).
 */
export async function getAllTrades(userId) {
  return await query(
    `SELECT * FROM trades
      WHERE user_id = $1
   ORDER BY opened_at DESC`,
    [userId]
  );
}




