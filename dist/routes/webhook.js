"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _databaseService = require("../services/databaseService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();
router.use(_express.default.json());

// /webhook/signal
router.post('/webhook/signal', async (req, res) => {
  try {
    await (0, _databaseService.insertSignal)(req.body);
    return res.status(200).send('Signal saved');
  } catch (err) {
    console.error('❌ insertSignal error:', err);
    return res.status(500).send('Error saving signal');
  }
});

// /webhook/dominance
router.post('/webhook/dominance', async (req, res) => {
  try {
    await (0, _databaseService.insertDominance)(req.body);
    return res.status(200).send('Dominance saved');
  } catch (err) {
    console.error('❌ insertDominance error:', err);
    return res.status(500).send('Error saving dominance');
  }
});

// /webhook/fear-greed
router.post('/webhook/fear-greed', async (req, res) => {
  try {
    await (0, _databaseService.insertFearGreed)(req.body);
    return res.status(200).send('Fear & Greed saved');
  } catch (err) {
    console.error('❌ insertFearGreed error:', err);
    return res.status(500).send('Error saving fear-greed');
  }
});
var _default = exports.default = router;