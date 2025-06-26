console.log('? Iniciando CoinbitClub Bot');
console.log('   PORT:', process.env.PORT);
console.log('   WEBHOOK_JWT_SECRET:', !!process.env.WEBHOOK_JWT_SECRET);

import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressjwt as jwt } from 'express-jwt';
import webhookRouter from './routes/webhook.js';
import fetchRouter from './routes/fetch.js';
import promClient from 'prom-client';

dotenv.config();
const app = express();
import { metricsMiddleware, metricsHandler } from "./observability/metrics.js";

// Prometheus instrumentation
app.use(metricsMiddleware);
app.get("/metrics", metricsHandler);

const port = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// Diagnóstico (opcional)
app.use((req, res, next) => {
  console.log('Rota requisitada:', req.method, req.originalUrl);
  next();
});

// Rotas públicas
app.get('/', (req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// JWT Middleware: protege tudo, exceto públicas e webhooks
app.use(
  jwt({
    secret: process.env.WEBHOOK_JWT_SECRET,
    algorithms: ['HS256'],
  }).unless({
    path: [
      '/',
      '/healthz',
      '/metrics',
      { url: /^\/webhook\/signal/, methods: ['POST'] },
      { url: /^\/webhook\/dominance/, methods: ['POST'] },
      { url: /^\/webhook\/fear_greed/, methods: ['POST'] },
    ],
  })
);

// Rotas protegidas
app.use('/webhook', webhookRouter);
app.use('/fetch', fetchRouter);

// Erro global
app.use((err, req, res, next) => {
  console.error('ERRO GERAL:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno inesperado',
    stack: err.stack,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
