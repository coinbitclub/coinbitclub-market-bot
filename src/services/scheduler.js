// src/services/scheduler.js
import cron from 'node-cron';
import logger from '../utils/logger.js';
import {
  fetchMetrics,
  fetchFearGreed,
  fetchDominance
} from './coinstatsService.js';
import {
  pool,
  cleanExpiredTestUsers,
  cleanOldInactiveUsers
} from '../database.js';
import { monitorUserPositions } from './orderManager.js';

/**
 * Faz retry simples de uma função async, com backoff exponencial.
 */
async function withRetry(fn, retries = 3, delayMs = 1000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const backoff = delayMs * 2 ** (attempt - 1);
      logger.warn(`Retry ${attempt}/${retries} em ${backoff}ms...`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

/**
 * Inicializa todos os jobs agendados sem encerrar o processo.
 */
export function setupScheduler() {
  logger.info('Scheduler: iniciando jobs agendados');

  // 1) Coleta métricas a cada 25 minutos (>= 25min)
  cron.schedule('*/25 * * * *', async () => {
    logger.info('🕑 Job: fetch CoinStats iniciado');
    try {
      const key = process.env.COINSTATS_API_KEY;
      // cada fetch isolado com retry
      const dominance = await withRetry(() => fetchDominance(key));
      const metrics  = await withRetry(() => fetchMetrics(key));
      const fearGreed = await withRetry(() => fetchFearGreed(key));

      await pool.query(
        `INSERT INTO coinstats_metrics
           (captured_at, dominance, market_cap, volume_24h, altcoin_season)
         VALUES (NOW(), $1, $2, $3, $4)`,
        [
          dominance.dominance,
          metrics.totalMarketCap,
          metrics.totalVolume,
          fearGreed.season
        ]
      );
      logger.info('✅ Job: CoinStats gravados no DB');
    } catch (err) {
      logger.error('🚨 Job CoinStats falhou:', err);
      // aqui você pode enviar alerta (Slack, Sentry, e-mail...)
    }
  });

  // 2) Limpeza de sinais >72h (01:00 am)
  cron.schedule('0 1 * * *', async () => {
    try {
      await pool.query(
        `DELETE FROM signals WHERE captured_at < NOW() - INTERVAL '72 hours'`
      );
      logger.info('🧹 Job: sinais >72h limpos');
    } catch (err) {
      logger.error('🚨 Job limpeza sinais falhou:', err);
    }
  });

  // 3) Limpeza de usuários expirados/inativos (01:30 am)
  cron.schedule('30 1 * * *', async () => {
    try {
      await cleanExpiredTestUsers();
      await cleanOldInactiveUsers();
      logger.info('🧹 Job: usuários expirados/inativos limpos');
    } catch (err) {
      logger.error('🚨 Job limpeza usuários falhou:', err);
    }
  });

  // 4) Monitoramento de posições a cada 10 minutos
  cron.schedule('*/10 * * * *', async () => {
    logger.info('🔍 Job: monitoramento de posições iniciado');
    try {
      const { rows: users } = await pool.query(`
        SELECT u.*, s.tipo_plano, s.valor_pago, s.metodo_pagamento,
               s.data_inicio, s.data_fim
        FROM users u
        JOIN user_subscriptions s
          ON u.id = s.user_id
        WHERE s.status       = 'ativo'
          AND s.data_inicio <= NOW()
          AND s.data_fim    >= NOW()
      `);

      // roda todos em paralelo, sem interromper no primeiro erro
      const results = await Promise.allSettled(
        users.map(user => monitorUserPositions(user))
      );
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures  = results.length - successes;

      logger.info(
        `🔎 Job monitoramento: ${successes}/${users.length} usuários ok, ${failures} falhas`
      );
      if (failures > 0) {
        logger.warn('Algumas posições não foram monitoradas com sucesso.');
      }
    } catch (err) {
      logger.error('🚨 Job monitoramento falhou:', err);
    }
  });

  // 5) (Opcional) Healthcheck interno a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      await pool.query('SELECT 1'); // sanity DB
      logger.debug('❤ Job healthcheck: OK');
    } catch (err) {
      logger.error('🚨 Job healthcheck falhou:', err);
    }
  });

  logger.info('Scheduler: todos os jobs agendados');
}
