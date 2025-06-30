import express from "express";
import { pool } from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isUser, isAdmin } from "../middleware/auth.js";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "segredo123";

// CADASTRO DE USUÁRIO
router.post("/register", async (req, res) => {
  const {
    nome,
    sobrenome,
    email,
    telefone,
    password,
    bybit_api_key,
    bybit_api_secret,
    binance_api_key,
    binance_api_secret,
    aceite_termo
  } = req.body;

  if (!nome || !email || !telefone || !password || !aceite_termo)
    return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });

  try {
    // Checa duplicidade
    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rowCount > 0) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    // Hash seguro
    const password_hash = await bcrypt.hash(password, 10);

    // Cria usuário com role='user'
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, created_at, nome, sobrenome, telefone, role)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6) RETURNING id`,
      [email, password_hash, nome, sobrenome || '', telefone, 'user']
    );
    const user_id = userResult.rows[0].id;

    // Credenciais Bybit/Binance (igual ao seu)
    if (bybit_api_key && bybit_api_secret) {
      await pool.query(
        `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, settings)
         VALUES ($1, $2, $3, $4, $5)`,
        [user_id, 'bybit', bybit_api_key, bybit_api_secret, JSON.stringify({ testnet: true })]
      );
    }
    if (binance_api_key && binance_api_secret) {
      await pool.query(
        `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, settings)
         VALUES ($1, $2, $3, $4, $5)`,
        [user_id, 'binance', binance_api_key, binance_api_secret, JSON.stringify({ testnet: true })]
      );
    }
    // Assinatura teste
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plano, status, data_inicio, data_fim, valor_pago, metodo)
       VALUES ($1, 'teste', 'ativo', NOW(), NOW() + INTERVAL '7 days', 0, 'teste')`,
      [user_id]
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar usuário", details: err.message });
  }
});

// CADASTRO DE ADMIN (só pode admin existente criar)
router.post("/register-admin", isAdmin, async (req, res) => {
  const { nome, sobrenome, email, telefone, password } = req.body;
  if (!nome || !email || !telefone || !password)
    return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });

  try {
    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rowCount > 0) return res.status(409).json({ error: "E-mail já cadastrado" });
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (nome, sobrenome, email, telefone, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [nome, sobrenome || '', email, telefone, password_hash, 'admin']
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar admin", details: err.message });
  }
});

// LOGIN (para ambos)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Senha inválida' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role } });
});

// Rotas protegidas (exemplo)
// router.get("/me", isUser, ...);
// router.get("/users", isAdmin, ...);

export default router;
