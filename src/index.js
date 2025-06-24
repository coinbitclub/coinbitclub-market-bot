import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Corrige __dirname para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("DATABASE_URL NO INDEX:", process.env.DATABASE_URL);

import express from "express";
import "dotenv/config";
import { expressjwt as jwt } from "express-jwt";
import webhookRouter from "./routes/webhook.js";
import basicAuth from "express-basic-auth";
import client from "prom-client";
import pino from "pino";
import pinoPretty from "pino-pretty";
import { monitorPositions } from "./services/orderManager.js";

const logger = pino(pinoPretty({ colorize: true, translateTime: true }), pino.destination({ sync: false }));

const PORT = process.env.PORT || 3000;
const DASHBOARD_USER = process.env.DASHBOARD_USER;
const DASHBOARD_PASS = process.env.DASHBOARD_PASS;
if (!DASHBOARD_USER || !DASHBOARD_PASS) {
  console.error("? DASHBOARD_USER e DASHBOARD_PASS devem estar definidos no .env");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use("/webhook", jwt({ secret: process.env.WEBHOOK_JWT_SECRET, algorithms: ["HS256"] }));
app.use('/webhook', webhookRouter);
app.use('/webhook', webhookRouter);
app.use('/webhook', jwt({ secret: process.env.WEBHOOK_JWT_SECRET, algorithms: ['HS256'] }));
app.use('/webhook', webhookRouter);
app.use('/webhook', webhookRouter);

// Rotas
app.use("/webhook", webhookRouter);

app.use(
  "/dashboard",
  basicAuth({ users: { [DASHBOARD_USER]: DASHBOARD_PASS }, challenge: true }),
  express.static(path.join(__dirname, "../dashboard"))
);

app.get("/dashboard/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/index.html"));
});

app.get("/", (req, res) => {
  res.send("CoinbitClub Market Bot está rodando! ??");
});

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

// Métricas Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Inicia servidor
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});
