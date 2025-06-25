import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressjwt as jwt } from 'express-jwt';
import path from 'path';
import { fileURLToPath } from 'url';

import webhookRouter from './routes/webhook.js';
import fetchRouter from './routes/fetch.js';
import promClient from 'prom-client';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Para servir o index.html do dashboard
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// Health & metrics
app.get('/', (req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// JWT: protege apenas /webhook e /fetch
app.use(['/webhook', '/fetch'], jwt({
  secret: process.env.WEBHOOK_JWT_SECRET,
  algorithms: ['HS256']
}));

// Rotas protegidas
app.use('/webhook', webhookRouter);
app.use('/fetch', fetchRouter);

// Fallback para frontend SPA (dashboard)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
