"use strict";

var _nodeCron = _interopRequireDefault(require("node-cron"));
var _marketService = require("./services/marketService.js");
var _fetchAndSaveAllSignals = require("./services/fetchAndSaveAllSignals.js");
var _auditAndPurge = require("./cron/auditAndPurge.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Atualiza sinais de todas as fontes a cada 10 minutos
_nodeCron.default.schedule('*/10 * * * *', async () => {
  try {
    await (0, _fetchAndSaveAllSignals.fetchAndSaveAllSignals)();
    console.log('Atualização de sinais (10 em 10 min) OK.');
  } catch (err) {
    console.error('Erro ao atualizar sinais:', err);
  }
});

// Monitoramento das trades abertas a cada 1 minuto
_nodeCron.default.schedule('*/1 * * * *', async () => {
  try {
    await (0, _marketService.monitorOpenTrades)();
    console.log('Verificando trades abertas...');
  } catch (err) {
    console.error('Erro ao verificar trades abertas:', err);
  }
});

// Rotina de limpeza de dados e snapshot diário (pode ajustar para rodar apenas às 00h se quiser)
_nodeCron.default.schedule('0 * * * *', async () => {
  try {
    await (0, _auditAndPurge.runAuditAndPurge)();
    console.log('Rotina de auditoria/limpeza executada!');
  } catch (err) {
    console.error('Erro na rotina de auditoria/limpeza:', err);
  }
});
console.log('Cron jobs in running...');