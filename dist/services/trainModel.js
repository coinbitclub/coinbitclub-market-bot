"use strict";

var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _databaseService = require("./databaseService.js");
var _mlPipeline = require("./mlPipeline.js");
var _logger = require("../logger.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
(async () => {
  try {
    const [signals, metrics, fgData, operations, userSettings, macroEvents, whaleMovements, newsSentiment, holidays] = await Promise.all([(0, _databaseService.query)("SELECT * FROM signals WHERE created_at >= NOW() - INTERVAL '72 hours' ORDER BY created_at ASC"), (0, _databaseService.query)("SELECT * FROM market_metrics WHERE captured_at >= NOW() - INTERVAL '72 hours' ORDER BY captured_at ASC"), (0, _databaseService.query)("SELECT * FROM fear_greed WHERE captured_at >= NOW() - INTERVAL '72 hours' ORDER BY captured_at ASC"), (0, _databaseService.query)("SELECT * FROM orders WHERE created_at >= NOW() - INTERVAL '72 hours' ORDER BY created_at ASC"), (0, _databaseService.query)("SELECT u.id AS user_id, uc.exchange, uc.settings FROM users u LEFT JOIN user_credentials uc ON uc.user_id = u.id"), (0, _databaseService.query)("SELECT * FROM macro_events WHERE event_time >= NOW() - INTERVAL '72 hours' ORDER BY event_time ASC"), (0, _databaseService.query)("SELECT * FROM whale_movements WHERE recorded_at >= NOW() - INTERVAL '72 hours' ORDER BY recorded_at ASC"), (0, _databaseService.query)("SELECT * FROM news_sentiment WHERE published_at >= NOW() - INTERVAL '72 hours' ORDER BY published_at ASC"), (0, _databaseService.query)("SELECT * FROM holidays WHERE date >= CURRENT_DATE - INTERVAL '3 days'")]).then(results => results.map(r => r.rows));
    const modelBuffer = await (0, _mlPipeline.trainAndSerialize)({
      signals,
      metrics,
      fgData,
      operations,
      userSettings,
      macroEvents,
      whaleMovements,
      newsSentiment,
      holidays
    });
    const outPath = _path.default.resolve(process.cwd(), 'model.bin');
    _fs.default.writeFileSync(outPath, modelBuffer);
    _logger.logger.info(`Model saved to ${outPath}`);
    process.exit(0);
  } catch (e) {
    _logger.logger.error(e);
    process.exit(1);
  }
})();