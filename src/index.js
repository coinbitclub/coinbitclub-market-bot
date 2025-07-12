// src/index.js
import express from 'express';
import 'express-async-errors';
import 'dotenv/config';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { collectDefaultMetrics, register, Histogram } from 'prom-client';
import iconv from 'iconv-lite';

import {
  ensureUsersTable,
  ensureSignalsTable,
  ensureCointarsTable,
  ensurePositionsTable,
  ensureOperationsTable,
  ensureIndicatorsTable
} from './services/dbMigrations.js';
import { parseSignal } from './services/parseSignal.js';
import { parseDominance } from './services/parseDominance.js';
import { saveSignal, saveDominance } from './services/signalService.js';
import { setupScheduler } from './services/scheduler.js';

import adminRoutes from './routes/admin.js';
import affiliateRoutes from './routes/affiliate.js';
import authRoutes from './routes/auth.js';
import balanceRoutes from './routes/balances.js';
import dashboardRoutes from './routes/dashboard.js';
import dominanceRoutes from './routes/dominance.js';
import fearGreedRoutes from './routes/fearGreed.js';
import fetchRoutes from './routes/fetch.js';
import integrationsRoutes from './routes/integrations.js';
import marketRoutes from './routes/market.js';
import notificationsRoutes from './routes/notifications.js';
import planRoutes from './routes/planRoutes.js';
import stripeRoutes, { webhookHandler as stripeWebhookHandler } from './routes/stripeRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import tradingRoutes from './routes/trading.js';
import operationsRoutes from './routes/operations.js';
import userRoutes from './routes/user.js';
import botRoutes from './routes/botRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import aiTestRoutes from './routes/aiTestRoutes.js';

const app = express();
app.set('trust proxy', 1);

// ---- Env checks ----
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
if (!WEBHOOK_TOKEN) {
  console.error('❌ ERRO: WEBHOOK_TOKEN não definida.');
  process.exit(1);
}

// ---- CORS ----
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

// ---- Rate limiting ----
const generalLimiter = rateLimit({ windowMs: 60_000, max: 60, skip: req => req.path.startsWith('/webhook') });
const authLimiter    = rateLimit({ windowMs: 60_000, max: 10 });
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 1_000 });

app.use(generalLimiter);
app.use('/auth/login', authLimiter);
app.use(['/webhook/signal','/webhook/dominance','/stripe/webhook'], webhookLimiter);

// ---- Body parser ----
app.use(express.json({ limit: '200kb', strict: false }));

// ---- Iconv ----
iconv.aliases = iconv.aliases || {};
iconv.aliases['UTF-8'] = ['utf-8'];

// ---- Prometheus metrics ----
collectDefaultMetrics();
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method','route','code']
});
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => end({
    method: req.method,
    route: req.route?.path || req.path,
    code: res.statusCode
  }));
  next();
});

// ---- Health & docs ----
app.get('/',       (_req, res) => res.send('🚀 Bot ativo!'));
app.get(['/health','/healthz'], (_req, res) => res.send('OK'));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
const swaggerDoc = YAML.load(path.resolve('docs/swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ---- Webhook helper ----
function getWebhookToken(req) {
  if (req.query.token) return req.query.token;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

// ---- Webhook endpoints ----
app.post('/webhook/signal', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN)
    return res.status(401).json({ error: 'Token inválido' });
  if (!req.body || !Object.keys(req.body).length)
    return res.json({ ok:true, handshake:true });
  try {
    const payload = parseSignal(req.body);
    const { id } = await saveSignal(payload);
    res.json({ ok:true, id });
  } catch (err) {
    if (err.message.includes('Invalid signal'))
      return res.status(400).json({ error: err.message });
    next(err);
  }
});
app.post('/webhook/dominance', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN)
    return res.status(401).json({ error: 'Token inválido' });
  if (!req.body || !Object.keys(req.body).length)
    return res.json({ ok:true, handshake:true });
  try {
    const payload = parseDominance(req.body);
    const { id } = await saveDominance(payload);
    res.json({ ok:true, id });
  } catch (err) {
    if (err.message.includes('Invalid dominance'))
      return res.status(400).json({ error: err.message });
    next(err);
  }
});

// ---- Stripe webhook ----
app.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// ---- Main routes ----
app.use('/admin',        adminRoutes);
app.use('/affiliate',    affiliateRoutes);
app.use('/auth',         authRoutes);
app.use('/balances',     balanceRoutes);
app.use('/dashboard',    dashboardRoutes);
app.use('/dominance',    dominanceRoutes);
app.use('/feargreed',    fearGreedRoutes);
app.use('/fetch',        fetchRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/market',       marketRoutes);
app.use('/notifications',notificationsRoutes);
app.use('/plans',        planRoutes);
app.use('/stripe',       stripeRoutes);
app.use('/subscriptions',subscriptionRoutes);
app.use('/trading',      tradingRoutes);
app.use('/user',         userRoutes);
app.use('/user',         operationsRoutes);
// Bot control (start/stop/status)
app.use('/operations',   jwtMiddleware, botRoutes);
// IA routes
if (process.env.NODE_ENV === 'test') {
  app.use('/ai', aiTestRoutes);
} else {
  app.use('/ai', aiRoutes);
}

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  console.error('💥 ERRO GERAL:', err.stack || err);
  const status = err.status || (err instanceof SyntaxError ? 400 : 500);
  res.status(status).json({ error: err.message });
});

// ---- Startup (skip em test) ----
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    console.log('▶️  Iniciando migrações de DB...');
    await ensureUsersTable();      console.log('users OK');
    await ensureSignalsTable();    console.log('signals OK');
    await ensureCointarsTable();   console.log('cointars OK');
    await ensurePositionsTable();  console.log('positions OK');
    await ensureOperationsTable(); console.log('operations OK');
    await ensureIndicatorsTable(); console.log('indicators OK');
    console.log('✅ Migrações concluídas.');
    console.log('▶️  Iniciando scheduler...');
    setupScheduler();               console.log('✅ Scheduler iniciado.');
    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
  })().catch(ex => {
    console.error('❌ Startup error:', ex.stack || ex);
    process.exit(1);
  });
}

export default app;
