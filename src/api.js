import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

// Carrega variáveis .env
dotenv.config();

// Importa conexão com banco
import { pool } from "./database.js";

// Importa rotas
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import signalsRoutes from "./routes/signals.js";
import webhookRoutes from "./routes/webhook.js";
import plansRoutes from "./routes/plans.js";
import notificationsRoutes from "./routes/notifications.js";
import integrationsRoutes from "./routes/integrations.js";

// Inicializa app
const app = express();

// Middleware universal
app.use(cors({ origin: "*"})); // Ajuste para produção se for necessário restringir origem
app.use(express.json({ limit: "200kb" }));
app.use(morgan("combined"));

// Rotas públicas (user, signals, etc)
app.use("/api/user", userRoutes);
app.use("/api/signals", signalsRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/integrations", integrationsRoutes);

// Rotas de administração (protegidas por JWT ou middleware específico dentro dos próprios arquivos)
app.use("/api/admin", adminRoutes);

// Rota healthcheck
app.get("/health", (req, res) => res.json({ status: "ok", version: process.env.npm_package_version }));

// Catch-all para rotas inexistentes
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint não encontrado." });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error("Erro geral:", err);
  res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
});

export default app;
