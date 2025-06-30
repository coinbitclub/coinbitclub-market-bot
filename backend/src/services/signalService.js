// src/services/signalService.js
import { pool } from '../database.js';

/**
 * Salva um novo signal recebido via webhook.
 * @param {string?} userId — opcional, caso você extraia o usuário de algum middleware
 * @param {Object} data — { ticker, price, signal_json, time }
 */
export async function saveSignal(userId, { ticker, price, signal_json, time }) {
  // Garante que a data seja válida
  let when = time ? new Date(time) : new Date();
  if (isNaN(when)) when = new Date();

  // Não permite salvar valores vazios obrigatórios
  if (!ticker) throw new Error('Ticker é obrigatório!');
  // price pode ser null, mas se vier deve ser número válido
  const _price = (price !== undefined && price !== null) ? Number(price) : null;
  // signal_json pode ser objeto ou string JSON
  const _signal_json = signal_json ? (
    typeof signal_json === 'string' ? signal_json : JSON.stringify(signal_json)
  ) : null;

  const query = `
    INSERT INTO signals
      (ticker, price, signal_json, time, user_id)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await pool.query(query, [
    ticker,
    _price,
    _signal_json,
    when,
    userId ?? null
  ]);
}
