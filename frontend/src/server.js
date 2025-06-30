import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.FRONTEND_PORT || 8090;

// Permite requisições do Elementor ou de qualquer origem
app.use(cors());
app.use(express.json());

// Simples teste de status
app.get("/", (_req, res) => res.send("CoinbitClub Frontend API rodando! 🚀"));

// Exemplo de proxy de API para chamadas do painel (opcional)
// app.use("/api", (req, res) => { ... });

app.listen(port, () => {
  console.log(`🚀 Frontend server listening on port ${port}`);
});
