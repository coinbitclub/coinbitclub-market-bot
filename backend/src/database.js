// backend/src/index.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import basicAuth from "express-basic-auth";

import {
  ensureSignalsTable,
  ensureDominanceTable,
  ensureFearGreedTable,
  ensureMarketTable,
  ensureUsersTable,
  ensureUserCredentialsTable,
  ensureUserSubscriptionsTable,
  ensureTradesTable,
  ensureIntegrationsTable,
  ensureAffiliatesTable,
  ensureNotificationsTable,
  ensureBotLogsTable,
  ensureOpenTradesTable,
  ensurePositionsTable,
  ensureIndicatorsTable
} from "./services/dbMigrations.js";

import { pool } from "./database.js";            // ← caminho correto
import { setupScheduler } from "./services/scheduler.js";

import webhookRouter   from "./routes/webhookRoutes.js";
import fetchRouter     from "./routes/fetch.js";
import tradingRouter   from "./routes/trading.js";
import dashboardRouter from "./routes/dashboard.js";
import userRouter      from "./routes/user.js";
import adminRouter     from "./routes/admin.js";
import affiliateRouter from "./routes/affiliate.js";
import stripeRoutes, { stripeWebhookHandler } from "./routes/stripeRoutes.js";

dotenv.config();

// fallback defaults
process.env.JWT_SECRET    ||= "VictoreLais2025";
process.env.WEBHOOK_TOKEN ||= "210406";

const app  = express();
const port = process.env.PORT || 8080;

// 1) CORS global (inclui preflight)
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors());

// 2) Logger + JSON parser
app.use(morgan("combined"));
app.use(express.json({ limit: "200kb" }));

// 3) Health-check
app.get("/",      (_req, res) => res.send("🚀 Bot ativo!"));
app.get("/healthz", (_req, res) => res.send("OK"));

// 4) Stripe webhook antes do parser JSON
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json", limit: "200kb" }),
  stripeWebhookHandler
);

// 5) Migrar DB & criar tabelas extras
(async () => {
  await ensureSignalsTable();
  await ensureDominanceTable();
  await ensureFearGreedTable();
  await ensureMarketTable();
  await ensureUsersTable();
  await ensureUserCredentialsTable();
  await ensureUserSubscriptionsTable();
  await ensureTradesTable();
  await ensureIntegrationsTable();
  await ensureAffiliatesTable();
  await ensureNotificationsTable();
  await ensureBotLogsTable();
  await ensureOpenTradesTable();
  await ensurePositionsTable();
  await ensureIndicatorsTable();

  // tabelas de riscos e saques
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_risks (
      user_id     INTEGER PRIMARY KEY REFERENCES users(id),
      leverage    INTEGER NOT NULL,
      capital_pct NUMERIC NOT NULL,
      stop_pct    NUMERIC NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      amount      NUMERIC NOT NULL,
      status      VARCHAR(20) DEFAULT 'pending',
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);

  // 6) Montar rotas (ordem importa)
  app.use("/webhook",         webhookRouter);
  app.use("/api/admin",       adminRouter);
  app.use("/api/user",        userRouter);
  app.use("/api/fetch",       fetchRouter);
  app.use("/api/trading",     tradingRouter);
  app.use("/api/affiliate",   affiliateRouter);
  app.use("/api/stripe",      stripeRoutes);

  // painel de métricas protegido por basic auth
  app.use(
    "/dashboard",
    basicAuth({
      users:     { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // 7) Error handler global
  app.use((err, _req, res, _next) => {
    console.error("❌ ERRO GERAL:", err);
    res.status(err.status || 500).json({ error: err.message });
  });

  // 8) Iniciar servidor + scheduler
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();
  });
})();
