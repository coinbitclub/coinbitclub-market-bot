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

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './database.js';

const app = express();

// ————— Proxy Trust —————
app.set('trust proxy', 1);

// ————— PORT & Ambiente —————
const PORT = process.env.NODE_ENV === 'production'
  ? (process.env.PORT
      ? Number(process.env.PORT)
      : (() => { console.error('❌ ERRO: PORT não definida!'); process.exit(1); })())
  : (Number(process.env.PORT) || 8080);
console.log(`🛡️  Usando porta ${PORT}`);

// ————— WEBHOOK_TOKEN obrigatório —————
if (!process.env.WEBHOOK_TOKEN) {
  console.error('❌ ERRO: variável de ambiente WEBHOOK_TOKEN não definida.');
  process.exit(1);
}
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const FRONTEND_URL  = process.env.FRONTEND_URL || '*';

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

// ————— JSON Body Parser com handshake para /webhook —————
app.use((req, res, next) => {
  const isWebhookPost = req.method === 'POST' && req.path.startsWith('/webhook');
  const contentLength = req.headers['content-length'];
  // Se for POST /webhook/* e não vier body, simulamos {} e seguimos
  if (isWebhookPost && (!contentLength || contentLength === '0')) {
    req.body = {};
    return next();
  }
  // Caso contrário, parse JSON normalmente
  express.json({ limit: '200kb' })(req, res, next);
});

// ————— Sentry & Metrics —————
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
collectDefaultMetrics();
new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em seconds',
  labelNames: ['method','route','code']
});

// ————— Health & Metrics endpoints —————
app.get('/',       (_req, res) => res.send('OK'));
app.get('/healthz',(_req, res) => res.send('OK'));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ————— Swagger UI —————
const swaggerDocument = YAML.load(path.resolve('docs/swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ————— Helper: extrai token do webhook —————
function getWebhookToken(req) {
  if (req.query.token) return req.query.token;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

// ————— Webhook: SIGNAL —————
app.post('/webhook/signal', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  // handshake vazio?
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log('🤝 [webhook/signal] handshake vazio — 200');
    return res.json({ ok: true, handshake: true });
  }
  try {
    const payload = parseSignal(req.body);
    const { id } = await saveSignal(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    if (err.message.includes('Invalid signal')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ————— Webhook: DOMINANCE —————
app.post('/webhook/dominance', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log('🤝 [webhook/dominance] handshake vazio — 200');
    return res.json({ ok: true, handshake: true });
  }
  try {
    const payload = parseDominance(req.body);
    const { id } = await saveDominance(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    if (err.message.includes('Invalid dominance')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ————— Autenticação e usuários —————
const JWT_SECRET = process.env.JWT_SECRET || 'troque_para_uma_chave_secreta_forte';
function ensureAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sem token' });
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Registro de usuário
app.post('/auth/register', async (req, res) => {
  const { nome, sobrenome, email, password, telefone, pais } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users(nome,sobrenome,email,password_hash,telefone,pais)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
    [nome, sobrenome, email, hashed, telefone, pais]
  );
  res.status(201).json({ id: rows[0].id });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT id,password_hash FROM users WHERE email=$1',
    [email]
  );
  if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Sinais do usuário autenticado
app.get('/user/signals', ensureAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM signals WHERE user_id=$1 ORDER BY timestamp DESC',
    [req.userId]
  );
  res.json(rows);
});

// ————— Erro Global —————
app.use(Sentry.Handlers.errorHandler());
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err);
  const status = err.status || (err instanceof SyntaxError ? 400 : 500);
  res.status(status).json({ error: err.message });
});

// ————— Startup: Migrations + Scheduler + Listen —————
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

    const server = app.listen(PORT, () =>
      console.log(`🚀 Server listening on port ${PORT}`)
    );

    const shutdown = () => {
      console.log('📦 Shutdown signal received, closing server…');
      server.close(() => {
        console.log('✅ HTTP server closed. Exiting.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('⏱️ Forced shutdown.');
        process.exit(1);
      }, 10000).unref();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT',  shutdown);
  })().catch(ex => {
    console.error('🔥 Startup error:', ex.stack || ex);
    process.exit(1);
  });
}

export default app;
