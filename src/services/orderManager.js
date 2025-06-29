import { getUserOperations } from '../database.js';
import { placeBybitOrder, closeBybitPosition } from './bybitAdapter.js';
import { placeBinanceOrder } from './binanceAdapter.js';
import logger from '../utils/logger.js';

/**
 * Monitora posições abertas do usuário e fecha se atingir TP/SL
 */
export async function monitorUserPositions(user) {
  const operations = await getUserOperations(user.id);

  for (const op of operations) {
    try {
      if (op.status === 'aberta' && op.pnl !== undefined) {
        if (user.tp && op.pnl >= user.tp) {
          await fecharPosicao(user, op, 'TP atingido');
        }
        if (user.sl && op.pnl <= -Math.abs(user.sl)) {
          await fecharPosicao(user, op, 'SL atingido');
        }
      }
    } catch (err) {
      logger.error(`monitorUserPositions: erro na op ${op.id} user ${user.id}`, err);
    }
  }
}

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

    logger.info(`[OrderManager] Fechada posição usuário ${user.id} op ${op.id} motivo: ${motivo}`, result);
    // Aqui marque como fechada se desejar (ex: await markOperationClosed(op.id);)
    return result;
  } catch (err) {
    logger.error(`[OrderManager] Erro ao fechar posição usuário ${user.id} op ${op.id}:`, err);
    throw err;
  }
}
