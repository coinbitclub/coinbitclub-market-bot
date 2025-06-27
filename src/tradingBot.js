// src/tradingBot.js

import cron from 'node-cron';
import { handleSignal } from './services/tradingEngine.js';
import { pool } from './database.js';

/**
 * Atualiza open_trades (stub).
 */
async function fetchAndSaveOpenTrades() {
  console.log('[TradingBot] Buscando posições abertas (stub)…');
  // TODO: Implementar fetch real via bybitOrderService
}

/**
 * Garante que as tabelas/colunas necessárias existem antes de rodar o bot.
 */
async function runMigrations() {
  console.log('[TradingBot] Migrando schema…');

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
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS signal_json JSONB;
  `);
  await pool.query(`
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE positions
      ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE open_trades
      ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  console.log('[TradingBot] Migração concluída.');
}

/**
 * Loop principal do bot de trading.
 */
function startBot() {
  console.log('🤖 TradingBot iniciado');

  cron.schedule('* * * * *', async () => {
    try {
      // Busca sinais não processados
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

        // Marca como processado
        await pool.query(
          'UPDATE signals SET processed = true WHERE id = $1',
          [sig.id]
        );
      }

      await fetchAndSaveOpenTrades();
    } catch (err) {
      console.error('[TradingBot] Erro no loop:', err);
    }
  });
}

// Inicialização: roda migrações e inicia bot
runMigrations()
  .then(startBot)
  .catch(err => {
    console.error('[TradingBot] Falha na migração:', err);
    process.exit(1);
  });
