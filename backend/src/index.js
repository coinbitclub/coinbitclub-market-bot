import express from "express";
import "express-async-errors";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import basicAuth from "express-basic-auth";

import webhookRouter from "./routes/webhook.js";
import stripeRoutes, { stripeWebhookHandler } from "./routes/stripeRoutes.js";
import fetchRouter from "./routes/fetch.js";
import tradingRouter from "./routes/trading.js";
import affiliateRouter from "./routes/affiliate.js";
import userRouter from "./routes/user.js";
import adminRouter from "./routes/admin.js";
import dashboardRouter from "./routes/dashboard.js";

import {
  ensureSignalsTable,
  ensureCointarsTable,
  ensurePositionsTable,
  ensureIndicatorsTable
} from "./services/dbMigrations.js";
import { setupScheduler } from "./services/scheduler.js";

dotenv.config();
// Em produção, defina NODE_ENV=production nas Vars do Railway
process.env.JWT_SECRET    ||= "VictoreLais2025";
process.env.WEBHOOK_TOKEN ||= "210406";

const app  = express();
const port = parseInt(process.env.PORT, 10) || 8080;

// CORS & logging
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors());
app.use(morgan("combined"));

// Stripe webhook (raw body)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json", limit: "200kb" }),
  stripeWebhookHandler
);

// JSON parsing + enforce Content-Type
app.use(express.json({ limit: "200kb" }));
app.use((req, res, next) => {
  if (["POST","PUT","PATCH"].includes(req.method) && !req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type deve ser application/json" });
  }
  next();
});

// Healthchecks
app.get("/",       (_req, res) => res.send("🚀 Bot ativo!"));
app.get("/healthz",(_req, res) => res.send("OK"));

// Rotas principais
app.use("/webhook",       webhookRouter);
app.use("/api/stripe",    stripeRoutes);
app.use("/api/fetch",     fetchRouter);
app.use("/api/trading",   tradingRouter);
app.use("/api/affiliate", affiliateRouter);
app.use("/api/user",      userRouter);
app.use("/api/admin",     adminRouter);

// Dashboard (Basic Auth)
app.use(
  "/dashboard",
  basicAuth({
    users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
    challenge: true
  }),
  dashboardRouter
);

// Error handler
app.use((err, _req, res, _next) => {
  console.error("❌ ERRO GERAL:", err.stack || err);
  res.status(err.status || 500).json({ error: err.message });
});

// Migrações → Servidor → Scheduler
(async () => {
  console.log("🛠️ Iniciando migrações de DB…");
  await ensureSignalsTable();     console.log("✔️ signals");
  await ensureCointarsTable();    console.log("✔️ cointars");
  await ensurePositionsTable();   console.log("✔️ positions");
  await ensureIndicatorsTable();  console.log("✔️ indicators");
  console.log("🛠️ Migrações concluídas. Iniciando servidor...");
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();
    console.log("⏰ Scheduler iniciado.");
  });
})().catch(err => {
  console.error("🔥 FALHA startup:", err.stack || err);
  process.exit(1);
});

export default app;

process.on("unhandledRejection", err =>
  console.error("❌ UNHANDLED REJECTION:", err.stack || err)
);
process.on("uncaughtException", err => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
  process.exit(1);
});
