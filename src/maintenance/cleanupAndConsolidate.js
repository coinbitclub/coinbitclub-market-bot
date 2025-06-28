import { pool } from '../database.js';
import cron from 'node-cron';
// VocÃª pode remover o dotenv, pois jÃ¡ estÃ¡ carregado no projeto principal

// Limpeza dos temporÃ¡rios
const cleanup = async () => {
  await pool.query(`DELETE FROM signals WHERE received_at < NOW() - INTERVAL '72 hours';`);
  await pool.query(`DELETE FROM dominance WHERE created_at < NOW() - INTERVAL '72 hours';`);
  await pool.query(`DELETE FROM fear_greed WHERE created_at < NOW() - INTERVAL '72 hours';`);
  console.log('[Maintenance] Limpeza concluÃ­da.');
};

// ConsolidaÃ§Ã£o diÃ¡ria
const consolidate = async () => {
  await pool.query(`
    INSERT INTO signals_daily (ticker, date, avg_close, max_close, min_close)
    SELECT ticker, DATE(received_at) AS date, AVG(close), MAX(close), MIN(close)
    FROM signals
    WHERE received_at >= NOW() - INTERVAL '1 day'
    GROUP BY ticker, DATE(received_at)
    ON CONFLICT (ticker, date) DO NOTHING;
  `);
  console.log('[Maintenance] ConsolidaÃ§Ã£o concluÃ­da.');
};

// Agendamento usando node-cron
cron.schedule('5 0 * * *', cleanup);      // Limpa todos os dias Ã s 00h05
cron.schedule('0 0 * * *', consolidate); // Consolida todos os dias Ã s 00h00

export { cleanup, consolidate };
