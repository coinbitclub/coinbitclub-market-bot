"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLatestSignal = getLatestSignal;
var _db = require("../db.js");
// src/db/signals.js

async function getLatestSignal(symbol) {
  const res = await (0, _db.query)(`SELECT * FROM signals WHERE ticker = $1 ORDER BY time DESC LIMIT 1`, [symbol]);
  return res.rows[0]; // já vem com diff_btc_ema7, cruzou_acima_ema9, etc.
}