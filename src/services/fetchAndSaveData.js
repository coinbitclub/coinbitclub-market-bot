// src/services/fetchAndSaveData.js

import { pool } from '../database.js';

/**
 * Grava um signal na tabela signals.
 * Espera body = { ticker, time, close, ... }.
 * Armazena o JSON completo em signal_json.
 */
export async function saveSignal(body) {
  const { ticker, time, close } = body;
  await pool.query(
    `INSERT INTO signals
       (signal_json, ticker, time, close, captured_at)
     VALUES
       ($1, $2, $3, $4, NOW())`,
    [JSON.stringify(body), ticker, time, close]
  );
}

/**
 * Grava dominance na tabela dominance.
 * Espera body = { timestamp, btc_dom, eth_dom }.
 */
export async function fetchAndSaveDominance(body) {
  const { timestamp, btc_dom, eth_dom } = body;
  await pool.query(
    `INSERT INTO dominance
       (timestamp, btc_dom, eth_dom, created_at)
     VALUES
       ($1, $2, $3, NOW())`,
    [timestamp, btc_dom, eth_dom]
  );
}

/**
 * Grava Fear & Greed na tabela fear_greed.
 * Espera body = { index_value, value_classification, timestamp }.
 */
export async function fetchAndSaveFearGreed(body) {
  const { index_value, value_classification, timestamp } = body;
  await pool.query(
    `INSERT INTO fear_greed
       (index_value, value_classification, timestamp, captured_at)
     VALUES
       ($1, $2, $3, NOW())`,
    [index_value, value_classification, timestamp]
  );
}

/**
 * Grava preço de mercado genérico na tabela market.
 * Espera body = { symbol, price, timestamp }.
 */
export async function fetchAndSaveMarket(body) {
  const { symbol, price, timestamp } = body;
  await pool.query(
    `INSERT INTO market
       (symbol, price, timestamp, captured_at)
     VALUES
       ($1, $2, $3, NOW())`,
    [symbol, price, timestamp]
  );
}
