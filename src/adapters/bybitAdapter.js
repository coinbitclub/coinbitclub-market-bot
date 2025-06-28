// src/services/bybitAdapter.js
import axios from 'axios';
import crypto from 'crypto';

const API_KEY     = process.env.BYBIT_API_KEY;
const API_SECRET  = process.env.BYBIT_API_SECRET;
const IS_TESTNET  = process.env.BYBIT_TESTNET === 'true';
const BASE_URL    = IS_TESTNET
  ? (process.env.BYBIT_BASE_URL_TEST   || 'https://api-testnet.bybit.com')
  : (process.env.BYBIT_BASE_URL_REAL   || 'https://api.bybit.com');

// Axios instance com baseURL e timeout padrÃ£o
const bybitClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Gera assinatura HMAC-SHA256 para chamadas Ã  API Bybit
 * @param {Object} params 
 * @returns {string}
 */
function sign(params) {
  const ordered = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHmac('sha256', API_SECRET)
    .update(ordered)
    .digest('hex');
}

/**
 * Executa ordem de mercado na Bybit
 * @param {{ symbol:string, side:'Buy'|'Sell', qty:number, tp?:number, sl?:number }} opts
 * @returns {Promise<Object>} resposta da API
 */
export async function placeOrder({ symbol, side, qty, tp, sl }) {
  // Se estiver em testnet, simula e nÃ£o envia de fato
  if (IS_TESTNET) {
    console.log('[BybitAdapter] TESTNET mode - ordem simulada:', { symbol, side, qty, tp, sl });
    return { test: true };
  }

  const timestamp = Date.now();
  const params = {
    api_key:       API_KEY,
    symbol,
    side,
    order_type:    'Market',
    qty,
    time_in_force:'GoodTillCancel',
    timestamp,
    recv_window:   5000
  };

  if (tp !== undefined) params.take_profit = tp;
  if (sl !== undefined) params.stop_loss   = sl;

  params.sign = sign(params);

  const { data } = await bybitClient.post(
    '/private/linear/order/create',
    null,
    { params }
  );

  if (data.ret_code !== 0) {
    throw new Error(`Bybit placeOrder error: ${data.ret_msg}`);
  }

  return data.result;
}

/**
 * Fecha posiÃ§Ã£o existente com ordem oposta de mercado
 * @param {{ symbol:string, side:'Buy'|'Sell', qty:number, tp?:number, sl?:number }} opts
 * @returns {Promise<Object>}
 */
export async function closePosition({ symbol, side, qty, tp, sl }) {
  const closeSide = side === 'Buy' ? 'Sell' : 'Buy';
  return placeOrder({ symbol, side: closeSide, qty, tp, sl });
}

// Exporta o cliente direto caso precise de outros endpoints
export { bybitClient };




