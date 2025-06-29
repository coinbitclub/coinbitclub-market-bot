// src/services/signalService.js
import { pool } from '../database.js';

/**
 * Salva um novo signal recebido via webhook.
 * @param {string?} userId — opcional, caso você extraia o usuário de algum middleware
 * @param {Object} data — { ticker, price, signal_json, time }
 */
export async function saveSignal(userId, { ticker, price, signal_json, time }) {
  const q = `
    INSERT INTO signals
      (ticker, price, signal_json, time, user_id)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const when = time ? new Date(time) : new Date();
  await pool.query(q, [
    ticker,
    price,
    signal_json,
    when,
    userId ?? null
  ]);
}
