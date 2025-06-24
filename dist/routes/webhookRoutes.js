"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _marketService = require("../services/marketService.js");
var _express = _interopRequireDefault(require("express"));
var _signalsService = require("../services/signalsService.js");
var _dominanceService = require("../services/dominanceService.js");
var _fearGreedService = require("../services/fearGreedService.js");
var _auth = require("../middleware/auth.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();
router.post('/signal', _auth.verifyToken, async (req, res) => {
  await (0, _signalsService.saveSignal)(req.body);
  res.json({
    status: 'ok'
  });
});
router.post('/dominance', _auth.verifyToken, async (req, res) => {
  await (0, _dominanceService.saveDominance)(req.body);
  res.json({
    status: 'ok'
  });
});
router.post('/fear-greed', _auth.verifyToken, async (req, res) => {
  await (0, _fearGreedService.saveFearAndGreed)(req.body);
  res.json({
    status: 'ok'
  });
});
router.post('/market', async (req, res) => {
  const {
    symbol,
    price,
    timestamp
  } = req.body;
  await (0, _marketService.saveMarketPrice)({
    symbol,
    price,
    timestamp
  });
  res.json({
    status: 'ok'
  });
});
var _default = exports.default = router;