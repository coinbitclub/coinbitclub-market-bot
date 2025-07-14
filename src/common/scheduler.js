// src/common/scheduler.js
import cron from 'node-cron';
import { initDB } from './db.js';

/**
 * Configura e inicia jobs agendados de manutenção e limpeza.
 * @param {object} db Instância Knex opcional. Se não fornecido, será inicializado.
 */
export async function setupScheduler(db) {
  const database = db || await initDB();

  // Limpeza de raw_webhook e signals a cada 72 horas
  cron.schedule(
    '0 0 */3 * *',
    async () => {
      try {
        await database('raw_webhook')
          .where('received_at', '<', database.raw("NOW() - INTERVAL '72 hours'"))
          .del();
        await database('signals')
          .where('created_at', '<', database.raw("NOW() - INTERVAL '72 hours'"))
          .del();
        console.log('🧹 72h cleanup completed');
      } catch (err) {
        console.error('🧹 72h cleanup error:', err);
      }
    },
    { timezone: 'America/Sao_Paulo' }
  );

  // Expiração de trials após 7 dias
  cron.schedule(
    '0 4 * * *',
    async () => {
      try {
        await database('users')
          .where('trial_ends_at', '<', database.fn.now())
          .andWhere('status', 'trial_active')
          .update({ status: 'trial_expired' });
        console.log('⏳ Trials expired');
      } catch (err) {
        console.error('⏳ Trials expiration error:', err);
      }
    },
    { timezone: 'America/Sao_Paulo' }
  );

  // Remoção de usuários inativos ou sem saldo > 90 dias
  cron.schedule(
    '0 5 * * *',
    async () => {
      try {
        // Usuários inativos há mais de 90 dias
        await database('users')
          .where('status', 'inactive')
          .andWhere('updated_at', '<', database.raw("NOW() - INTERVAL '90 days'"))
          .del();
        // Usuários com saldo abaixo do mínimo
        const minBalance = parseFloat(process.env.MIN_BALANCE || '0');
        await database('user_financial')
          .where('balance', '<', minBalance)
          .del();
        console.log('🗑️ Inactive/low-balance cleanup completed');
      } catch (err) {
        console.error('🗑️ Inactive users cleanup error:', err);
      }
    },
    { timezone: 'America/Sao_Paulo' }
  );

  console.log('✅ Scheduler iniciado');
}
