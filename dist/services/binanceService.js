"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.placeBinanceOrder = placeBinanceOrder;
var _axios = _interopRequireDefault(require("axios"));
var _crypto = _interopRequireDefault(require("crypto"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const BASE = 'https://api.binance.com';
function sign(query, secret) {
  return _crypto.default.createHmac('sha256', secret).update(query).digest('hex');
}
async function placeBinanceOrder({
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
  await _axios.default.post(`${BASE}/api/v3/order?${orderQuery}&signature=${signature1}`, null, {
    headers: {
      'X-MBX-APIKEY': apiKey
    }
  });

  // Depois criamos a OCO para TP/SL
  const tpPrice = (price * (1 + tpPercent / 100)).toFixed(8);
  const slPrice = (price * (1 - slPercent / 100)).toFixed(8);
  const ocoQuery = [`symbol=${symbol}`, `side=SELL`, `type=OCO`, `quantity=${qty}`, `price=${tpPrice}`, `stopPrice=${slPrice}`, `stopLimitPrice=${slPrice}`, `stopLimitTimeInForce=GTC`, `timestamp=${Date.now()}`].join('&');
  const signature2 = sign(ocoQuery, apiSecret);
  const {
    data
  } = await _axios.default.post(`${BASE}/api/v3/order/oco?${ocoQuery}&signature=${signature2}`, null, {
    headers: {
      'X-MBX-APIKEY': apiKey
    }
  });
  return data;
}