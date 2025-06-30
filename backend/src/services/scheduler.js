// src/services/scheduler.js
import cron from 'node-cron';
import logger from '../utils/logger.js';
import { fetchMetrics, fetchFearGreed, fetchDominance } from './coinstatsService.js';
import { pool, cleanExpiredTestUsers, cleanOldInactiveUsers } from '../database.js';
import { monitorUserPositions } from './orderManager.js';

/**
 * Inicializa todos os jobs agendados sem encerrar o processo.
 */
export function setupScheduler() {
  logger.info('Scheduler: starting jobs');

  // 1) Coleta métricas a cada 2h
  cron.schedule('0 */2 * * *', async () => {
    try {
      const key = process.env.COINSTATS_API_KEY;
      const metrics    = await fetchMetrics(key);
      const dominance  = await fetchDominance(key);
      const fearGreed  = await fetchFearGreed(key);
      await pool.query(
        `INSERT INTO coinstats_metrics
           (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), $1, $2, $3, $4)`,
        [dominance.dominance, metrics.totalMarketCap, metrics.totalVolume, fearGreed.season]
      );
      logger.info('✅ Scheduler: CoinStats salvos no DB');
    } catch (err) {
      logger.error('🚨 Scheduler metrics error:', err);
    }
  });

  // 2) Limpeza de sinais >72h (01:00 am)
  cron.schedule('0 1 * * *', async () => {
    try {
      await pool.query(
        `DELETE FROM signals WHERE captured_at < NOW() - INTERVAL '72 hours'`
      );
      logger.info('🧹 Scheduler: sinais antigos limpos');
    } catch (err) {
      logger.error('🚨 Scheduler cleanup error:', err);
    }
  });

  // 3) Limpeza de testes expirados e inativos (01:30 am)
  cron.schedule('30 1 * * *', async () => {
    try {
      await cleanExpiredTestUsers();
      await cleanOldInactiveUsers();
      logger.info('🧹 Scheduler: usuários expirados/inativos limpos');
    } catch (err) {
      logger.error('🚨 Scheduler user cleanup error:', err);
    }
  });

  // 4) Monitoramento de posições a cada 10 minutos
  cron.schedule('*/10 * * * *', async () => {
    try {
      // Seleciona apenas usuários com assinatura ativa e no período corrente
      const { rows: users } = await pool.query(`
  SELECT u.*, s.tipo_plano, s.valor_pago, s.metodo_pagamento, s.data_inicio, s.data_fim
  FROM users u
  JOIN user_subscriptions s
    ON u.id = s.user_id
  WHERE s.status       = 'ativo'
    AND s.data_inicio <= NOW()
    AND s.data_fim    >= NOW()
`);


      for (const user of users) {
        await monitorUserPositions(user);
      }
      logger.info('🔎 Scheduler: monitoramento de posições rodou com %d usuários.', users.length);
    } catch (err) {
      logger.error('🚨 Scheduler monitoramento error:', err);
    }
  });
}
