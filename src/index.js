// src/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';

// Migrations e scheduler
import { ensureTables } from './services/dbMigrations.js';
import { setupScheduler } from './services/scheduler.js';

// Rotas
import webhookRouter from './routes/webhookRoutes.js';
import fetchRouter from './routes/fetch.js';         // GET /api/market, /api/dominance, /api/fear_greed
import tradingRouter from './routes/trading.js';     // POST /trading/order
import dashboardRouter from './routes/dashboard.js'; // painel restrito

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

(async () => {
  // 1) Cria/ajusta todas as tabelas necessárias antes de iniciar
  await ensureTables();

  // 2) Middlewares globais
  app.use(cors());
  app.use(morgan('combined'));
  app.use(bodyParser.json({ limit: '200kb' }));
  app.use(express.json());

  // 3) Health checks
  app.get('/', (_req, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
  app.get('/healthz', (_req, res) => res.send('OK'));

  // 4) Webhook routes (POST /webhook/...) protegidas por token
  app.use('/webhook', webhookRouter);

  // 5) API pública de dados de mercado
  app.use('/api', fetchRouter);

  // 6) Envio de ordens (testnet/prod)
  app.use('/trading', tradingRouter);

  // 7) Dashboard restrito (Basic Auth)
  app.use(
    '/dashboard',
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // 8) Stub IA para evoluções futuras
  app.post('/ia/analyze', async (_req, res) => {
    res.json({ result: 'Análise de IA em construção...' });
  });

  // 9) Global error handler
  app.use((err, _req, res, _next) => {
    console.error('❌ ERRO GERAL:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  // 10) Start server + scheduler
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();
  });
})();

export default app;


// src/routes/webhookRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { parseSignal } from '../services/parseSignal.js';
import { saveSignal } from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';
import { saveFearGreed } from '../services/fearGreedService.js';
import { saveMarketPrice } from '../services/marketService.js';

const router = express.Router();
router.use(verifyToken);

// POST /webhook/signal
router.post('/signal', async (req, res, next) => {
  try {
    const signal = parseSignal(req.body);
    await saveSignal(signal);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/dominance
router.post('/dominance', async (req, res, next) => {
  try {
    await saveDominance(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/fear-greed
router.post('/fear-greed', async (req, res, next) => {
  try {
    await saveFearGreed(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/market
router.post('/market', async (req, res, next) => {
  try {
    await saveMarketPrice(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
