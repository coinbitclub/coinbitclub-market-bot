// src/index.js
import express from 'express';
import 'express-async-errors';
import 'dotenv/config';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { collectDefaultMetrics, register, Histogram } from 'prom-client';

import {
  ensureSignalsTable,
  ensureCointarsTable,
  ensurePositionsTable,
  ensureIndicatorsTable
} from './services/dbMigrations.js';
import { parseSignal } from './services/parseSignal.js';
import { parseDominance } from './services/parseDominance.js';
import { saveSignal, saveDominance } from './services/signalService.js';
import { setupScheduler } from './services/scheduler.js';

const app = express();

// Configura proxy para aceitar X-Forwarded-For (necessary on Railway)
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT) || 8080;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// ————— CORS —————
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

// ————— Rate Limiting —————
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
}));

// ————— JSON —————
app.use(express.json({ limit: '200kb' }));

// ————— Sentry & Metrics —————
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
collectDefaultMetrics();
const httpHistogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em seconds',
  labelNames: ['method', 'route', 'code']
});

// ————— Healthchecks & Metrics endpoint —————
app.get('/', (_req, res) => res.send('🚀 Bot ativo!'));
app.get('/healthz', (_req, res) => res.send('OK'));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ————— Swagger UI —————
const swaggerDocument = YAML.load(path.resolve('docs/swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Helper to extract token from query or Authorization header
function getWebhookToken(req) {
  if (req.query.token) return req.query.token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

// ————— Webhook de SINAL —————
app.post('/webhook/signal', async (req, res, next) => {
  const token = getWebhookToken(req);
  if (token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  try {
    const payload = parseSignal(req.body);
    const { id } = await saveSignal(payload);
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    if (err.message === 'Invalid signal payload') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ————— Webhook de DOMINANCE —————
app.post('/webhook/dominance', async (req, res, next) => {
  const token = getWebhookToken(req);
  if (token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  try {
    const payload = parseDominance(req.body);
    const { id } = await saveDominance(payload);
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    if (err.message === 'Invalid dominance payload') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ————— Error Handler —————
app.use(Sentry.Handlers.errorHandler());
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err);
  res.status(err.status || 500).json({ error: err.message });
});

// ————— Startup (migrations + scheduler + listen) —————
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    console.log('🛠️ Iniciando migrações de DB…');
    await ensureSignalsTable();    console.log('✔️ signals');
    await ensureCointarsTable();   console.log('✔️ cointars');
    await ensurePositionsTable();  console.log('✔️ positions');
    await ensureIndicatorsTable(); console.log('✔️ indicators');
    console.log('🛠️ Migrações concluídas.');

    console.log('⏰ Iniciando scheduler…');
    setupScheduler();
    console.log('⏰ Scheduler iniciado.');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })().catch(ex => {
    console.error('🔥 Startup error:', ex.stack || ex);
    process.exit(1);
  });
}

export default app;
