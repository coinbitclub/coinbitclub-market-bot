import pg from 'pg';
const { Pool } = pg;
import cron from 'node-cron';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Limpeza dos temporários
const cleanup = async () => {
  await pool.query(`DELETE FROM signals WHERE received_at < NOW() - INTERVAL '72 hours';`);
  await pool.query(`DELETE FROM dominance WHERE created_at < NOW() - INTERVAL '72 hours';`);
  await pool.query(`DELETE FROM fear_greed WHERE created_at < NOW() - INTERVAL '72 hours';`);
  // Adapte para demais entidades...
  console.log('[Maintenance] Limpeza concluída.');
};

// Consolidação diária
const consolidate = async () => {
  await pool.query(`
    INSERT INTO signals_daily (ticker, date, avg_close, max_close, min_close)
    SELECT ticker, DATE(received_at) AS date, AVG(close), MAX(close), MIN(close)
    FROM signals
    WHERE received_at >= NOW() - INTERVAL '1 day'
    GROUP BY ticker, DATE(received_at)
    ON CONFLICT (ticker, date) DO NOTHING;
  `);
  // Repita/adapte para dominance, fear_greed etc.
  console.log('[Maintenance] Consolidação concluída.');
};

// Agendamento usando node-cron
cron.schedule('5 0 * * *', cleanup);      // Limpa todos os dias às 00h05
cron.schedule('0 0 * * *', consolidate); // Consolida todos os dias às 00h00

export { cleanup, consolidate };
