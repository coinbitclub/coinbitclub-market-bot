"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanupOldRecords = cleanupOldRecords;
exports.consolidateDailyData = consolidateDailyData;
var _db = _interopRequireDefault(require("../db.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Limpa sinais/dados mais antigos que 72h
async function cleanupOldRecords() {
  await _db.default.query("DELETE FROM signals WHERE time < NOW() - INTERVAL '72 hours'");
  await _db.default.query("DELETE FROM dominance WHERE time < NOW() - INTERVAL '72 hours'");
  await _db.default.query("DELETE FROM fear_greed WHERE time < NOW() - INTERVAL '72 hours'");
}

// Consolida dados diários (salva 1 snapshot por dia)
async function consolidateDailyData() {
  // Signals
  await _db.default.query(`
    INSERT INTO signals_daily (ticker, date, avg_close, max_close, min_close)
    SELECT
      ticker,
      DATE(time) as date,
      AVG(close) as avg_close,
      MAX(close) as max_close,
      MIN(close) as min_close
    FROM signals
    WHERE time >= NOW() - INTERVAL '1 day'
    GROUP BY ticker, DATE(time)
    ON CONFLICT (ticker, date) DO NOTHING
  `);

  // Dominance
  await _db.default.query(`
    INSERT INTO dominance_daily (date, avg_btc_dominance, max_btc_dominance, min_btc_dominance)
    SELECT
      DATE(time) as date,
      AVG(btc_dominance) as avg_btc_dominance,
      MAX(btc_dominance) as max_btc_dominance,
      MIN(btc_dominance) as min_btc_dominance
    FROM dominance
    WHERE time >= NOW() - INTERVAL '1 day'
    GROUP BY DATE(time)
    ON CONFLICT (date) DO NOTHING
  `);

  // Fear Greed
  await _db.default.query(`
    INSERT INTO fear_greed_daily (date, avg_value, max_value, min_value)
    SELECT
      DATE(time) as date,
      AVG(value) as avg_value,
      MAX(value) as max_value,
      MIN(value) as min_value
    FROM fear_greed
    WHERE time >= NOW() - INTERVAL '1 day'
    GROUP BY DATE(time)
    ON CONFLICT (date) DO NOTHING
  `);
}