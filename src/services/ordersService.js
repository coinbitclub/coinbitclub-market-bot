// src/services/ordersService.js
import { query } from './databaseService.js';
import { logger } from '../logger.js';
import { placeBybitOrder } from './bybitAdapter.js';
import { placeBinanceOrder } from './binanceAdapter.js';

/**
 * Decide e executa trades para cada usuário ativo,
 * diferenciando ambiente de produção/teste e exchange.
 */
export async function executeTrades(signal) {
  const usersRes = await query(
    'SELECT id, exchange, api_key AS apiKey, api_secret AS apiSecret, testnet, trade_params AS tradeParams FROM users WHERE is_active = true',
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

    if (!user.apiKey || !user.apiSecret) {
      logger.warn(`executeTrades: faltando credenciais para ${user.id}`);
      continue;
    }

    const side = params.side || signal.side || 'Buy';
    const qty = params.qty || 1;

    try {
      let result;
      if (user.exchange === 'bybit') {
        result = await placeBybitOrder({
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          isTestnet: user.testnet,
          symbol: signal.ticker,
          side,
          qty,
        });
      } else if (user.exchange === 'binance') {
        result = await placeBinanceOrder({
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          isTestnet: user.testnet,
          symbol: signal.ticker,
          side,
          qty,
        });
      } else {
        logger.warn(`executeTrades: exchange desconhecida para usuário ${user.id}`);
        continue;
      }
      logger.info('executeTrades: ordem enviada', { user: user.id, exchange: user.exchange, env: user.testnet ? 'TEST' : 'REAL', result });
    } catch (err) {
      logger.error(`executeTrades: falha usuário ${user.id} [${user.exchange}]`, err);
    }
  }
}
