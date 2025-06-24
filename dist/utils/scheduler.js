"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupScheduler = setupScheduler;
var _nodeCron = _interopRequireDefault(require("node-cron"));
var _coinstatsService = require("../services/coinstatsService.js");
var _databaseService = require("./services/databaseService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function setupScheduler() {
  // A cada 2h, coleta e salva no banco
  _nodeCron.default.schedule('0 */2 * * *', async () => {
    try {
      const key = process.env.COINSTATS_API_KEY;
      await (0, _coinstatsService.fetchFearGreed)(key);
      await (0, _databaseService.executeQuery)(`INSERT INTO coinstats_metrics (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), NULL, NULL, NULL, NULL);`);
      const mk = await (0, _coinstatsService.fetchMetrics)(key);
      await (0, _databaseService.executeQuery)(`INSERT INTO coinstats_metrics (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), NULL, $1, $2, NULL)`, [mk.totalMarketCap, mk.totalVolume]);
      const bd = await (0, _coinstatsService.fetchDominance)(key);
      await (0, _databaseService.executeQuery)(`INSERT INTO coinstats_metrics (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), $1, NULL, NULL, NULL)`, [bd.dominance]);
      console.log('✅ Scheduler: CoinStats salvos no DB');
    } catch (err) {
      console.error('🚨 Scheduler error:', err);
    }
  });

  // Limpeza diária de sinais (>72h)
  _nodeCron.default.schedule('0 1 * * *', async () => {
    try {
      await (0, _databaseService.executeQuery)(`DELETE FROM signals WHERE captured_at < NOW() - INTERVAL '72 hours'`);
      console.log('🗑️ Scheduler: sinais antigos limpos');
    } catch (err) {
      console.error('🚨 Scheduler cleanup error:', err);
    }
  });
}