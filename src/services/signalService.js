import { pool } from '../database.js';

/**
 * Salva um sinal recebido no padrão da tabela signals
 * @param {Object} params - { ticker, price, signal_json, time }
 */
export async function saveSignal({ ticker, price, signal_json, time }) {
  await pool.query(
    `INSERT INTO signals (ticker, price, signal_json, time)
     VALUES ($1, $2, $3, $4)`,
    [ticker, price, signal_json, time]
  );
}

/**
 * Busca os últimos sinais recebidos
 */
export async function fetchRecentSignals(limit = 10) {
  const { rows } = await pool.query(
    `SELECT * FROM signals ORDER BY captured_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}
