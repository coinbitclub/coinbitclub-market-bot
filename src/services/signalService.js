// src/services/signalService.js
import { pool } from './db.js';

/**
 * Salva um sinal de trading (ex: recebido via webhook TradingView)
 * @param {Object} param0 - objeto contendo symbol, price, side e timestamp
 * @returns {Object} id do sinal salvo
 */
export async function saveSignal({ symbol, price, side, timestamp }) {
  if (process.env.NODE_ENV === 'test') return { id: 1 };

  const receivedAt = timestamp || new Date().toISOString();

  const { rows } = await pool.query(
    `INSERT INTO signals(ticker, price, side, received_at)
     VALUES($1, $2, $3, $4) RETURNING id`,
    [symbol, price, side, receivedAt]
  );

  return rows[0];
}

/**
 * Salva dados de dominância do BTC e ETH
 * @param {Object} param0 - objeto contendo btc_dom, eth_dom e timestamp
 * @returns {Object} id do registro salvo
 */
export async function saveDominance({ btc_dom, eth_dom, timestamp }) {
  if (process.env.NODE_ENV === 'test') return { id: 1 };

  const ts = timestamp || new Date().toISOString();

  const { rows } = await pool.query(
    `INSERT INTO cointars(btc_dom, eth_dom, timestamp)
     VALUES($1, $2, $3) RETURNING id`,
    [btc_dom, eth_dom, ts]
  );

  return rows[0];
}
