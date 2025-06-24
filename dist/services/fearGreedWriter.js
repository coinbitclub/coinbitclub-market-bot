"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchAndSaveFearGreed = fetchAndSaveFearGreed;
var _databaseService = require("./databaseService.js");
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _logger = _interopRequireDefault(require("../utils/logger.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
async function saveFearGreed(point) {
  await (0, _databaseService.query)(`INSERT INTO fear_greed (value, classification, date)
     VALUES ($1,$2,$3)`, [point.value, point.classification, point.date]);
}
async function fetchAndSaveFearGreed() {
  _logger.default.info('Scheduler: fetching Fear & Greed index');
  const res = await (0, _nodeFetch.default)('https://api.alternative.me/fng/?limit=1');
  const {
    data
  } = await res.json();
  const point = {
    value: parseInt(data[0].value, 10),
    classification: data[0].value_classification,
    date: new Date(parseInt(data[0].timestamp, 10) * 1000)
  };
  await saveFearGreed(point);
  _logger.default.info('Scheduler: Fear & Greed saved', point);
}