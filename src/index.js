// src/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import basicAuth from 'express-basic-auth';

import {
  ensureSignalsTable,
  ensureDominanceTable,
  ensureFearGreedTable,
  ensureMarketTable
} from './services/dbMigrations.js';
import { setupScheduler } from './services/scheduler.js';
import webhookRouter from './routes/webhookRoutes.js';
import fetchRouter    from './routes/fetch.js';
import tradingRouter  from './routes/trading.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();
const app  = express();
const port = process.env.PORT || 8080;

(async () => {
  // 1) Migrações
  await ensureSignalsTable();
  await ensureDominanceTable();
  await ensureFearGreedTable();
  await ensureMarketTable();

  // 2) Middlewares
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json({ limit: '200kb' }));

  // 3) Health checks
  app.get('/',    (_req, res) => res.send('🚀 Bot ativo!'));
  app.get('/healthz', (_req, res) => res.send('OK'));

  // 4) Rotas principais
  app.use('/webhook', webhookRouter);
  app.use('/api',     fetchRouter);
  app.use('/trading', tradingRouter);

  // 5) Dashboard
  app.use(
    '/dashboard',
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // 6) Error handler
  app.use((err, _req, res, _next) => {
    console.error('❌ ERRO GERAL:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  // 7) Start server + scheduler
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();  // ← chama o seu scheduler aqui
  });
})();
