// src/services/bybitAdapter.js
import axios from 'axios';
import crypto from 'crypto';

/**
 * Gera assinatura HMAC-SHA256 para chamadas à API Bybit
 */
function sign(params, apiSecret) {
  const ordered = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHmac('sha256', apiSecret)
    .update(ordered)
    .digest('hex');
}

/**
 * Cria cliente axios para o usuário e ambiente certo
 */
function getBybitClient(isTestnet) {
  const baseURL = isTestnet
    ? (process.env.BYBIT_BASE_URL_TEST || 'https://api-testnet.bybit.com')
    : (process.env.BYBIT_BASE_URL_REAL || 'https://api.bybit.com');
  return axios.create({ baseURL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Executa ordem de mercado na Bybit
 */
export async function placeBybitOrder({ apiKey, apiSecret, isTestnet, symbol, side, qty, tp, sl }) {
  const timestamp = Date.now();
  const params = {
    api_key: apiKey,
    symbol,
    side,
    order_type: 'Market',
    qty,
    time_in_force: 'GoodTillCancel',
    timestamp,
    recv_window: 5000
  };
  if (tp !== undefined) params.take_profit = tp;
  if (sl !== undefined) params.stop_loss   = sl;
  params.sign = sign(params, apiSecret);

  const client = getBybitClient(isTestnet);

  const { data } = await client.post(
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
 * Fecha posição existente com ordem oposta de mercado
 */
export async function closeBybitPosition(opts) {
  const closeSide = opts.side === 'Buy' ? 'Sell' : 'Buy';
  return placeBybitOrder({ ...opts, side: closeSide });
}
