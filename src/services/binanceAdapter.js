// src/services/binanceAdapter.js
import axios from 'axios';
import crypto from 'crypto';

function sign(query, secret) {
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

function getBinanceClient(isTestnet) {
  const baseURL = isTestnet
    ? (process.env.BINANCE_API_BASE_TEST || 'https://testnet.binance.vision')
    : (process.env.BINANCE_API_BASE || 'https://api.binance.com');
  return axios.create({ baseURL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Envia ordem de mercado na Binance
 */
export async function placeBinanceOrder({ apiKey, apiSecret, isTestnet, symbol, side, qty }) {
  const ts = Date.now();
  const params = { symbol, side, type: 'MARKET', quantity: qty, timestamp: ts };
  const queryString = new URLSearchParams(params).toString();
  const signature = sign(queryString, apiSecret);

  const client = getBinanceClient(isTestnet);
  const { data } = await client.post(
    `/api/v3/order?${queryString}&signature=${signature}`,
    null,
    { headers: { 'X-MBX-APIKEY': apiKey } }
  );
  if (data.status !== 'FILLED') throw new Error(`Binance order error: ${data.msg || data.status}`);
  return data;
}
