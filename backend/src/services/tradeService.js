import { pool } from "../database.js";

// Funções de trade: consultar, salvar operação, etc. (personalize conforme seu fluxo)

// Exemplo: Salva operação de trade
export async function saveTrade({ user_id, symbol, side, qty, entry_price, exit_price, pnl, status }) {
  await pool.query(
    `INSERT INTO trades (user_id, ticker, side, entry_price, exit_price, profit, status, executed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [user_id, symbol, side, entry_price, exit_price, pnl, status]
  );
  return { ok: true };
}

// Consultar trades do usuário
export async function getUserTrades(userId, limit = 30) {
  const { rows } = await pool.query(
    "SELECT * FROM trades WHERE user_id=$1 ORDER BY executed_at DESC LIMIT $2", [userId, limit]
  );
  return rows;
}
