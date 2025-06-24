"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _databaseService = require("../services/databaseService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();
router.get("/signals", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const {
    rows
  } = await (0, _databaseService.query)(`SELECT * FROM public.signals ORDER BY received_at DESC LIMIT $1`, [limit]);
  res.json(rows);
});
router.get("/dominance", async (req, res) => {
  const period = req.query.period || "24h";
  const {
    rows
  } = await (0, _databaseService.query)(`SELECT * FROM public.dominance
       WHERE timestamp > now() - interval $1
       ORDER BY timestamp DESC`, [period]);
  res.json(rows);
});
router.get("/fear-greed", async (req, res) => {
  const {
    rows
  } = await (0, _databaseService.query)(`SELECT * FROM public.fear_greed ORDER BY timestamp DESC LIMIT 1`, []);
  res.json(rows[0] || {});
});
router.get("/market", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const {
    rows
  } = await (0, _databaseService.query)(`SELECT * FROM public.market ORDER BY timestamp DESC LIMIT $1`, [limit]);
  res.json(rows);
});
var _default = exports.default = router;