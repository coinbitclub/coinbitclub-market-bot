// src/services/orderManager.js

import { getUserOperations } from '../database.js';
import { placeBybitOrder, closeBybitPosition } from './bybitAdapter.js';
import { placeBinanceOrder } from './binanceAdapter.js';
import { logger } from '../logger.js';

/**
 * Gerencia posições do usuário (ex: fechamento automático por TP/SL)
 * - Para cada operação aberta, avalia se é hora de fechar/ajustar
 */
export async function monitorUserPositions(user) {
  // Pega as operações abertas do usuário
  const operations = await getUserOperations(user.id);

  for (const op of operations) {
    try {
      // Exemplo de lógica: fecha posição se atingir TP/SL
      if (op.status === 'aberta' && op.pnl !== undefined) {
        // Fechamento por Take Profit (TP)
        if (user.tp && op.pnl >= user.tp) {
          await fecharPosicao(user, op, 'TP atingido');
        }
        // Fechamento por Stop Loss (SL)
        if (user.sl && op.pnl <= -Math.abs(user.sl)) {
          await fecharPosicao(user, op, 'SL atingido');
        }
      }
    } catch (err) {
      logger.error(`monitorUserPositions: erro na op ${op.id} user ${user.id}`, err);
    }
  }
}

/**
 * Fecha uma posição do usuário, usando a exchange correta
 */
export async function fecharPosicao(user, op, motivo = '') {
  try {
    let result;
    if (user.exchange === 'bybit') {
      result = await closeBybitPosition({
        apiKey: user.api_key,
        apiSecret: user.api_secret,
        isTestnet: user.testnet,
        symbol: op.symbol,
        side: op.side,
        qty: op.qty
      });
    } else if (user.exchange === 'binance') {
      // Binance: apenas inverte o lado e executa ordem
      const closeSide = op.side === 'Buy' ? 'Sell' : 'Buy';
      result = await placeBinanceOrder({
        apiKey: user.api_key,
        apiSecret: user.api_secret,
        isTestnet: user.testnet,
        symbol: op.symbol,
        side: closeSide,
        qty: op.qty
      });
    } else {
      throw new Error('Exchange desconhecida');
    }

    // Aqui você pode marcar a operação como fechada no banco, se quiser!
    logger.info(`[OrderManager] Fechada posição usuário ${user.id} op ${op.id} motivo: ${motivo}`, result);
    // Exemplo: await markOperationClosed(op.id);

    return result;
  } catch (err) {
    logger.error(`[OrderManager] Erro ao fechar posição usuário ${user.id} op ${op.id}:`, err);
    throw err;
  }
}
