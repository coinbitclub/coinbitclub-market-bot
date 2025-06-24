"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchAndSaveDominance = fetchAndSaveDominance;
exports.fetchAndSaveFearGreed = fetchAndSaveFearGreed;
exports.fetchAndSaveMarket = fetchAndSaveMarket;
exports.saveSignal = saveSignal;
var _axios = _interopRequireDefault(require("axios"));
var _databaseService = require("./databaseService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
async function saveSignal(body) {
  const {
    ticker,
    time,
    close
  } = body;
  await (0, _databaseService.query)(`INSERT INTO public.signals (signal_json, received_at, ticker, time, close)
       VALUES ($1, now(), $2, $3, $4)`, [body, ticker, time, close]);
}
async function fetchAndSaveDominance() {
  const resp = await _axios.default.get("https://api.example.com/dominance");
  const {
    timestamp,
    btc_dom,
    eth_dom
  } = resp.data;
  await (0, _databaseService.query)(`INSERT INTO public.dominance (timestamp, btc_dom, eth_dom)
       VALUES ($1, $2, $3)`, [timestamp, btc_dom, eth_dom]);
}
async function fetchAndSaveFearGreed() {
  const resp = await _axios.default.get("https://api.example.com/fear-greed");
  const {
    index_value,
    value_classification,
    timestamp
  } = resp.data;
  await (0, _databaseService.query)(`INSERT INTO public.fear_greed (index_value, value_classification, timestamp)
       VALUES ($1, $2, $3)`, [index_value, value_classification, timestamp]);
}
async function fetchAndSaveMarket() {
  const resp = await _axios.default.get("https://api.example.com/market");
  for (const {
    symbol,
    price,
    timestamp
  } of resp.data) {
    await (0, _databaseService.query)(`INSERT INTO public.market (symbol, price, timestamp)
         VALUES ($1, $2, $3)`, [symbol, price, timestamp]);
  }
}