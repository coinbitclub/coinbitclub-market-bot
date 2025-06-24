import cron from 'node-cron';
import { fetchMetrics, fetchFearGreed, fetchDominance } from '../services/coinstatsService.js';
import { executeQuery } from './services/databaseService.js';

export function setupScheduler() {
  // A cada 2h, coleta e salva no banco
  cron.schedule('0 */2 * * *', async () => {
    try {
      const key = process.env.COINSTATS_API_KEY;
      await fetchFearGreed(key);
      await executeQuery(
        `INSERT INTO coinstats_metrics (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), NULL, NULL, NULL, NULL);`
      );
      const mk = await fetchMetrics(key);
      await executeQuery(
        `INSERT INTO coinstats_metrics (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), NULL, $1, $2, NULL)`,
        [mk.totalMarketCap, mk.totalVolume]
      );
      const bd = await fetchDominance(key);
      await executeQuery(
        `INSERT INTO coinstats_metrics (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), $1, NULL, NULL, NULL)`,
        [bd.dominance]
      );
      console.log('✅ Scheduler: CoinStats salvos no DB');
    } catch (err) {
      console.error('🚨 Scheduler error:', err);
    }
  });

  // Limpeza diária de sinais (>72h)
  cron.schedule('0 1 * * *', async () => {
    try {
      await executeQuery(
        `DELETE FROM signals WHERE captured_at < NOW() - INTERVAL '72 hours'`
      );
      console.log('🗑️ Scheduler: sinais antigos limpos');
    } catch (err) {
      console.error('🚨 Scheduler cleanup error:', err);
    }
  });
}
