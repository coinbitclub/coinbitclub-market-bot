// src/index.js - versão consolidada e ajustada
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';

import { pool, getBybitCredentials, hasActiveSubscription } from './database.js';

// Rotas já existentes/importadas
import webhookRouter from './routes/webhook.js';         // Dominance e webhooks
import signalRouter from './routes/signals.js';          // Sinais TradingView
import apiRouter    from './routes/apiRoutes.js';        // API REST principal
import dashboardRouter from './routes/dashboard.js';     // Painel de controle/admin

import { setupScheduler } from './services/scheduler.js'; // Jobs agendados

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

// --- Webhooks e integrações externas ---
app.use('/webhook/signal', signalRouter);      // POST sinal TradingView
app.use('/webhook/dominance', webhookRouter);  // POST dominance CoinStats

// --- API REST público (dados de mercado, operações, etc) ---
app.use('/api', apiRouter);                    // GET market, dominance, fear_greed etc.

// --- Painel restrito (dashboard central) ---
// Aqui, autenticação básica com usuário/senha do painel
import basicAuth from 'express-basic-auth';
app.use('/dashboard', basicAuth({
  users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
  challenge: true
}), dashboardRouter);

// --- Rotas para IA (stub, para futura automação) ---
app.post('/ia/analyze', async (req, res) => {
  res.json({ result: 'Análise de IA em construção...' });
});

// --- Modo produção/teste Bybit: Rota de ordem ---
app.post('/bybit/order', async (req, res) => {
  const { user_id, symbol, qty, side, test } = req.body;

  // Checa assinatura ativa ANTES de operar
  if (!(await hasActiveSubscription(user_id))) {
    return res.status(403).json({ error: 'Usuário sem assinatura ativa' });
  }

  // Busca credenciais Bybit corretas do banco (real ou testnet)
  const creds = await getBybitCredentials(user_id, !!test);
  if (!creds) {
    return res.status(404).json({ error: 'Credenciais não encontradas para esse usuário' });
  }

  // Aqui: chamar lógica real da Bybit (com as credenciais buscadas do banco)
  // Exemplo stub:
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
