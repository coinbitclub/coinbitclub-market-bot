"use strict";

var _express = _interopRequireDefault(require("express"));
var _databaseService = require("../services/databaseService.js");
var _tradingEngine = require("../services/tradingEngine.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();
router.use(_express.default.json());
router.post('/webhook/signal', async (req, res) => {
  try {
    await (0, _databaseService.insertSignal)(req.body);
    await (0, _tradingEngine.handleSignal)(req.body);
    return res.status(200).send('Signal processed');
  } catch (err) {
    console.error('❌ webhook/signal error:', err);
    return res.status(500).send('Error processing signal');
  }
});