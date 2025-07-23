import cron from 'node-cron';
import { getFearAndGreed, getBtcDominance } from '../../signal-ingestor/src/coinStatsClient.js';
import { db } from '../../common/db.js';

export function setupScheduler() {
  cron.schedule('*/30 * * * *', async () => {
    const fg = await getFearAndGreed();
    const dom = await getBtcDominance();
    await db('cointars').insert({ fear_greed_index: fg, btc_dominance: dom, timestamp: new Date() });
  });

  cron.schedule('0 0 */3 * *', async () => {
    await db('raw_webhook').del();
    await db('signals').del();
  });
}
