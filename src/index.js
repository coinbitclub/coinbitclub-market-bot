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
  console.log('??  Criando tabela signals (se não existir)...');
  await pool.query(\
    CREATE TABLE IF NOT EXISTS signals (
      id          SERIAL PRIMARY KEY,
      ticker      VARCHAR NOT NULL,
      price       NUMERIC,
      payload     JSONB NOT NULL,
      time        TIMESTAMP NOT NULL,
      captured_at TIMESTAMP DEFAULT NOW()
    );
  \);
  console.log('? Migração concluída.');
}

async function main() {
  await runMigrations();

  app.use((req, res, next) => {
    console.log('Rota requisitada:', req.method, req.originalUrl);
    next();
  });
  app.use(cors());
  app.options('*', cors());
  app.use(morgan('combined'));
  app.use(bodyParser.json());
  app.use('/webhook', (req, res, next) => {
    if (req.method === 'POST') {
      console.log(\[?? WEBHOOK] \ \\, JSON.stringify(req.body, null, 2));
    }
    next();
  });

  app.get('/',        (_req, res) => res.send('CoinbitClub Market Bot está rodando! ??'));
  app.get('/healthz', (_req, res) => res.send('OK'));
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use('/webhook', webhookRouter);
  app.use('/fetch',   fetchRouter);
  app.use('/api',     apiRouter);

  app.use((err, _req, res, _next) => {
    console.error('? ERRO GERAL:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  app.listen(port, () => {
    console.log(\?? Server running on port \\);
  });
}

main().catch(err => {
  console.error('? Falha ao iniciar servidor:', err);
  process.exit(1);
});
