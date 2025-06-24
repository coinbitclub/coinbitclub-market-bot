"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.closePosition = closePosition;
exports.placeOrder = placeOrder;
var _axios = _interopRequireDefault(require("axios"));
var _crypto = _interopRequireDefault(require("crypto"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const API_KEY = process.env.BYBIT_API_KEY;
const API_SECRET = process.env.BYBIT_API_SECRET;
const IS_TESTNET = process.env.BYBIT_TESTNET === 'true';
const BASE_URL = IS_TESTNET ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

/**
 * Gera assinatura HMAC-SHA256 para chamadas à API Bybit
 * @param {Object} params 
 * @returns {string}
 */
function sign(params) {
  const ordered = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return _crypto.default.createHmac('sha256', API_SECRET).update(ordered).digest('hex');
}

/**
 * Executa ordem de mercado na Bybit
 * @param {{ symbol:string, side:'Buy'|'Sell', qty:number, tp?:number, sl?:number }} opts
 * @returns {Promise<Object>} resposta da API
 */
async function placeOrder({
  symbol,
  side,
  qty,
  tp,
  sl
}) {
  const timestamp = Date.now();
  const params = {
    api_key: API_KEY,
    symbol,
    side,
    order_type: 'Market',
    qty,
    time_in_force: 'GoodTillCancel',
    timestamp,
    recv_window: 5000
  };
  if (tp) params.take_profit = tp;
  if (sl) params.stop_loss = sl;
  params.sign = sign(params);
  const response = await _axios.default.post(`${BASE_URL}/private/linear/order/create`, null, {
    params
  });
  if (response.data.ret_code !== 0) {
    throw new Error(`Bybit placeOrder error: ${response.data.ret_msg}`);
  }
  return response.data.result;
}

/**
 * Fecha uma posição existente (market order inversa)
 * @param {{ symbol:string, side:'Buy'|'Sell', qty:number, tp?:number, sl?:number }} opts
 * @returns {Promise<Object>}
 */
async function closePosition({
  symbol,
  side,
  qty,
  tp,
  sl
}) {
  const closeSide = side === 'Buy' ? 'Sell' : 'Buy';
  return placeOrder({
    symbol,
    side: closeSide,
    qty,
    tp,
    sl
  });
}