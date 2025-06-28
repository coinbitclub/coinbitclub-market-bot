import cron from 'node-cron';
import { cleanupOldRecords, consolidateDailyData } from './services/cleanupService.js';

// Limpa a cada hora
cron.schedule('0 * * * *', async () => {
  try {
    await cleanupOldRecords();
    console.log('Limpeza de dados antigos concluÃ­da.');
  } catch (err) {
    console.error('Erro na limpeza:', err);
  }
});

// Consolida dados Ã s 00h (meia-noite)
cron.schedule('0 0 * * *', async () => {
  try {
    await consolidateDailyData();
    console.log('ConsolidaÃ§Ã£o diÃ¡ria concluÃ­da.');
  } catch (err) {
    console.error('Erro na consolidaÃ§Ã£o:', err);
  }
});
