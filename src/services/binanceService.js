import axios from 'axios';
import crypto from 'crypto';

const BASE = 'https://api.binance.com';

function sign(query, secret) {
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

export async function placeBinanceOrder({
  apiKey,
  apiSecret,
  symbol,
  side = 'BUY',
  qty,
  price,
  tpPercent,
  slPercent
}) {
  const ts = Date.now();
  // Primeiro enviamos ordem de market
  const orderQuery = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${qty}&timestamp=${ts}`;
  const signature1 = sign(orderQuery, apiSecret);
  await axios.post(`${BASE}/api/v3/order?${orderQuery}&signature=${signature1}`, null, {
    headers: { 'X-MBX-APIKEY': apiKey }
  });

  // Depois criamos a OCO para TP/SL
  const tpPrice = (price * (1 + tpPercent / 100)).toFixed(8);
  const slPrice = (price * (1 - slPercent / 100)).toFixed(8);
  const ocoQuery = [
    `symbol=${symbol}`,
    `side=SELL`,
    `type=OCO`,
    `quantity=${qty}`,
    `price=${tpPrice}`,
    `stopPrice=${slPrice}`,
    `stopLimitPrice=${slPrice}`,
    `stopLimitTimeInForce=GTC`,
    `timestamp=${Date.now()}`
  ].join('&');
  const signature2 = sign(ocoQuery, apiSecret);
  const { data } = await axios.post(`${BASE}/api/v3/order/oco?${ocoQuery}&signature=${signature2}`, null, {
    headers: { 'X-MBX-APIKEY': apiKey }
  });

  return data;
}




