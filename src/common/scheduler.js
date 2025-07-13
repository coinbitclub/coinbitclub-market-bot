// src/common/scheduler.js
import cron from 'node-cron';
import { getDB } from './db.js';

/**
 * Configura jobs agendados para manutenção diária.
 */
export function setupScheduler() {
  // Limpeza de registros antigos (30 dias), todo dia às 03:00
  cron.schedule(
    '0 3 * * *',
    async () => {
      try {
        const db = getDB();
        await db('raw_webhook')
          .where('received_at', '<', db.raw("NOW() - INTERVAL '30 days'"))
          .del();
        await db('signals')
          .where('created_at', '<', db.raw("NOW() - INTERVAL '30 days'"))
          .del();
        console.log('🧹 Cleanup done');
      } catch (err) {
        console.error('🧹 Cleanup error:', err);
      }
    },
    {
      timezone: 'America/Sao_Paulo',
    }
  );

  // Expiração de trials, todo dia às 04:00
  cron.schedule(
    '0 4 * * *',
    async () => {
      try {
        const db = getDB();
        await db('users')
          .where('trialEndsAt', '<', db.fn.now())
          .update({ status: 'trial_expired' });
        console.log('⏳ Trials expired');
      } catch (err) {
        console.error('⏳ Trials expiration error:', err);
      }
    },
    {
      timezone: 'America/Sao_Paulo',
    }
  );
}
