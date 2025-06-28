// src/services/scheduler.js
import cron from 'node-cron';
import logger from '../logger.js';

import { fetchMetrics, fetchFearGreed, fetchDominance } from './coinstatsService.js';
import { pool } from '../database.js';
import { cleanExpiredTestUsers, cleanOldInactiveUsers } from '../database.js';
import { monitorUserPositions } from './orderManager.js'; // Se quiser monitoramento de trades

// Função utilitária para query async
async function executeQuery(sql, params) {
  return pool.query(sql, params);
}

export function setupScheduler() {
  // Job: coleta CoinStats a cada 2h
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
      logger.info('✅ Scheduler: CoinStats salvos no DB');
    } catch (err) {
      logger.error('🚨 Scheduler error:', err);
    }
  });

  // Limpeza diária de sinais (>72h)
  cron.schedule('0 1 * * *', async () => {
    try {
      await executeQuery(
        `DELETE FROM signals WHERE captured_at < NOW() - INTERVAL '72 hours'`
      );
      logger.info('🧹 Scheduler: sinais antigos limpos');
    } catch (err) {
      logger.error('🚨 Scheduler cleanup error:', err);
    }
  });

  // Limpeza de usuários em teste e usuários inativos
  cron.schedule('30 1 * * *', async () => {
    try {
      await cleanExpiredTestUsers();
      await cleanOldInactiveUsers();
      logger.info('🧹 Scheduler: usuários expirados e inativos limpos');
    } catch (err) {
      logger.error('🚨 Scheduler user cleanup error:', err);
    }
  });

  // (Opcional) Monitoramento automático de posições abertas (exemplo: a cada 10 min)
  cron.schedule('*/10 * * * *', async () => {
    try {
      // Supondo que você tenha uma função para buscar todos usuários ativos
      const { rows: users } = await executeQuery(
        `SELECT * FROM users WHERE status = 'ativo'`
      );
      for (const user of users) {
        await monitorUserPositions(user);
      }
      logger.info('🔎 Scheduler: monitoramento automático de posições rodado.');
    } catch (err) {
      logger.error('🚨 Scheduler monitoramento error:', err);
    }
  });
}
