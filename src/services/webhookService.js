// src/services/webhookService.js
import { pool } from '../database.js';

/**
 * Salva sinal bruto e sinal processado em duas tabelas
 */
export async function logSignal(req, res) {
  const { symbol, price, side, timestamp, userId } = req.body;
  const receivedAt = timestamp || new Date().toISOString();

  // 1) Insere em signals e obtém o ID
  const { rows: [signal] } = await pool.query(
    `INSERT INTO signals (ticker, price, side, received_at, user_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [symbol, price, side, receivedAt, userId || null]
  );

  // 2) Armazena payload cru
  await pool.query(
    `INSERT INTO webhook_signal (signal_id, payload, received_at)
     VALUES ($1,$2,$3)`,
    [signal.id, req.body, receivedAt]
  );

  res.json({ received: true });
}

/**
 * Salva dominância bruta e processada em duas tabelas
 */
export async function logDominance(req, res) {
  const { btc_dom, eth_dom, timestamp } = req.body;
  const receivedAt = timestamp || new Date().toISOString();

  // 1) Insere em dominance e obtém o ID
  const { rows: [dom] } = await pool.query(
    `INSERT INTO dominance (btc_dom, eth_dom, timestamp)
     VALUES ($1,$2,$3) RETURNING id`,
    [btc_dom, eth_dom, receivedAt]
  );

  // 2) Armazena payload cru
  await pool.query(
    `INSERT INTO webhook_dominance (dominance_id, payload, received_at)
     VALUES ($1,$2,$3)`,
    [dom.id, req.body, receivedAt]
  );

  res.json({ received: true });
}
