import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';

import webhookRouter from './routes/webhook.js';
import fetchRouter   from './routes/fetch.js';
import dashboardRouter from './routes/dashboardRouter.js';
import register        from './observability/metrics.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// log de todas as rotas
app.use((req, res, next) => {
  console.log('Rota requisitada:', req.method, req.originalUrl);
  next();
});

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// log de payloads de TODOS os POSTs em /webhook
app.use('/webhook', (req, res, next) => {
  if (req.method === 'POST') {
    console.log(
      `[📥 WEBHOOK] ${req.method} ${req.originalUrl}\n`,
      JSON.stringify(req.body, null, 2)
    );
  }
  next();
});

// rotas públicas
app.get('/',       (req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// monta as rotas (a autenticação acontece **dentro** de webhookRouter)
app.use('/webhook', webhookRouter);
app.use('/fetch',   fetchRouter);
app.use('/api',     dashboardRouter);

// tratamento de erros
app.use((err, req, res, next) => {
  console.error('ERRO GERAL:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno inesperado',
    stack: err.stack    // remova em produção!
  });
});

// sobe o servidor
app.listen(port, () => {
  console.log('Server running on port', port);
});
