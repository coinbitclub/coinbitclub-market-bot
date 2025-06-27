import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';

import webhookRouter from './routes/webhook.js';
import fetchRouter   from './routes/fetch.js';
// import apiRouter     from './routes/apiRoutes.js'; // Se/quando precisar
import register      from './observability/metrics.js';
import { pool }      from './database.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

async function runMigrations() {
  console.log('▶️  Ajustando schema e aplicando migrações…');
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
    CREATE TABLE IF NOT EXISTS dominance (
      id         SERIAL PRIMARY KEY,
      btc_dom    NUMERIC,
      ema7       NUMERIC,
      timestamp  TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fear_greed (
      id                   SERIAL PRIMARY KEY,
      index_value          NUMERIC,
      value_classification TEXT,
      timestamp            TIMESTAMP,
      captured_at          TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Migrações concluídas.');
}

async function main() {
  console.log('🔎 ENV KEYS:', Object.keys(process.env));
  await runMigrations();

  app.use(cors());
  app.options('*', cors());
  app.use(morgan('combined'));
  app.use(bodyParser.json());

  // Log payloads de webhooks recebidos
  app.use('/webhook', (req, res, next) => {
    if (req.method === 'POST') {
      console.log('[📥 WEBHOOK]', req.originalUrl, JSON.stringify(req.body, null, 2));
    }
    next();
  });

  app.use('/webhook', webhookRouter);
  app.use('/fetch',   fetchRouter);
  // app.use('/api',     apiRouter);

  app.get('/',        (_, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
  app.get('/healthz', (_, res) => res.send('OK'));
  app.get('/metrics', async (_, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use((err, req, res, next) => {
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
