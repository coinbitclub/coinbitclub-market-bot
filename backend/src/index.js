// src/index.js
import express from 'express';
import 'express-async-errors';
import 'dotenv/config';

import { pool } from './services/db.js';
import {
  ensureSignalsTable,
  ensureCointarsTable,
  ensurePositionsTable,
  ensureIndicatorsTable
} from './services/dbMigrations.js';
import parseSignal from './services/parseSignal.js';
import parseDominance from './services/parseDominance.js';
import { saveSignal, saveDominance } from './services/signalService.js';

const app = express();
app.use(express.json());

// ─── Rotas de Saúde ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  // resposta leve para root
  res.json({ message: 'OK' });
});

app.get('/healthz', (_req, res) => {
  // para readiness/liveness probes
  res.sendStatus(200);
});

// ─── Webhook de SINAL ───────────────────────────────────────────────────────────
app.post('/webhook/signal', async (req, res) => {
  // 1) valida token
  if (req.query.token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 2) valida payload
  let { symbol, price, side } = {};
  try {
    ({ symbol, price, side } = parseSignal(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // 3) grava no DB
  const id = await saveSignal(symbol, price, side);

  // 4) retorna OK + id
  return res.json({ ok: true, id });
});

// ─── Webhook de DOMINANCE ────────────────────────────────────────────────────────
app.post('/webhook/dominance', async (req, res) => {
  // 1) valida token
  if (req.query.token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 2) valida payload
  let btc_dom, eth_dom;
  try {
    ({ btc_dom, eth_dom } = parseDominance(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // 3) grava no DB
  const id = await saveDominance(btc_dom, eth_dom);

  // 4) retorna OK + id
  return res.json({ ok: true, id });
});

// ─── Tratador global de erros ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err);
  res.status(err.status || 500).json({ error: err.message });
});

// ─── Arranque: migrações + servidor ─────────────────────────────────────────────
async function main() {
  // garante que todas as tabelas existem e estão no esquema certo
  await ensureSignalsTable();
  await ensureCointarsTable();
  await ensurePositionsTable();
  await ensureIndicatorsTable();

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });
}

main();

export default app;
