import { query } from './databaseService.js';

/**
 * Grava um signal na tabela signals
 */
export async function saveSignal(body) {
  const { ticker, time, close } = body;
  await query(
    `INSERT INTO signals (signal_json, ticker, time, close)
     VALUES ($1, $2, $3, $4)`,
    [body, ticker, time, close]
  );
}

/**
 * Grava dominance na tabela dominance
 */
export async function fetchAndSaveDominance(body) {
  const { timestamp, btc_dom, eth_dom } = body;
  await query(
    `INSERT INTO dominance (timestamp, btc_dom, eth_dom)
     VALUES ($1, $2, $3)`,
    [timestamp, btc_dom, eth_dom]
  );
}

/**
 * Grava Fear & Greed na tabela fear_greed
 */
export async function fetchAndSaveFearGreed(body) {
  const { index_value, value_classification, timestamp } = body;
  await query(
    `INSERT INTO fear_greed (index_value, value_classification, timestamp)
     VALUES ($1, $2, $3)`,
    [index_value, value_classification, timestamp]
  );
}

/**
 * Grava preço de mercado na tabela market
 */
export async function fetchAndSaveMarket(body) {
  const { symbol, price, timestamp } = body;
  await query(
    `INSERT INTO market (symbol, price, timestamp)
     VALUES ($1, $2, $3)`,
    [symbol, price, timestamp]
  );
}
