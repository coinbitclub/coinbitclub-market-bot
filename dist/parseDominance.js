"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseDominance = parseDominance;
function parseDominance(body) {
  return {
    dominance: parseFloat(body.dominance),
    ema7: parseFloat(body.ema7),
    timestamp: new Date(body.timestamp)
  };
}