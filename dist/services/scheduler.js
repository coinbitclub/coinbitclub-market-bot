"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupScheduler = setupScheduler;
var _cron = require("cron");
var _logger = _interopRequireDefault(require("../utils/logger.js"));
var _dominanceService = require("./dominanceService.js");
var _fearGreedService = require("./fearGreedService.js");
var _marketsService = require("./marketsService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function setupScheduler() {
  _logger.default.info("Scheduler: starting jobs");
  new _cron.CronJob("0 0 * * *", async () => {
    try {
      await (0, _dominanceService.fetchAndSaveDominance)();
      _logger.default.info("Dominance job OK");
    } catch (e) {
      _logger.default.error("Dominance job failed", e);
    }
    try {
      await (0, _fearGreedService.fetchAndSaveFearGreed)();
      _logger.default.info("FearGreed job OK");
    } catch (e) {
      _logger.default.error("FearGreed job failed", e);
    }
    try {
      await (0, _marketsService.fetchAndSaveMarkets)();
      _logger.default.info("Markets job OK");
    } catch (e) {
      _logger.default.error("Markets job failed", e);
    }
  }, null, true, "UTC");
}