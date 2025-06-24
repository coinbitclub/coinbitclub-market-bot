import cron from 'node-cron';
import { monitorOpenTrades } from './services/marketService.js';
import { fetchAndSaveAllSignals } from './services/fetchAndSaveAllSignals.js';
import { runAuditAndPurge } from './cron/auditAndPurge.js';

// Atualiza sinais de todas as fontes a cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
  try {
    await fetchAndSaveAllSignals();
    console.log('Atualização de sinais (10 em 10 min) OK.');
  } catch (err) {
    console.error('Erro ao atualizar sinais:', err);
  }
});

// Monitoramento das trades abertas a cada 1 minuto
cron.schedule('*/1 * * * *', async () => {
  try {
    await monitorOpenTrades();
    console.log('Verificando trades abertas...');
  } catch (err) {
    console.error('Erro ao verificar trades abertas:', err);
  }
});

// Rotina de limpeza de dados e snapshot diário (pode ajustar para rodar apenas às 00h se quiser)
cron.schedule('0 * * * *', async () => {
  try {
    await runAuditAndPurge();
    console.log('Rotina de auditoria/limpeza executada!');
  } catch (err) {
    console.error('Erro na rotina de auditoria/limpeza:', err);
  }
});

console.log('Cron jobs in running...');
