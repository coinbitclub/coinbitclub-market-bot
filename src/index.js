import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';

import webhookRouter from './routes/webhook.js';
import fetchRouter from './routes/fetch.js';
// (opcional) import apiRouter from './routes/apiRoutes.js'; // Se/quando precisar de API extra
import register from './observability/metrics.js';
import { pool } from './database.js';

// Carrega o .env principal (ajuste se quiser múltiplos arquivos .env)
dotenv.config();

/** Função utilitária para logar variáveis essenciais do ambiente */
function printEnvVars() {
  const keys = [
    'DATABASE_URL',
    'COINSTATS_API_KEY',
    'WEBHOOK_TOKEN',
    'NODE_ENV',
    'PORT'
  ];
  console.log('\n===== VARIÁVEIS DE AMBIENTE ATIVAS =====');
  keys.forEach(key => {
    // Evita mostrar tokens/senhas completos em produção
    let value = process.env[key];
    if (key.includes('KEY') || key.includes('TOKEN')) {
      value = value ? value.substring(0, 8) + '...' : '';
    }
    console.log(`${key}: ${value}`);
  });
  console.log('========================================\n');
}

const app = express();
const port = process.env.PORT || 3000;

// --- Migrations (ajuste para todas as tabelas do seu migration.sql) ---
async function runMigrations() {
  console.log('▶️  Ajustando schema e aplicando migrações…');

  // Adapte se quiser criar todas as tabelas aqui ou só garantir os 'ALTER'
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

  // ... adicione outras tabelas essenciais conforme seu migration.sql ...

  // Ajustes de colunas faltantes (idempotentes)
  await pool.query(`
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS signal_json JSONB,
      ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE dominance
      ADD COLUMN IF NOT EXISTS btc_dom NUMERIC,
      ADD COLUMN IF NOT EXISTS ema7 NUMERIC,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
  `);

  await pool.query(`
    ALTER TABLE fear_greed
      ADD COLUMN IF NOT EXISTS index_value NUMERIC,
      ADD COLUMN IF NOT EXISTS value_classification TEXT,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP,
      ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP DEFAULT NOW();
  `);

  // ... outros alters para garantir compatibilidade com migration.sql

  console.log('✅ Migrações concluídas.');
}

// --- Startup ---
async function main() {
  printEnvVars(); // LOG PRINCIPAIS VARIÁVEIS .env
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

  // Roteamento REST principal
  app.use('/webhook', webhookRouter);
  app.use('/fetch', fetchRouter);
  // app.use('/api', apiRouter); // Descomente se/quando usar

  // Endpoints utilitários
  app.get('/', (_, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
  app.get('/healthz', (_, res) => res.send('OK'));
  app.get('/metrics', async (_, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Handler de erro global
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
