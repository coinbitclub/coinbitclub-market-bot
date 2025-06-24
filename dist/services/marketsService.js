"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchMarkets = fetchMarkets;
var _axios = _interopRequireDefault(require("axios"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
async function fetchMarkets() {
  const resp = await _axios.default.get('https://openapiv1.coinstats.app/markets', {
    headers: {
      'X-API-KEY': process.env.COINSTATS_API_KEY
    }
  });
  if (!Array.isArray(resp.data)) throw new Error('MarketsService: resposta inv�lida');
  return resp.data;
}