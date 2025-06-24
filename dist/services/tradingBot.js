"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dailyRetraining = dailyRetraining;
exports.monitorOpenPositions = monitorOpenPositions;
var _coinstatsService = require("./coinstatsService.js");
var _logger = require("../logger.js");
var _exchangeService = require("./exchangeService.js");
async function dailyRetraining() {
  const {
    fearGreed,
    dominance
  } = await (0, _coinstatsService.getFearGreedAndDominance)(process.env.COINSTATS_API_KEY);
  _logger.logger.info(`Retraining IA — FearGreed=${fearGreed} Dominance=${dominance}`);
  // lógica de fine-tune da IA aqui
}
async function monitorOpenPositions() {
  try {
    const positions = await (0, _exchangeService.fetchOpenPositions)();
    for (const pos of positions) {
      const {
        id,
        entryPrice,
        currentPrice,
        symbol,
        side
      } = pos;
      const profitPct = (currentPrice - entryPrice) / entryPrice * 100 * (side === 'LONG' ? 1 : -1);
      if (profitPct >= 3) {
        _logger.logger.info(`Fechando posição ${id} de ${symbol} por lucro ≥3%`);
        await (0, _exchangeService.closePosition)(id);
      }
    }
  } catch (err) {
    _logger.logger.error(`Erro em monitorOpenPositions: ${err.message}`);
  }
}