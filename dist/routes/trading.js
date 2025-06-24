"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _exchangeService = require("../services/exchangeService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// src/routes/trading.js (exemplo)

const router = _express.default.Router();
router.post('/order', async (req, res, next) => {
  try {
    const userId = req.user.id; // obtido do auth middleware
    const client = await (0, _exchangeService.createBybitClientForUser)(userId);
    const order = await client.placeOrder({/* ... */});
    res.json(order);
  } catch (err) {
    next(err);
  }
});
var _default = exports.default = router;