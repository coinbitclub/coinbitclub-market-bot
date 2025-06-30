import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const port = process.env.FRONTEND_PORT || 8090;

const BACKEND_URL = "http://localhost:8080"; // Aponta para o backend

app.use(cors());
app.use(express.json());

// Proxy de tudo que vier em /api para o backend 8080
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "/api" },
    // logLevel: "debug", // descomente para ver detalhes no terminal
  })
);

// Teste simples para saber se o frontend está ativo
app.get("/", (_req, res) => res.send("CoinbitClub Frontend API rodando! 🚀"));

app.listen(port, () => {
  console.log(`🚀 Frontend server listening on port ${port}`);
});
