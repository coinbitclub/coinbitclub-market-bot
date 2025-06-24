"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeTrades = executeTrades;
var _databaseService = require("./databaseService.js");
var _logger = require("../logger.js");
var _axios = _interopRequireDefault(require("axios"));
var _crypto = _interopRequireDefault(require("crypto"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// src/services/ordersService.js

/**
 * Decide e executa trades para cada usu�rio ativo,
 * diferenciando ambiente de produ��o/teste por campo testnet.
 */
async function executeTrades(signal) {
  const usersRes = await (0, _databaseService.query)('SELECT id, api_key AS apiKey, api_secret AS apiSecret, testnet, trade_params AS tradeParams FROM users WHERE is_active = true', []);
  for (const user of usersRes.rows) {
    let params = {};
    try {
      params = user.tradeParams ? JSON.parse(user.tradeParams) : {};
    } catch {
      _logger.logger.error(`executeTrades: tradeParams inv�lido para usu�rio ${user.id}`);
      continue;
    }

    // Par�metros din�micos conforme ambiente
    const {
      apiKey,
      apiSecret
    } = user;
    if (!apiKey || !apiSecret) {
      _logger.logger.warn(`executeTrades: faltando credenciais para ${user.id}`);
      continue;
    }

    // **Escolhe a URL Bybit correta**
    const baseUrl = user.testnet ? process.env.BYBIT_BASE_URL_TEST || 'https://api-testnet.bybit.com' : process.env.BYBIT_BASE_URL_REAL || 'https://api.bybit.com';

    // Par�metros de ordem (default + sobrescritos)
    const side = params.side || signal.side || 'Buy';
    const qty = params.qty || 1;
    const orderType = params.orderType || 'Market';

    // -- Crit�rios autom�ticos (exemplo, pode expandir aqui)
    // ... [aqui � o melhor local para l�gica de valida��o baseada nos sinais recebidos!]

    const ts = Date.now().toString();
    const endpoint = '/v5/order/create';
    const body = {
      side,
      symbol: signal.ticker,
      orderType,
      qty: qty.toString()
    };
    const prehash = ts + endpoint + JSON.stringify(body);
    const sign = _crypto.default.createHmac('sha256', apiSecret).update(prehash).digest('hex');
    try {
      const resp = await _axios.default.post(`${baseUrl}${endpoint}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': ts,
          'X-BAPI-SIGN': sign
        }
      });
      _logger.logger.info('executeTrades: ordem enviada', {
        user: user.id,
        env: user.testnet ? 'TEST' : 'REAL',
        result: resp.data
      });
    } catch (err) {
      _logger.logger.error(`executeTrades: falha usu�rio ${user.id} [${user.testnet ? 'TEST' : 'REAL'}]`, err);
    }
  }
}