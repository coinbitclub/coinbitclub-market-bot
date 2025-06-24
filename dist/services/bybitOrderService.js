"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeBybitOrder = executeBybitOrder;
var _axios = _interopRequireDefault(require("axios"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Executa ordem na Bybit para o usu�rio certo e ambiente certo (real/teste)
 * @param {Object} user - Objeto do usu�rio, vindo do banco
 * @param {Object} orderData - Dados da ordem a ser enviada para Bybit
 * @returns {Promise<Object>} - Resposta da Bybit
 */
async function executeBybitOrder(user, orderData) {
  if (!user || !user.api_key || !user.api_secret) {
    throw new Error('Usu�rio sem credenciais configuradas.');
  }

  // Escolhe o endpoint certo (testnet/real)
  const BYBIT_BASE_URL = user.testnet ? process.env.BYBIT_BASE_URL_TEST : process.env.BYBIT_BASE_URL_REAL;

  // Endpoint da Bybit v5 para criar ordem
  const endpoint = '/v5/order/create';
  const url = `${BYBIT_BASE_URL}`;

  // ATEN��O: Implemente assinatura conforme documenta��o da Bybit v5!
  const signedParams = {
    ...orderData,
    api_key: user.api_key
  };
  const response = await _axios.default.post(url, signedParams, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}