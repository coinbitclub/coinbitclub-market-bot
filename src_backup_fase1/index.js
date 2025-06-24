import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Corrige __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env ANTES de qualquer outro import que usa env!
dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('DATABASE_URL NO INDEX:', process.env.DATABASE_URL);

// Agora os outros imports
import express from 'express';
import basicAuth from 'express-basic-auth';
import client from 'prom-client';
// services
import { monitorPositions } from './services/orderManager.js';
// logger
import pino from 'pino';
import pinoPretty from 'pino-pretty';

const logger = pino(
  pinoPretty({ colorize: true, translateTime: true }),
  pino.destination({ sync: false })
);

const PORT = process.env.PORT || 3000;
const DASHBOARD_USER = process.env.DASHBOARD_USER;
const DASHBOARD_PASS = process.env.DASHBOARD_PASS;
if (!DASHBOARD_USER || !DASHBOARD_PASS) {
  console.error('? DASHBOARD_USER e DASHBOARD_PASS devem estar definidos no .env');
  process.exit(1);
}

// express setup
const app = express();
app.use(express.json());

// basic auth for dashboard
app.use(
  '/dashboard',
  basicAuth({ users: { [DASHBOARD_USER]: DASHBOARD_PASS }, challenge: true }),
  express.static(path.join(__dirname, '../dashboard'))
);
app.get('/dashboard/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard', 'index.html'));
});

// prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// health-check
app.get('/healthz', (req, res) => res.send('OK'));

// TESTE: rota raiz
app.get('/', (req, res) => res.send('CoinbitClub Market Bot está rodando! ??'));

// start scheduler
monitorPositions();
setInterval(monitorPositions, 60 * 1000);

// start server
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
