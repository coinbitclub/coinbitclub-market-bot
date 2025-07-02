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
  ensureIndicatorsTable,
  ensureUserBalanceTable,
  ensureStripeUsersTable,
  ensureUserFinancialTable,
  ensureUserBalanceEventsTable,
  ensurePlansTable,
  ensureAffiliatesExtractTable
} from "./services/dbMigrations.js";

import { setupScheduler } from "./services/scheduler.js";
import webhookRouter from "./routes/webhookRoutes.js";
import fetchRouter from "./routes/fetch.js";
import tradingRouter from "./routes/trading.js";
import dashboardRouter from "./routes/dashboard.js";
import userRouter from "./routes/user.js";
import adminRouter from "./routes/admin.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import affiliateRouter from "./routes/affiliate.js";

dotenv.config();

// Defaults
process.env.JWT_SECRET    ||= "VictoreLais2025";
process.env.WEBHOOK_TOKEN ||= "210406";

// Checagem essencial
if (!process.env.DATABASE_URL) {
  console.error("? DATABASE_URL não setada!");
  process.exit(1);
}
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("? STRIPE_SECRET_KEY não setada!");
  process.exit(1);
}
if (!process.env.STRIPE_SUCCESS_URL || !process.env.STRIPE_CANCEL_URL) {
  console.warn("?? Recomenda-se definir STRIPE_SUCCESS_URL e STRIPE_CANCEL_URL no .env");
}
if (!process.env.DASHBOARD_USER || !process.env.DASHBOARD_PASS) {
  console.warn("?? DASHBOARD_USER ou DASHBOARD_PASS não setados para o painel protegido.");
}

console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("WEBHOOK_TOKEN:", process.env.WEBHOOK_TOKEN);

const app  = express();
const port = process.env.PORT || 8080;

// CORS universal
app.use(
  cors({
    origin: "*",
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"]
  })
);
app.options("*", cors());

app.use(morgan("combined"));
app.use(express.json({ limit: "500kb" }));

// Health checks
app.get("/",      (_req, res) => res.send("?? Bot ativo!"));
app.get("/healthz", (_req, res) => res.send("OK"));

// Run DB migrations & scheduler, then mount routes
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
  await ensureUserBalanceTable();
  await ensureStripeUsersTable();
  await ensureUserFinancialTable();
  await ensureUserBalanceEventsTable();
  await ensurePlansTable();
  if (typeof ensureAffiliatesExtractTable === "function") await ensureAffiliatesExtractTable();

  // Rotas principais
  app.use("/webhook",      webhookRouter);
  app.use("/api",          fetchRouter);
  app.use("/api/user",     userRouter);
  app.use("/api/admin",    adminRouter);
  app.use("/api/stripe",   stripeRoutes);
  app.use("/api/affiliate", affiliateRouter);
  app.use("/trading",      tradingRouter);

  // Dashboard (protegido)
  app.use(
    "/dashboard",
    basicAuth({
      users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASS },
      challenge: true,
    }),
    dashboardRouter
  );

  // Handler de erro global
  app.use((err, _req, res, _next) => {
    console.error("? ERRO GERAL:", err);
    res.status(err.status || 500).json({ error: err.message });
  });

  app.listen(port, () => {
    console.log(?? Server listening on port );
    setupScheduler();
  });
})();
