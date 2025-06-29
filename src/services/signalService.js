// src/services/signalService.js
import { pool } from '../database.js';
import logger from '../utils/logger.js';

/**
 * Salva um sinal recebido no padrão da tabela signals.
 * Compatível com sinais vindos do TradingView, CoinStats, painel, etc.
 * @param {Object} params - { ticker/symbol, price, signal_json, time, user_id, side, ... }
 */
export async function saveSignal(params) {
  const ticker = params.ticker || params.symbol;
  const price = Number(params.price);
  const signal_json = params.signal_json || params;
  const time = params.time || params.timestamp || new Date();

  if (!ticker || typeof price !== 'number' || isNaN(price) || !signal_json || !time) {
    logger.warn('Sinal inválido:', params);
    throw new Error('Campos obrigatórios ausentes ou inválidos: ticker, price, signal_json, time');
  }

  const _signal_json = typeof signal_json === 'string'
    ? signal_json
    : JSON.stringify(signal_json);
  const _time = typeof time === 'string' || typeof time === 'number'
    ? new Date(time)
    : time;

  if (!_time || isNaN(new Date(_time))) {
    throw new Error('Campo time inválido ou ausente');
  }

  try {
    await pool.query(
      `INSERT INTO signals (ticker, price, signal_json, time, captured_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [ticker, price, _signal_json, _time]
    );
    logger.info(`[SIGNAL] Sinal salvo: ${ticker} | ${price} | ${_time}`);
  } catch (err) {
    logger.error('Erro ao salvar sinal:', err);
    throw err;
  }
}

/**
 * Busca os últimos sinais recebidos.
 * @param {number} limit - Número máximo de sinais a retornar (padrão 10)
 */
export async function fetchRecentSignals(limit = 10) {
  const lim = Math.max(1, parseInt(limit, 10) || 10);
  try {
    const { rows } = await pool.query(
      `SELECT * FROM signals ORDER BY captured_at DESC LIMIT $1`,
      [lim]
    );
    return rows;
  } catch (err) {
    logger.error('Erro ao buscar sinais recentes:', err);
    throw err;
  }
}
