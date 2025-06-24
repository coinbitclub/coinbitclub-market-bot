"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = require("express");
var _logger = _interopRequireDefault(require("../utils/logger.js"));
var _parseSignal = require("../parseSignal.js");
var _signalsService = require("../services/signalsService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// src/routes/signals.js

const router = (0, _express.Router)();
router.post('/', async (req, res) => {
  const raw = req.body.trim();
  try {
    _logger.default.info('[raw webhook/signal]', raw);
    const signal = (0, _parseSignal.parseSignal)(raw);
    const userId = req.userId || null;
    await (0, _signalsService.saveSignal)(userId, signal);
    return res.json({
      status: 'ok'
    });
  } catch (err) {
    _logger.default.error('Signal handler error', err);
    return res.status(500).json({
      error: 'Signal processing failed'
    });
  }
});
var _default = exports.default = router;