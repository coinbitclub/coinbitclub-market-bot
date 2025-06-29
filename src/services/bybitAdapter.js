import axios from 'axios';
import crypto from 'crypto';

// Gera assinatura HMAC SHA256 para Bybit
function signBybit(params, secret) {
  const ordered = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(ordered).digest('hex');
}

const BASE = {
  prod: 'https://api.bybit.com',
  test: 'https://api-testnet.bybit.com'
};

/**
 * Envia ordem market para Bybit
 */
export async function placeBybitOrder({ apiKey, apiSecret, symbol, side, qty, isTestnet }) {
  const baseURL   = isTestnet ? BASE.test : BASE.prod;
  const timestamp = Date.now();
  const params = {
    api_key:       apiKey,
    symbol,
    side,
    order_type:    'Market',
    qty,
    time_in_force:'GoodTillCancel',
    timestamp
  };
  params.sign = signBybit(params, apiSecret);

  const { data } = await axios.post(
    `${baseURL}/spot/v3/private/order`,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (data.ret_code !== 0) {
    throw new Error(`Bybit order error: ${data.ret_msg}`);
  }
  return data.result;
}
