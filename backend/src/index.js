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
// valores padrão caso não venha do .env
process.env.JWT_SECRET    ||= "VictoreLais2025";
process.env.WEBHOOK_TOKEN ||= "210406";

const app  = express();
const port = process.env.PORT || 8080;

// 1) CORS universal em **todas** as rotas, incluindo preflight
app.use(
  cors({
    origin: "*",
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"]
  })
);
app.options("*", cors());

// 2) logging e body-parser
app.use(morgan("combined"));
app.use(express.json({ limit: "200kb" }));

// 3) health checks
app.get("/",     (_req, res) => res.send("🚀 Bot ativo!"));
app.get("/healthz", (_req, res) => res.send("OK"));

// 4) migrations e scheduler
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

  // 5) rotas da API, na ordem certa:
  app.use("/webhook", webhookRouter);

  // **adminRouter deve vir antes de fetchRouter!**
  app.use("/api/admin", adminRouter);
  app.use("/api/user",  userRouter);
  app.use("/api",       fetchRouter);

  app.use("/trading", tradingRouter);

  // dashboard protegido por basic-auth
  app.use(
    "/dashboard",
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true
    }),
    dashboardRouter
  );

  // 6) error handler genérico
  app.use((err, _req, res, _next) => {
    console.error("❌ ERRO GERAL:", err);
    res.status(err.status || 500).json({ error: err.message });
  });

  // 7) start
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    setupScheduler();
  });
})();
