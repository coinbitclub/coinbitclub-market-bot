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
import fetchRouter from './routes/fetch.js';
import tradingRouter from './routes/trading.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

(async () => {
  // 1) Executa migrações de banco
  await ensureSignalsTable();
  await ensureDominanceTable();
  await ensureFearGreedTable();
  await ensureMarketTable();

  // 2) Middlewares
  app.use(cors());
  app.use(morgan('combined'));  // logs HTTP
  app.use(express.json({ limit: '200kb' }));

  // 3) Health checks
  app.get('/', (_req, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
  app.get('/healthz', (_req, res) => res.send('OK'));

  // 4) Endpoints principais
  app.use('/webhook', webhookRouter);  // webhooks protegidos
  app.use('/api', fetchRouter);       // dados de mercado
  app.use('/trading', tradingRouter); // envio de ordens

  // 5) Dashboard protegido por Basic Auth
  app.use(
    '/dashboard',
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // 6) Error handler global
  app.use((err, _req, res, _next) => {
    console.error('❌ ERRO GERAL:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  // 7) Start server
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    // Inicia o scheduler após o servidor estar de pé
    setupScheduler();
  });
})();

export default app;
