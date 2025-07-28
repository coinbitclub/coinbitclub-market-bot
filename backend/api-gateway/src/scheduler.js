import cron from 'node-cron';
import { getFearAndGreed, getBtcDominance } from '../../../signal-ingestor/src/coinStatsClient.js';
import { FinancialCronJobs } from './services/financialCronJobs.js';
import AllCronJobs from './services/allCronJobs.js';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

export function setupScheduler() {
  logger.info('🚀 Configurando scheduler completo...');

  // NOVO: Inicializar TODOS os cron jobs automatizados
  AllCronJobs.init();

  // Cron jobs existentes (mantidos para compatibilidade)
  cron.schedule('*/30 * * * *', async () => {
    const fg = await getFearAndGreed();
    const dom = await getBtcDominance();
    await db('cointars').insert({ fear_greed_index: fg, btc_dominance: dom, timestamp: new Date() });
  });

  cron.schedule('0 0 */3 * *', async () => {
    await db('raw_webhook').del();
    await db('signals').del();
  });

  // Inicializar cron jobs financeiros
  FinancialCronJobs.init();

  logger.info('✅ Scheduler completo configurado com todos os cron jobs!');
}
