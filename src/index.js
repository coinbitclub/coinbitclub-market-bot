import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'express-jwt';
import webhookRouter from './routes/webhook.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// Middleware JWT só para /webhook/**
app.use(
  jwt({ secret: process.env.WEBHOOK_JWT_SECRET, algorithms: ['HS256'] })
    .unless({ path: ['/', '/healthz', '/metrics'] })
);

app.use('/webhook', webhookRouter);

app.get('/', (_req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (_req, res) => res.send('OK'));
app.get('/metrics', (_req, res) => res.send('# metrics here'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
