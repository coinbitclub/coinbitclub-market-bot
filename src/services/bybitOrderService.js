import axios from 'axios';

/**
 * Executa ordem na Bybit para o usuário certo e ambiente certo (real/teste)
 * @param {Object} user - Objeto do usuário, vindo do banco (deve conter api_key, api_secret, testnet)
 * @param {Object} orderData - Dados da ordem (symbol, side, qty, orderType, etc.)
 * @returns {Promise<Object>} - Resposta da Bybit
 */
export async function executeBybitOrder(user, orderData) {
  if (!user || !user.api_key || !user.api_secret) {
    throw new Error('Usuário sem credenciais configuradas.');
  }

  // Escolhe o endpoint certo (testnet/real)
  const BYBIT_BASE_URL = user.testnet
    ? process.env.BYBIT_BASE_URL_TEST
    : process.env.BYBIT_BASE_URL_REAL;

  // Endpoint da Bybit v5 para criar ordem
  const endpoint = '/v5/order/create';
  const url = `${BYBIT_BASE_URL}${endpoint}`;

  // ATENÇÃO: Adapte assinatura segundo a versão correta da Bybit se necessário!
  const signedParams = { ...orderData, api_key: user.api_key };

  const response = await axios.post(url, signedParams, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data;
}
