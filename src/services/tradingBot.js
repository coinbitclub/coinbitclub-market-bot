import { getFearGreedAndDominance } from './coinstatsService.js';
import { logger } from '../logger.js';
import { fetchOpenPositions, closePosition } from './exchangeService.js';

// Exemplo de rotina de retreinamento diário (usando IA)
export async function dailyRetraining() {
  const { fearGreed, dominance } = await getFearGreedAndDominance(process.env.COINSTATS_API_KEY);
  logger.info(`Retraining IA — FearGreed=${fearGreed} Dominance=${dominance}`);
  // Lógica de fine-tune IA aqui
}

// Exemplo de monitoramento de posições abertas
export async function monitorOpenPositions() {
  try {
    const positions = await fetchOpenPositions();
    for (const pos of positions) {
      const { id, entryPrice, currentPrice, symbol, side } = pos;
      const profitPct = ((currentPrice - entryPrice) / entryPrice) * 100 * (side === 'LONG' ? 1 : -1);
      if (profitPct >= 3) {
        logger.info(`Fechando posição ${id} de ${symbol} por lucro ≥3%`);
        await closePosition(id);
      }
    }
  } catch (err) {
    logger.error(`Erro em monitorOpenPositions: ${err.message}`);
  }
}
