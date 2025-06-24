"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeTrades = executeTrades;
var _axios = _interopRequireDefault(require("axios"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Supondo que o usu�rio tem uma flag `testnet` ou todo sistema est� em modo teste
const BYBIT_BASE_URL_TEST = process.env.BYBIT_BASE_URL_TEST;
const BYBIT_BASE_URL_REAL = process.env.BYBIT_BASE_URL_REAL;

// Aqui, se a l�gica de quem deve operar em teste j� est� mapeada:
function getBybitUrl(user) {
  // Troque por sua l�gica: por usu�rio, global ou vari�vel de ambiente
  return user && user.testnet === true ? BYBIT_BASE_URL_TEST : BYBIT_BASE_URL_REAL;
}

// Exemplo de uso
async function executeTrades(signal) {
  // Busque usu�rios ativos do banco (ex: todos de teste)
  const users = await getActiveUsers(); // Suponha que busca s� quem deve rodar no testnet

  for (const user of users) {
    const bybitUrl = getBybitUrl(user);

    // Simula��o de execu��o de ordem
    if (bybitUrl === BYBIT_BASE_URL_TEST) {
      // Aqui vai o POST para o endpoint testnet
      await _axios.default.post(`${bybitUrl}/v5/order/create`, {
        /* ...params da ordem, assinatura etc... */
      });
      console.log('Ordem enviada para ambiente de teste Bybit:', user.email);
    } else {
      // Caso fosse ambiente real (s� liberar quando migrar para produ��o!)
      await _axios.default.post(`${bybitUrl}/v5/order/create`, {
        /* ...params reais... */
      });
    }
  }
}