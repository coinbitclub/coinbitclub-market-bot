import axios from 'axios';
import crypto from 'crypto';

// Base por ambiente
const BASES = {
  prod: process.env.BINANCE_API_BASE || 'https://api.binance.com',
  test: process.env.BINANCE_API_BASE_TEST || 'https://testnet.binance.vision'
};

// Assinatura de requisições privadas
function sign(query, secret) {
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

// Função universal de request
async function binanceRequest({ method, path, params, apiKey, apiSecret, testnet = false }) {
  const ts = Date.now();
  const query = new URLSearchParams({ ...params, timestamp: ts }).toString();
  const signature = sign(query, apiSecret);
  const url = `${testnet ? BASES.test : BASES.prod}${path}?${query}&signature=${signature}`;

  return axios({
    method,
    url,
    headers: { 'X-MBX-APIKEY': apiKey }
  }).then(r => r.data);
}

// 1. Enviar ordem de mercado
export async function placeBinanceOrder({ apiKey, apiSecret, symbol, side = 'BUY', qty, testnet = false }) {
  return binanceRequest({
    method: 'POST',
    path: '/api/v3/order',
    params: { symbol, side, type: 'MARKET', quantity: qty },
    apiKey, apiSecret, testnet
  });
}

// 2. Buscar saldo
export async function getBinanceBalance({ apiKey, apiSecret, testnet = false }) {
  return binanceRequest({
    method: 'GET',
    path: '/api/v3/account',
    params: {},
    apiKey, apiSecret, testnet
  });
}

// 3. Buscar histórico de ordens
export async function getBinanceOrderHistory({ apiKey, apiSecret, symbol, testnet = false }) {
  return binanceRequest({
    method: 'GET',
    path: '/api/v3/allOrders',
    params: { symbol, limit: 50 },
    apiKey, apiSecret, testnet
  });
}
