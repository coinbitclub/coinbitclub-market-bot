import axios from 'axios';
import crypto from 'crypto';

// Gera assinatura HMAC SHA256 para Binance
function sign(query, secret) {
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

// Cria cliente Axios para Binance
function getBinanceClient(isTestnet) {
  const baseURL = isTestnet
    ? (process.env.BINANCE_API_BASE_TEST || 'https://testnet.binance.vision')
    : (process.env.BINANCE_API_BASE    || 'https://api.binance.com');
  return axios.create({ baseURL, timeout: 10000 });
}

/**
 * Envia ordem market para Binance
 */
export async function placeBinanceOrder({ apiKey, apiSecret, isTestnet, symbol, side, qty }) {
  const ts = Date.now();
  const params = { symbol, side, type: 'MARKET', quantity: qty, timestamp: ts };
  const qs     = new URLSearchParams(params).toString();
  const sig    = sign(qs, apiSecret);

  const client = getBinanceClient(isTestnet);
  const { data } = await client.post(
    `/api/v3/order?${qs}&signature=${sig}`,
    null,
    { headers: { 'X-MBX-APIKEY': apiKey } }
  );
  if (data.status !== 'FILLED') {
    throw new Error(`Binance order error: ${data.msg || data.status}`);
  }
  return data;
}
