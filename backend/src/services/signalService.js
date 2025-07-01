import { pool } from "../database.js";

// Salva sinal recebido
export async function saveSignal({ ticker, price, signal_json, time, user_id }) {
  if (!ticker || price === undefined || !signal_json || !time)
    throw new Error("Campos obrigatórios: ticker, price, signal_json, time");
  const _price = Number(price);
  const _signal_json = typeof signal_json === "string" ? signal_json : JSON.stringify(signal_json);
  const _user_id = user_id || null;
  const { rows } = await pool.query(
    `INSERT INTO signals (ticker, price, signal_json, time, user_id, captured_at, processed, created_at)
     VALUES ($1,$2,$3,$4,$5,NOW(),FALSE,NOW())
     RETURNING *`,
    [ticker, _price, _signal_json, time, _user_id]
  );
  return rows[0];
}

// Salva dados de dominância recebidos via webhook
export async function saveDominance({ btc_dom, eth_dom, captured_at }) {
  const { rows } = await pool.query(
    `INSERT INTO btc_dominance (btc_dom, eth_dom, captured_at)
     VALUES ($1,$2,$3) RETURNING *`,
    [btc_dom, eth_dom, captured_at || new Date()]
  );
  return rows[0];
}

// Lista sinais recentes
export async function getRecentSignals() {
  const { rows } = await pool.query(
    "SELECT * FROM signals ORDER BY captured_at DESC LIMIT 20"
  );
  return rows;
}

// Lista indicadores recentes
export async function getRecentIndicators() {
  const { rows } = await pool.query(
    "SELECT * FROM indicators ORDER BY created_at DESC LIMIT 10"
  );
  return rows;
}
