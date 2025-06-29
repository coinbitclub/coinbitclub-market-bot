import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';

import { pool, getBybitCredentials, hasActiveSubscription } from './database.js';

// Rotas principais
import webhookRouter from './routes/webhook.js';
import signalRouter from './routes/signals.js';
import apiRouter from './routes/apiRoutes.js';
import dashboardRouter from './routes/dashboard.js';
import fetchRouter from './routes/fetch.js'; // Para buscar sinais/dominance/fear_greed
import tradingRouter from './routes/trading.js';
import webhookRoutesRouter from './routes/webhookRoutes.js';

// Agendador de jobs automáticos
import { setupScheduler } from './services/scheduler.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// --- Middlewares globais ---
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '200kb' }));

// --- Health checks ---
app.get('/', (_req, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
app.get('/healthz', (_req, res) => res.send('OK'));

// --- Rotas de integração TradingView, CoinStats, etc ---
app.use('/webhook/signal', signalRouter);      // POST sinal TradingView
app.use('/webhook/dominance', webhookRouter);  // POST dominance
app.use('/webhook', webhookRoutesRouter);      // Protegido por token/JWT para sinais/dominance/market

// --- API REST público (dados de mercado, operações, etc) ---
app.use('/api', apiRouter);                    // GET market, dominance, fear_greed etc.
app.use('/fetch', fetchRouter);                // GET signals/dominance/fear_greed

// --- Trading (execução de ordem de teste/real) ---
app.use('/trading', tradingRouter);

// --- Painel restrito (dashboard central) ---
app.use('/dashboard', basicAuth({
  users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
  challenge: true
}), dashboardRouter);

// --- IA (stub para futura automação) ---
app.post('/ia/analyze', async (req, res) => {
  res.json({ result: 'Análise de IA em construção...' });
});

// --- Ordem Bybit modo produção/teste (exemplo) ---
app.post('/bybit/order', async (req, res) => {
  const { user_id, symbol, qty, side, test } = req.body;

  if (!(await hasActiveSubscription(user_id))) {
    return res.status(403).json({ error: 'Usuário sem assinatura ativa' });
  }

  const creds = await getBybitCredentials(user_id, !!test);
  if (!creds) {
    return res.status(404).json({ error: 'Credenciais não encontradas para esse usuário' });
  }

  // Chame a execução real de ordem (via service)
  res.json({ status: 'ok', mode: test ? 'testnet' : 'production', symbol, qty, side });
});

// --- Handler de erro global ---
app.use((err, req, res, next) => {
  console.error('❌ ERRO GERAL:', err);
  res.status(err.status || 500).json({ error: err.message });
});

// --- Inicialização dos jobs e servidor ---
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  setupScheduler && setupScheduler();
});

export default app;
