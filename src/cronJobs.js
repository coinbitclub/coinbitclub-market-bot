import cron from 'node-cron';
import { monitorOpenTrades } from './services/marketService.js';
import { fetchAndSaveAllSignals } from './services/fetchAndSaveAllSignals.js';
import { runAuditAndPurge } from './cron/auditAndPurge.js';

// Atualiza sinais de todas as fontes a cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
  try {
    await fetchAndSaveAllSignals();
    console.log('AtualizaÃ§Ã£o de sinais (10 em 10 min) OK.');
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

// Rotina de auditoria, limpeza e snapshot diÃ¡rio rodando a cada hora (pode ajustar para rodar Ã s 00h se preferir)
cron.schedule('0 * * * *', async () => {
  try {
    await runAuditAndPurge();
    console.log('Rotina de auditoria/limpeza executada!');
  } catch (err) {
    console.error('Erro na rotina de auditoria/limpeza:', err);
  }
});

console.log('Cron jobs running...');
