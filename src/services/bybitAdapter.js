// src/services/bybitAdapter.js
import axios from 'axios';

/**
 * Envia ordem para a Bybit (testnet ou produção).
 * @param {Object} opts - { apiKey, apiSecret, symbol, qty, side, testnet }
 */
export async function placeBybitOrder({ apiKey, apiSecret, symbol, qty, side, testnet }) {
  const base = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';

  // Exemplo genérico; adapte para a API real da Bybit
  const endpoint = `${base}/v2/private/order/create`;
  const payload  = { symbol, qty, side };
  const headers  = { 'X-API-KEY': apiKey, /*…assinatura HMAC…*/ };

  const res = await axios.post(endpoint, payload, { headers });
  return res.data;
}

/**
 * Consulta status de ordem na Bybit.
 * @param {Object} opts - { apiKey, apiSecret, orderId, testnet }
 */
export async function getBybitOrderStatus({ apiKey, apiSecret, orderId, testnet }) {
  const base = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';

  const endpoint = `${base}/v2/private/order`;
  const params   = { order_id: orderId };
  const headers  = { 'X-API-KEY': apiKey, /*…assinatura HMAC…*/ };

  const res = await axios.get(endpoint, { params, headers });
  return res.data;
}
