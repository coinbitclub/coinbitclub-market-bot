"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveMarkets = saveMarkets;
var _db = _interopRequireDefault(require("../db.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/* src/services/marketsWriter.js */

async function saveMarkets(markets) {
  for (const m of markets) {
    await _db.default.query(`INSERT INTO markets (symbol, price, change, volume)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (symbol) DO UPDATE
         SET price  = EXCLUDED.price,
             change = EXCLUDED.change,
             volume = EXCLUDED.volume`, [m.symbol, m.price, m.change, m.volume]);
  }
}