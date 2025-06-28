// src/services/bybitService.js
import axios from 'axios';
import crypto from 'crypto';

const API_KEY        = process.env.BYBIT_API_KEY;
const API_SECRET     = process.env.BYBIT_API_SECRET;
const IS_TESTNET     = process.env.BYBIT_TESTNET === 'true';
const BASE_URL       = IS_TESTNET
  ? process.env.BYBIT_BASE_URL_TEST    // ex: https://api-testnet.bybit.com
  : process.env.BYBIT_BASE_URL_REAL    // ex: https://api.bybit.com
  || 'https://api.bybit.com';

/**
 * Gera assinatura HMAC-SHA256 para parÃ¢metros de query
 */
function signParams(params) {
  const ordered = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHmac('sha256', API_SECRET).update(ordered).digest('hex');
}

/**
 * Wrapper para chamadas Ã  API Bybit (v5)
 */
async function requestV5({ endpoint, method = 'GET', params = {}, data = {} }) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {};

  // AutenticaÃ§Ã£o de endpoints privados
  if (endpoint.startsWith('/private') || endpoint.startsWith('/v5/order')) {
    const timestamp = Date.now();
    const q = { api_key: API_KEY, timestamp, ...params };
    q.sign = signParams(q);
    params = q;
  }

  try {
    const response = await axios({
      url,
      method,
      baseURL: BASE_URL,
      headers,
      params,
      data,
      timeout: 10000
    });
    if (response.data.ret_code && response.data.ret_code !== 0) {
      throw new Error(response.data.ret_msg || 'Bybit API error');
    }
    return response.data.result ?? response.data;
  } catch (err) {
    console.error(`[BybitService] Error ${method} ${endpoint}:`, err.message);
    throw err;
  }
}

/**
 * Envia ordem de mercado na Bybit (v2 private endpoint)
 */
export async function placeMarketOrder({ symbol, side, qty, leverage }) {
  if (IS_TESTNET) {
    console.log('[BybitService] TEST MODE: order skipped', { symbol, side, qty, leverage });
    return { order_id: 'TEST_ORDER_ID', test: true };
  }

  return requestV5({
    endpoint: '/v2/private/order/create',
    method: 'POST',
    params: {
      symbol,
      side,
      order_type: 'Market',
      qty,
      time_in_force: 'PostOnly',
      leverage
    }
  });
}

/**
 * Fecha posiÃ§Ã£o existente enviando ordem oposta
 */
export async function closePosition({ symbol, side, qty, leverage }) {
  const closeSide = side === 'Buy' ? 'Sell' : 'Buy';
  return placeMarketOrder({ symbol, side: closeSide, qty, leverage });
}

// Exporta a funÃ§Ã£o genÃ©rica de request caso precise de outros endpoints
export { requestV5 as bybitRequest };
