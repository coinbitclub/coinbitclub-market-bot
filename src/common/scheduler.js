import cron from 'node-cron';
import { getDB } from './db.js';
export function setupScheduler() {
  cron.schedule('0 3 * * *', async () => {
    const db = getDB();
    await db('raw_webhook').where('received_at', '<', db.raw("NOW() - INTERVAL '30 days' ")).del();
    await db('signals').where('created_at', '<', db.raw("NOW() - INTERVAL '30 days' ")).del();
    console.log('🧹 Cleanup done');
  });
  cron.schedule('0 4 * * *', async () => {
    const db = getDB();
    await db('users').where('trialEndsAt', '<', db.fn.now()).update({ status: 'trial_expired' });
    console.log('⏳ Trials expired');
  });
}
