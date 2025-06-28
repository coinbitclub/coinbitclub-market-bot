import cron from 'node-cron';
import { fetchAndSaveDominance } from './src/services/dominanceService.js';
import { fetchAndSaveFearGreed } from './src/services/fearGreedService.js';
import { fetchAndSaveMarkets } from './src/services/marketsService.js';

/**
 * Agenda os jobs: a cada 30 minutos
 */
export function scheduleJobs() {
  cron.schedule('*/30 * * * *', () => {
    fetchAndSaveDominance();
    fetchAndSaveFearGreed();
    fetchAndSaveMarkets();
  });
}




