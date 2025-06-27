import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';

import webhookRouter from './routes/webhook.js';
import fetchRouter   from './routes/fetch.js';
import apiRouter     from './routes/apiRoutes.js';
import register      from './observability/metrics.js';
import { pool }      from './database.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

async function runMigrations() {
  console.log('▶️  Ajustando schema e aplicando migrações…');

  // Signals: cria tabela e coluna processed
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

  // Positions: adiciona coluna processed se não existir
  await pool.query(`
    ALTER TABLE positions
    ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  // Open trades: adiciona coluna processed se não existir
  await pool.query(`
    ALTER TABLE open_trades
    ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  console.log('✅ Migrações concluídas.');
}

async function main() {
  // Exibe variáveis de ambiente (apenas as chaves, seguro)
  console.log('🔎 ENV KEYS:', Object.keys(process.env));

  await runMigrations();

  app.use(cors());
  app.options('*', cors());

  app.use((req, res, next) => {
    console.log(`📡 Rota: ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use(morgan('combined'));
  app.use(bodyParser.json());

  app.use('/webhook', (req, res, next) => {
    if (req.method === 'POST') {
      console.log('[📥 WEBHOOK]', req.originalUrl, JSON.stringify(req.body, null, 2));
    }
    next();
  });

  app.get('/',        (_, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
  app.get('/healthz', (_, res) => res.send('OK'));
  app.get('/metrics', async (_, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use('/webhook', webhookRouter);
  app.use('/fetch',   fetchRouter);
  app.use('/api',     apiRouter);

  app.use((err, _, res, __) => {
    console.error('❌ ERRO GERAL:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });
}

main().catch(err => {
  console.error('❌ Falha ao iniciar:', err);
  process.exit(1);
});
