"use strict";

var _nodeCron = _interopRequireDefault(require("node-cron"));
var _coinStatsService = require("../services/coinStatsService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
_nodeCron.default.schedule('*/10 * * * *', async () => {
  // a cada 10min
  await (0, _coinStatsService.fetchAndSaveDominance)();
  await (0, _coinStatsService.fetchAndSaveFearGreed)();
  await (0, _coinStatsService.fetchAndSaveMarkets)();
  console.log('CoinStats atualizado:', new Date());
});