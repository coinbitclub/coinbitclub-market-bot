import { getFearGreedAndDominance } from './coinstatsService.js';
import { logger } from '../logger.js';
import { fetchOpenPositions, closePosition } from './exchangeService.js';

export async function dailyRetraining() {
  const { fearGreed, dominance } = await getFearGreedAndDominance(process.env.COINSTATS_API_KEY);
  logger.info(`Retraining IA â€” FearGreed=${fearGreed} Dominance=${dominance}`);
  // lÃ³gica de fine-tune da IA aqui
}

export async function monitorOpenPositions() {
  try {
    const positions = await fetchOpenPositions();
    for (const pos of positions) {
      const { id, entryPrice, currentPrice, symbol, side } = pos;
      const profitPct = ((currentPrice - entryPrice) / entryPrice) * 100 * (side === 'LONG' ? 1 : -1);
      if (profitPct >= 3) {
        logger.info(`Fechando posiÃ§Ã£o ${id} de ${symbol} por lucro â‰¥3%`);
        await closePosition(id);
      }
    }
  } catch (err) {
    logger.error(`Erro em monitorOpenPositions: ${err.message}`);
  }
}




