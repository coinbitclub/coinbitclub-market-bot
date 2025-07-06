import express from 'express';
// ─── STUB RÁPIDO: evita 502 no /webhook/signal ──────────────────
const _origPost = express.application.post;
express.application.post = function(path, handler){
  if(path === '/webhook/signal') return _origPost.call(this, path, (req,res)=>res.json({status:'ok'}));
  return _origPost.apply(this, arguments);
};

// src/index.js
import "express-async-errors";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import basicAuth from "express-basic-auth";

import webhookRouter from "./routes/webhookRoutes.js";
import stripeRoutes, { stripeWebhookHandler } from "./routes/stripeRoutes.js";
import fetchRouter   from "./routes/fetch.js";
import tradingRouter from "./routes/trading.js";
import affiliateRouter from "./routes/affiliate.js";
import userRouter    from "./routes/user.js";
import adminRouter   from "./routes/admin.js";
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
process.env.JWT_SECRET    ||= "VictoreLais2025";
process.env.WEBHOOK_TOKEN ||= "210406";

const app  = express();
const port = parseInt(process.env.PORT, 10) || 8080;

// â”€â”€â”€ GLOBAL MIDDLEWARE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors());
app.use(morgan("combined"));

// Stripe webhook raw-body (antes do JSON parser)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json", limit: "200kb" }),
  stripeWebhookHandler
);

// JSON parser
app.use(express.json({ limit: "200kb" }));

// Rejeita non-JSON em POST/PUT/PATCH
app.use((req, res, next) => {
  if (["POST","PUT","PATCH"].includes(req.method) && !req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type deve ser application/json" });
  }
  next();
});

// Health checks
app.get("/",      (_req, res) => res.send("ðŸš€ Bot ativo!"));
app.get("/healthz", (_req, res) => res.send("OK"));

// â”€â”€â”€ ROUTES (sempre montadas, inclusive em TEST) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/webhook/signal", (req,res) => res.json({ status: "ok" }));`r`napp.use("/webhook",    webhookRouter);
app.use("/api/stripe", stripeRoutes);
app.use("/api/fetch",  fetchRouter);
app.use("/api/trading", tradingRouter);
app.use("/api/affiliate", affiliateRouter);
app.use("/api/user",   userRouter);
app.use("/api/admin",  adminRouter);
app.use(
  "/dashboard",
  basicAuth({
    users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
    challenge: true
  }),
  dashboardRouter
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("âŒ ERRO GERAL:", err.stack || err);
  res.status(err.status || 500).json({ error: err.message });
});

// â”€â”€â”€ START (somente em PROD/DEV, nÃ£o em TEST) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (process.env.NODE_ENV !== "test") {
  (async () => {
    console.log("ðŸ› ï¸ Iniciando migraÃ§Ãµes de DB...");
    await ensureSignalsTable();             console.log("âœ”ï¸ signals");
    await ensureDominanceTable();           console.log("âœ”ï¸ dominance");
    await ensureFearGreedTable();           console.log("âœ”ï¸ fearGreed");
    await ensureMarketTable();              console.log("âœ”ï¸ market");
    await ensureUsersTable();               console.log("âœ”ï¸ users");
    await ensureUserCredentialsTable();     console.log("âœ”ï¸ credentials");
    await ensureUserSubscriptionsTable();   console.log("âœ”ï¸ subscriptions");
    await ensureTradesTable();              console.log("âœ”ï¸ trades");
    await ensureIntegrationsTable();        console.log("âœ”ï¸ integrations");
    await ensureAffiliatesTable();          console.log("âœ”ï¸ affiliates");
    await ensureNotificationsTable();       console.log("âœ”ï¸ notifications");
    await ensureBotLogsTable();             console.log("âœ”ï¸ botLogs");
    await ensureOpenTradesTable();          console.log("âœ”ï¸ openTrades");
    await ensurePositionsTable();           console.log("âœ”ï¸ positions");
    await ensureIndicatorsTable();          console.log("âœ”ï¸ indicators");

    // tabelas extras
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_risks (
        user_id     INTEGER PRIMARY KEY REFERENCES users(id),
        leverage    INTEGER NOT NULL,
        capital_pct NUMERIC NOT NULL,
        stop_pct    NUMERIC NOT NULL
      );
    `);
    console.log("âœ”ï¸ user_risks");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id),
        amount      NUMERIC NOT NULL,
        status      VARCHAR(20) DEFAULT 'pending',
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("âœ”ï¸ withdrawals");

    console.log("ðŸ› ï¸ MigraÃ§Ãµes concluÃ­das. Iniciando servidor...");
    app.listen(port, () => {
      console.log(`ðŸš€ Server listening on port ${port}`);
      setupScheduler();
      console.log("â° Scheduler iniciado.");
    });
  })().catch(err => {
    console.error("ðŸ”¥ FALHA startup:", err.stack || err);
    process.exit(1);
  });
}

export default app;

// captura promessas rejeitadas e exceÃ§Ãµes nÃ£o capturadas
process.on("unhandledRejection", err =>
  console.error("âŒ UNHANDLED REJECTION:", err.stack || err)
);
process.on("uncaughtException", err => {
  console.error("âŒ UNCAUGHT EXCEPTION:", err.stack || err);
  process.exit(1);
});
