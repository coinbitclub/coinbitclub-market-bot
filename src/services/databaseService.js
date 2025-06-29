// src/services/databaseService.js
import { pool } from '../database.js';

/**
 * Consulta genérica ao banco de dados.
 * @param {string} text - Consulta SQL.
 * @param {Array} params - Parâmetros da consulta.
 * @returns {Promise<QueryResult>} resultado da consulta.
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Insere um sinal na tabela 'signals'.
 * @param {Object} signal - { ticker, price, time, signal_json }
 * @returns {Promise<Object>} sinal inserido.
 */
export async function insertSignal({ ticker, price, time, signal_json }) {
  const queryText = `
    INSERT INTO signals (ticker, price, time, signal_json)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [ticker, price, time, JSON.stringify(signal_json)];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

/**
 * Insere um registro de dominância de mercado.
 * @param {Object} data - { btc_dom, eth_dom }
 * @returns {Promise<Object>} registro inserido.
 */
export async function insertDominance({ btc_dom, eth_dom }) {
  const queryText = `
    INSERT INTO btc_dominance (btc_dom, eth_dom)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [btc_dom, eth_dom];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

/**
 * Insere um registro de Fear & Greed.
 * @param {Object} data - { value, index_value, value_classification }
 * @returns {Promise<Object>} registro inserido.
 */
export async function insertFearGreed({ value, index_value, value_classification }) {
  const queryText = `
    INSERT INTO fear_greed (value, index_value, value_classification)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [value, index_value, value_classification];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

/**
 * Insere um registro de preço de mercado.
 * @param {Object} data - { symbol, price, timestamp }
 * @returns {Promise<Object>} registro inserido.
 */
export async function insertMarket({ symbol, price, timestamp }) {
  const queryText = `
    INSERT INTO market (symbol, price, "timestamp")
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [symbol, price, timestamp];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

/**
 * Busca credenciais da API Bybit para um usuário.
 * @param {string} user_id - ID do usuário.
 * @param {boolean} is_testnet - indica se é testnet.
 * @returns {Promise<Object|null>} credenciais ou null.
 */
export async function getBybitCredentials(user_id, is_testnet = false) {
  const queryText = `
    SELECT api_key, api_secret
    FROM bybit_credentials
    WHERE user_id = $1 AND is_testnet = $2
    LIMIT 1;
  `;
  const { rows } = await pool.query(queryText, [user_id, is_testnet]);
  return rows[0] || null;
}