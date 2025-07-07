import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import 'dotenv/config';

import { runMigrations } from './services/dbMigrations.js';
import { initScheduler } from './services/scheduler.js';
import { saveSignal, saveDominance } from './services/signalService.js';
import { parseSignal } from './services/parseSignal.js';
import { parseDominance } from './services/parseDominance.js';

const app = express();
app.use(cors());
app.use(express.json());

const TOKEN = process.env.WEBHOOK_TOKEN;

// Rotas de saúde
app.get('/', (_req, res) => res.json({ ok: true }));
app.get('/healthz', (_req, res) => res.send('ok'));

// Webhook de sinal
app.post('/webhook/signal', async (req, res) => {
  const { token } = req.query;
  if (token !== TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Valida e extrai campos
    const { symbol, price, side, time } = parseSignal(req.body);
    // Persiste no DB
    const { id } = await saveSignal({ symbol, price, side, time });
    return res.json({ ok: true, id });
  } catch (err) {
    console.error('❌ ERRO GERAL:', err.stack || err);
    const status = err.statusCode || 400;
    return res.status(status).json({ error: err.message });
  }
});

// Webhook de dominância
app.post('/webhook/dominance', async (req, res) => {
  const { token } = req.query;
  if (token !== TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Valida e extrai campos
    const { btc_dom, eth_dom, time } = parseDominance(req.body);
    // Persiste no DB
    const { id } = await saveDominance({ btc_dom, eth_dom, time });
    return res.json({ ok: true, id });
  } catch (err) {
    console.error('❌ ERRO GERAL:', err.stack || err);
    const status = err.statusCode || 400;
    return res.status(status).json({ error: err.message });
  }
});

// Tratador global de erros (por via das rotas async)
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err);
  res.status(err.status || 500).json({ error: err.message });
});

const port = process.env.PORT || 8080;

;(async () => {
  console.log('🛠️ Iniciando migrações de DB…');
  await runMigrations();
  console.log('🛠️ Migrações concluídas. Iniciando servidor...');
  app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
  console.log('⏰ Scheduler iniciado.');
  initScheduler();
})();

export default app;
