import cron from 'node-cron';
import { monitorOpenTrades } from './services/marketService.js';
import { fetchAndSaveAllSignals } from './services/fetchAndSaveAllSignals.js';
import { runAuditAndPurge } from './cron/auditAndPurge.js';
import { generateAndSaveAiReport } from './services/aiService.js';

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

// Rotina de auditoria, limpeza e snapshot diário rodando a cada hora
cron.schedule('0 * * * *', async () => {
  try {
    await runAuditAndPurge();
    console.log('Rotina de auditoria/limpeza executada!');
  } catch (err) {
    console.error('Erro na rotina de auditoria/limpeza:', err);
  }
});

// Gera relatório IA a cada 4 horas (Radar da Águia News)
cron.schedule('0 */4 * * *', async () => {
  try {
    await generateAndSaveAiReport("pt");
    console.log('[IA] Relatório de mercado gerado!');
  } catch (e) {
    console.error('[IA] Falha ao gerar relatório:', e.message);
    // Aqui pode disparar alerta para admin via WhatsApp se desejar
  }
});

// Limpa logs da IA com mais de 24h
cron.schedule('0 * * * *', async () => {
  try {
    const { pool } = await import('./database.js');
    await pool.query(
      "DELETE FROM ai_logs WHERE created_at < NOW() - INTERVAL '24 hour'"
    );
    console.log('[IA] Logs antigos removidos.');
  } catch (err) {
    console.error('[IA] Erro ao limpar logs:', err);
  }
});

console.log('Cron jobs running...');
