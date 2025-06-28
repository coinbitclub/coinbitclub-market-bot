import cron from 'node-cron';
import { fetchAndSaveDominance, fetchAndSaveFearGreed, fetchAndSaveMarkets } from '../services/coinStatsService.js';

cron.schedule('*/10 * * * *', async () => { // a cada 10min
  await fetchAndSaveDominance();
  await fetchAndSaveFearGreed();
  await fetchAndSaveMarkets();
  console.log('CoinStats atualizado:', new Date());
});




