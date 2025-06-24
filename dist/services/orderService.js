"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeTrades = executeTrades;
var _bybitService = require("./bybitService.js");
// ajuste se o nome for diferente

// Função principal para executar trades/ordens (mock para teste)
async function executeTrades(orderPayload) {
  if (process.env.NODE_ENV === 'test') {
    console.log('Modo TESTE: nenhuma ordem real será executada.', orderPayload);
    // Apenas simula/mostra o payload, pode salvar log, etc.
    return;
  }

  // Aqui segue a execução real:
  try {
    const result = await (0, _bybitService.placeOrderBybit)(orderPayload);
    console.log('Ordem executada na Bybit:', result);
    return result;
  } catch (err) {
    console.error('Erro ao executar ordem na Bybit:', err);
    throw err;
  }
}