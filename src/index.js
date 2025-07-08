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

// Normaliza “UTF-8” maiúsculo
iconv.aliases = iconv.aliases || {};
iconv.aliases['UTF-8'] = ['utf-8'];

import {
  ensureSignalsTable,
  ensureCointarsTable,
  ensurePositionsTable,
  ensureIndicatorsTable,
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
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
  console.error('ERRO: PORT não definida!');
  process.exit(1);
}

// ————— WEBHOOK_TOKEN —————
if (!process.env.WEBHOOK_TOKEN) {
  console.error('ERRO: variável de ambiente WEBHOOK_TOKEN não definida.');
  process.exit(1);
}
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// ————— Segurança & CORS —————
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());

// ————— Rate Limiting —————
// Limiter geral, pulando webhooks
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/webhook'),
});
app.use(generalLimiter);

// Limiter para login
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth/login', authLimiter);

// Limiter generoso para webhooks
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/webhook/signal', '/webhook/dominance'], webhookLimiter);

// ————— Body Parser & Webhook Handshake —————
if (process.env.NODE_ENV === 'test') {
  app.use(express.json({ limit: '200kb', strict: false }));
} else {
  app.use((req, res, next) => {
    if (req.headers['content-type']) {
      req.headers['content-type'] = req.headers['content-type'].replace(
        /charset\s*=\s*"?UTF-8"?/i,
        'charset=utf-8'
      );
    }

    const isWebhook = req.method === 'POST' && req.path.startsWith('/webhook');
    const len = req.headers['content-length'];
    if (isWebhook && (!len || len === '0')) {
      req.body = {};
      return next();
    }

    express.json({ limit: '200kb', strict: false })(req, res, next);
  });
}

// ————— Métricas —————
collectDefaultMetrics();
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP',
  labelNames: ['method', 'route', 'code'],
});
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
  });
  next();
});

// ————— Health & Metrics —————
app.get('/', (_req, res) => res.send('🚀 Bot ativo!'));
app.get(['/health', '/healthz'], (_req, res) => res.send('OK'));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ————— Swagger UI —————
const swaggerDoc = YAML.load(path.resolve('docs/swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ————— Helper para Webhook Token —————
function getWebhookToken(req) {
  if (req.query.token) return req.query.token;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

// ————— Webhook SIGNAL —————
app.post('/webhook/signal', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN) return res.status(401).json({ error: 'Token inválido' });
  if (!req.body || !Object.keys(req.body).length) {
    console.log('[webhook/signal] handshake vazio');
    return res.json({ ok: true, handshake: true });
  }
  try {
    const payload = parseSignal(req.body);
    const { id } = await saveSignal(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    if (err.message.includes('Invalid signal')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

// ————— Webhook DOMINANCE —————
app.post('/webhook/dominance', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN) return res.status(401).json({ error: 'Token inválido' });
  if (!req.body || !Object.keys(req.body).length) {
    console.log('[webhook/dominance] handshake vazio');
    return res.json({ ok: true, handshake: true });
  }
  try {
    const payload = parseDominance(req.body);
    const { id } = await saveDominance(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    if (err.message.includes('Invalid dominance')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

// ————— Autenticação JWT —————
const JWT_SECRET = process.env.JWT_SECRET || 'troque_para_uma_chave_secreta';
function ensureAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Sem token' });
  const token = auth.split(' ')[1];
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ————— Rotas de Usuário —————
app.post('/auth/register', async (req, res) => {
  const { nome, sobrenome, email, password, telefone, pais } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const sql =
    'INSERT INTO users(nome, sobrenome, email, password_hash, telefone, pais) VALUES($1,$2,$3,$4,$5,$6) RETURNING id';
  const { rows } = await pool.query(sql, [nome, sobrenome, email, hashed, telefone, pais]);
  res.status(201).json({ id: rows[0].id });
});
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  const { rows } = await pool.query('SELECT id,password_hash FROM users WHERE email=$1', [email]);
  if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});
app.get('/user/signals', ensureAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM signals WHERE user_id=$1 ORDER BY timestamp DESC',
    [req.userId]
  );
  res.json(rows);
});
app.get('/user/profile', ensureAuth, async (req, res, next) => {
  try {
    const sql = `
      SELECT id, nome AS name, sobrenome AS surname, email, telefone AS phone, pais AS country
      FROM users
      WHERE id=$1
    `;
    const { rows } = await pool.query(sql, [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ————— Erro Global —————
app.use((err, _req, res, _next) => {
  console.error('ERRO GERAL:', err.stack || err);
  const status = err.status || (err instanceof SyntaxError ? 400 : 500);
  res.status(status).json({ error: err.message });
});

// ————— Startup —————
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    console.log('Iniciando migrações de DB...');
    await ensureSignalsTable();    console.log('signals OK');
    await ensureCointarsTable();   console.log('cointars OK');
    await ensurePositionsTable();  console.log('positions OK');
    await ensureIndicatorsTable(); console.log('indicators OK');
    console.log('Migrações concluídas.');

    console.log('Iniciando scheduler...');
    setupScheduler();
    console.log('Scheduler iniciado.');

    const server = app.listen(PORT, () => console.log('Server listening on port ' + PORT));
    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })().catch(ex => {
    console.error('Startup error:', ex.stack || ex);
    process.exit(1);
  });
}

export default app;
