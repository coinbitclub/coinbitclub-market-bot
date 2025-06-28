import { pool } from '../database.js';

/**
 * Salva um sinal recebido no padrÃ£o da tabela signals.
 * @param {Object} params - { ticker, price, signal_json, time }
 */
export async function saveSignal({ ticker, price, signal_json, time }) {
  if (!ticker || typeof price === 'undefined' || !signal_json || !time) {
    throw new Error('Campos obrigatÃ³rios: ticker, price, signal_json, time');
  }

  // Protege tipo dos dados antes de inserir
  const _price = Number(price);
  const _signal_json = typeof signal_json === 'string' ? signal_json : JSON.stringify(signal_json);
  const _time = typeof time === 'string' || typeof time === 'number'
    ? new Date(time)
    : time;

  if (!_time || isNaN(new Date(_time))) {
    throw new Error('Campo time invÃ¡lido ou ausente');
  }

  await pool.query(
    `INSERT INTO signals (ticker, price, signal_json, time, captured_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [ticker, _price, _signal_json, _time]
  );
}

/**
 * Busca os Ãºltimos sinais recebidos.
 */
export async function fetchRecentSignals(limit = 10) {
  const lim = Math.max(1, parseInt(limit, 10) || 10);
  const { rows } = await pool.query(
    `SELECT * FROM signals ORDER BY captured_at DESC LIMIT $1`,
    [lim]
  );
  return rows;
}




