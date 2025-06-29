import axios from 'axios';
import crypto from 'crypto';

// Gera assinatura HMAC SHA256
function sign(query, secret) {
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

// Cria cliente axios dinâmico
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

  if (data.status !== 'FILLED') {
    throw new Error(`Binance order error: ${data.msg || data.status}`);
  }
  return data;
}

/**
 * Busca saldo do usuário
 */
export async function getBinanceBalance({ apiKey, apiSecret, isTestnet }) {
  const ts = Date.now();
  const params = { timestamp: ts };
  const queryString = new URLSearchParams(params).toString();
  const signature = sign(queryString, apiSecret);

  const client = getBinanceClient(isTestnet);

  const { data } = await client.get(
    `/api/v3/account?${queryString}&signature=${signature}`,
    { headers: { 'X-MBX-APIKEY': apiKey } }
  );
  return data;
}
