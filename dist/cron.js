"use strict";

var _nodeCron = _interopRequireDefault(require("node-cron"));
var _cleanupService = require("./services/cleanupService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Limpa a cada hora
_nodeCron.default.schedule('0 * * * *', async () => {
  try {
    await (0, _cleanupService.cleanupOldRecords)();
    console.log('Limpeza de dados antigos concluída.');
  } catch (err) {
    console.error('Erro na limpeza:', err);
  }
});

// Consolida dados às 00h (meia-noite)
_nodeCron.default.schedule('0 0 * * *', async () => {
  try {
    await (0, _cleanupService.consolidateDailyData)();
    console.log('Consolidação diária concluída.');
  } catch (err) {
    console.error('Erro na consolidação:', err);
  }
});