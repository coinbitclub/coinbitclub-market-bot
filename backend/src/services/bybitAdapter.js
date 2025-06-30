// src/services/bybitAdapter.js
import axios from 'axios';
import crypto from 'crypto';

// Gera assinatura HMAC SHA256 para Bybit
function signBybit(params, secret) {
  const ordered = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', secret).update(ordered).digest('hex');
}

const BYBIT_BASE = {
  prod: 'https://api.bybit.com',
  test: 'https://api-testnet.bybit.com'
};

/**
 * Envia ordem para Bybit (market order)
 */
export async function placeBybitOrder({ apiKey, apiSecret, symbol, side, qty, isTestnet }) {
  const baseURL = isTestnet ? BYBIT_BASE.test : BYBIT_BASE.prod;
  const timestamp = Date.now();
  const params = {
    symbol,
    side,
    order_type: 'Market',
    qty,
    time_in_force: 'GoodTillCancel',
    timestamp
  };
  const signature = signBybit(params, apiSecret);
  const payload = { ...params, api_key: apiKey, sign: signature };

  const { data } = await axios.post(
    `${baseURL}/spot/v3/private/order`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (data.ret_code !== 0) throw new Error(`Bybit order error: ${data.ret_msg}`);
  return data.result;
}
