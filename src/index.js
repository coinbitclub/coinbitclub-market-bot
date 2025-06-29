import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';

// Migrações e scheduler
import {
  ensureSignalsTable,
  ensureDominanceTable,
  ensureFearGreedTable,
  ensureMarketTable
} from './services/dbMigrations.js';
import { setupScheduler } from './services/scheduler.js';

// Rotas
import webhookRouter from './routes/webhookRoutes.js';
import fetchRouter    from './routes/fetch.js';
import tradingRouter  from './routes/trading.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();
const app  = express();
const port = process.env.PORT || 8080;

(async () => {
  // 1) Cria/atualiza todas as tabelas necessárias
  await ensureSignalsTable();
  await ensureDominanceTable();
  await ensureFearGreedTable();
  await ensureMarketTable();

  // 2) Middlewares
  app.use(cors());
  app.use(morgan('combined'));
  app.use(bodyParser.json({ limit: '200kb' }));
  app.use(express.json());

  // 3) Health check
  app.get('/', (_req, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
  app.get('/healthz', (_req, res) => res.send('OK'));

  // 4) Webhooks protegidos
  app.use('/webhook', webhookRouter);

  // 5) API pública de dados
  app.use('/api', fetchRouter);

  // 6) Envio de ordens
  app.use('/trading', tradingRouter);

  // 7) Dashboard protegido por BasicAuth
  app.use(
    '/dashboard',
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // 8) Global error handler
  app.use((err, _req, res, _next) => {
    console.error('❌ ERRO GERAL:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  // 9) Start
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();
  });
})();
