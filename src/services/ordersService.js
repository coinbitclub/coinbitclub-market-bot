// src/services/ordersService.js
import { query } from './databaseService.js';
import { logger } from '../logger.js';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Decide e executa trades para cada usuário ativo,
 * diferenciando ambiente de produção/teste por campo testnet.
 */
export async function executeTrades(signal) {
  const usersRes = await query(
    'SELECT id, api_key AS apiKey, api_secret AS apiSecret, testnet, trade_params AS tradeParams FROM users WHERE is_active = true',
    []
  );

  for (const user of usersRes.rows) {
    let params = {};
    try {
      params = user.tradeParams ? JSON.parse(user.tradeParams) : {};
    } catch {
      logger.error(`executeTrades: tradeParams inválido para usuário ${user.id}`);
      continue;
    }

    // Parâmetros dinâmicos conforme ambiente
    const { apiKey, apiSecret } = user;
    if (!apiKey || !apiSecret) {
      logger.warn(`executeTrades: faltando credenciais para ${user.id}`);
      continue;
    }

    // **Escolhe a URL Bybit correta**
    const baseUrl = user.testnet
      ? process.env.BYBIT_BASE_URL_TEST || 'https://api-testnet.bybit.com'
      : process.env.BYBIT_BASE_URL_REAL || 'https://api.bybit.com';

    // Parâmetros de ordem (default + sobrescritos)
    const side = params.side || signal.side || 'Buy';
    const qty = params.qty || 1;
    const orderType = params.orderType || 'Market';

    // -- Critérios automáticos (exemplo, pode expandir aqui)
    // ... [aqui é o melhor local para lógica de validação baseada nos sinais recebidos!]

    const ts = Date.now().toString();
    const endpoint = '/v5/order/create';
    const body = { side, symbol: signal.ticker, orderType, qty: qty.toString() };
    const prehash = ts + endpoint + JSON.stringify(body);
    const sign = crypto.createHmac('sha256', apiSecret).update(prehash).digest('hex');

    try {
      const resp = await axios.post(`${baseUrl}${endpoint}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': ts,
          'X-BAPI-SIGN': sign
        }
      });
      logger.info('executeTrades: ordem enviada', { user: user.id, env: user.testnet ? 'TEST' : 'REAL', result: resp.data });
    } catch (err) {
      logger.error(`executeTrades: falha usuário ${user.id} [${user.testnet ? 'TEST' : 'REAL'}]`, err);
    }
  }
}
