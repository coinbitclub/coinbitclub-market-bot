import axios from 'axios';
import crypto from 'crypto';

// URL base por ambiente
const BYBIT_BASE_REAL = process.env.BYBIT_BASE_URL_REAL;
const BYBIT_BASE_TEST = process.env.BYBIT_BASE_URL_TEST;

// Gera assinatura para Bybit v5
function signParams(params, apiSecret) {
  const ordered = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', apiSecret).update(ordered).digest('hex');
}

// Envia ordem
export async function placeBybitOrder({ apiKey, apiSecret, isTestnet, category = 'linear', symbol, side, qty, orderType = 'Market' }) {
  const url = `${isTestnet ? BYBIT_BASE_TEST : BYBIT_BASE_REAL}/v5/order/create`;

  const params = {
    category, // 'linear' para futuros perpétuos
    symbol,
    side,
    orderType,
    qty,
    timestamp: Date.now().toString(),
    apiKey
  };
  params.sign = signParams(params, apiSecret);

  const { data } = await axios.post(url, params, { headers: { 'Content-Type': 'application/json' } });
  return data;
}

// Buscar saldo (Wallet)
export async function getBybitBalance({ apiKey, apiSecret, isTestnet, coin = 'USDT', accountType = 'UNIFIED' }) {
  const url = `${isTestnet ? BYBIT_BASE_TEST : BYBIT_BASE_REAL}/v5/account/wallet-balance`;
  const params = {
    accountType,
    coin,
    timestamp: Date.now().toString(),
    apiKey
  };
  params.sign = signParams(params, apiSecret);

  const { data } = await axios.get(url, { params });
  return data;
}

// Histórico de ordens
export async function getBybitOrderHistory({ apiKey, apiSecret, isTestnet, symbol, category = 'linear' }) {
  const url = `${isTestnet ? BYBIT_BASE_TEST : BYBIT_BASE_REAL}/v5/order/history`;
  const params = {
    category,
    symbol,
    timestamp: Date.now().toString(),
    apiKey
  };
  params.sign = signParams(params, apiSecret);

  const { data } = await axios.get(url, { params });
  return data;
}
