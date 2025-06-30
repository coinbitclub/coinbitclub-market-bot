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

import { setupScheduler } from "./services/scheduler.js";
import webhookRouter   from "./routes/webhookRoutes.js";
import fetchRouter     from "./routes/fetch.js";
import tradingRouter   from "./routes/trading.js";
import dashboardRouter from "./routes/dashboard.js";
import userRouter      from "./routes/user.js";
import adminRouter     from "./routes/admin.js";

dotenv.config();

// fallback para variáveis críticas
const JWT_SECRET    = process.env.JWT_SECRET    || "VictoreLais2025";
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "210406";
console.log("JWT_SECRET:", JWT_SECRET);
console.log("WEBHOOK_TOKEN:", WEBHOOK_TOKEN);

const app  = express();
const port = process.env.PORT || 8080;

// ───── Middlewares globais ────────────────────────────────────────
// log de requisições
app.use(morgan("combined"));

// CORS universal + preflight
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors());

// body parser
app.use(express.json({ limit: "200kb" }));

// ───── Migrações e rotas ─────────────────────────────────────────
(async () => {
  try {
    // cria/atualiza todas as tabelas
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

    // healthchecks
    app.get("/",       (_req, res) => res.send("🚀 Bot ativo!"));
    app.get("/healthz",(_req, res) => res.send("OK"));

    // principais rotas
    app.use("/webhook",     webhookRouter);
    app.use("/api",         fetchRouter);
    app.use("/api/user",    userRouter);
    app.use("/api/admin",   adminRouter);
    app.use("/trading",     tradingRouter);

    // dashboard protegido
    app.use(
      "/dashboard",
      basicAuth({
        users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
        challenge: true
      }),
      dashboardRouter
    );

    // handler de erros genérico
    app.use((err, _req, res, _next) => {
      console.error("❌ ERRO GERAL:", err);
      res.status(err.status || 500).json({ error: err.message });
    });

    // inicia servidor + agendador
    app.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
      setupScheduler();
    });
  } catch (err) {
    console.error("❌ Erro durante migrações:", err);
    process.exit(1);
  }
})();
