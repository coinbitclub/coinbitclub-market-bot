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
const port = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// Rotas públicas
app.get('/', (req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// JWT Middleware: protege todas rotas, exceto públicas acima
app.use(jwt({
  secret: process.env.WEBHOOK_JWT_SECRET,
  algorithms: ['HS256']
}).unless({ path: ['/', '/healthz', '/metrics'] }));

// Rotas protegidas
app.use('/webhook', webhookRouter);
app.use('/fetch', fetchRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
