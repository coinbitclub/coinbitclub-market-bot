import cron from 'node-cron';
import { handleSignal } from './services/tradingEngine.js';
import { pool } from './database.js';

async function runMigrations() {
  console.log('[TradingBot] Migrando schemaâ€¦');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id           SERIAL PRIMARY KEY,
      ticker       VARCHAR NOT NULL,
      price        NUMERIC,
      signal_json  JSONB,
      time         TIMESTAMP NOT NULL,
      captured_at  TIMESTAMP DEFAULT NOW(),
      processed    BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
  await pool.query(`
    ALTER TABLE signals ADD COLUMN IF NOT EXISTS signal_json JSONB;
  `);
  await pool.query(`
    ALTER TABLE signals ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE positions ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE open_trades ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  console.log('[TradingBot] MigraÃ§Ã£o concluÃ­da.');
}

function startBot() {
  console.log('ðŸ¤– TradingBot iniciado');
  cron.schedule('* * * * *', async () => {
    try {
      const { rows: signals } = await pool.query(
        'SELECT * FROM signals WHERE processed = false ORDER BY time ASC'
      );
      for (const sig of signals) {
        await handleSignal({
          ticker: sig.ticker,
          price:  sig.price,
          time:   sig.time,
          signal_json: sig.signal_json
        });
        await pool.query(
          'UPDATE signals SET processed = true WHERE id = $1',
          [sig.id]
        );
      }
      // TODO: Adicione demais tarefas do bot aqui!
    } catch (err) {
      console.error('[TradingBot] Erro no loop:', err);
    }
  });
}

runMigrations()
  .then(startBot)
  .catch(err => {
    console.error('[TradingBot] Falha na migraÃ§Ã£o:', err);
    process.exit(1);
  });




