import "express-async-errors";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import basicAuth from "express-basic-auth";

import webhookRouter from "./routes/webhookRoutes.js";
import stripeRoutes, { stripeWebhookHandler } from "./routes/stripeRoutes.js";
import fetchRouter from "./routes/fetch.js";
import tradingRouter from "./routes/trading.js";
import affiliateRouter from "./routes/affiliate.js";
import userRouter from "./routes/user.js";
import adminRouter from "./routes/admin.js";
import dashboardRouter from "./routes/dashboard.js";

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
import { pool } from "./services/db.js";
import { setupScheduler } from "./services/scheduler.js";

dotenv.config();
process.env.JWT_SECRET ||= "VictoreLais2025";
process.env.WEBHOOK_TOKEN ||= "210406";

const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;

// CORS + logger
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.options("*", cors());
app.use(morgan("combined"));

// Stripe webhook raw body (antes do JSON)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json", limit: "200kb" }),
  stripeWebhookHandler
);

// JSON parser para o resto
app.use(express.json({ limit: "200kb" }));

// recusa non-JSON em POST/PUT/PATCH
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type deve ser application/json" });
  }
  next();
});

// Health checks
app.get("/", (_req, res) => res.send("🚀 Bot ativo!"));
app.get("/healthz", (_req, res) => res.send("OK"));

// Boot: migrações, rotas, scheduler, error handler e listen
(async () => {
  console.log("🛠️ Iniciando migrações de DB...");
  await ensureSignalsTable(); console.log("✔️ signals");
  await ensureDominanceTable(); console.log("✔️ dominance");
  await ensureFearGreedTable(); console.log("✔️ fearGreed");
  await ensureMarketTable(); console.log("✔️ market");
  await ensureUsersTable(); console.log("✔️ users");
  await ensureUserCredentialsTable(); console.log("✔️ credentials");
  await ensureUserSubscriptionsTable(); console.log("✔️ subscriptions");
  await ensureTradesTable(); console.log("✔️ trades");
  await ensureIntegrationsTable(); console.log("✔️ integrations");
  await ensureAffiliatesTable(); console.log("✔️ affiliates");
  await ensureNotificationsTable(); console.log("✔️ notifications");
  await ensureBotLogsTable(); console.log("✔️ botLogs");
  await ensureOpenTradesTable(); console.log("✔️ openTrades");
  await ensurePositionsTable(); console.log("✔️ positions");
  await ensureIndicatorsTable(); console.log("✔️ indicators");

  // tabelas extras
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_risks (
      user_id     INTEGER PRIMARY KEY REFERENCES users(id),
      leverage    INTEGER NOT NULL,
      capital_pct NUMERIC NOT NULL,
      stop_pct    NUMERIC NOT NULL
    );
  `);
  console.log("✔️ user_risks");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      amount      NUMERIC NOT NULL,
      status      VARCHAR(20) DEFAULT 'pending',
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✔️ withdrawals");

  console.log("🛠️ Migrações concluídas. Configurando rotas...");
  app.use("/webhook", webhookRouter);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/fetch", fetchRouter);
  app.use("/api/trading", tradingRouter);
  app.use("/api/affiliate", affiliateRouter);
  app.use("/api/user", userRouter);
  app.use("/api/admin", adminRouter);
  app.use(
    "/dashboard",
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // middleware de erro
  app.use((err, _req, res, _next) => {
    console.error("❌ ERRO GERAL:", err.stack || err);
    res.status(err.status || 500).json({ error: err.message });
  });

  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();
    console.log("⏰ Scheduler iniciado.");
  });
})().catch(err => {
  console.error("🔥 FALHA startup:", err.stack || err);
  process.exit(1);
});

// captura promessas rejeitadas e exceções não tratadas
process.on("unhandledRejection", err => console.error("❌ UNHANDLED REJECTION:", err.stack || err));
process.on("uncaughtException", err => { console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err); process.exit(1); });
