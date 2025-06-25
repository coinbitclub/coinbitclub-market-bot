import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressjwt } from 'express-jwt'; // Atenção na versão 7+ (usa { expressjwt })
import webhookRouter from './routes/webhooks.js';
import fetchRouter from './routes/fetch.js';
import promClient from 'prom-client';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// Rotas públicas
app.get('/',      (req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Protege só /webhook e /fetch com JWT
app.use(
  ['/webhook', '/fetch'],
  expressjwt({
    secret: process.env.WEBHOOK_JWT_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: true, // só permite acesso autenticado
    getToken: req => {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
      }
      return null;
    }
  })
);

// Rotas protegidas
app.use('/webhook', webhookRouter);
app.use('/fetch', fetchRouter);

// Tratamento de erro de auth JWT (401)
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`CoinbitClub Market Bot rodando na porta ${port}!`);
});
