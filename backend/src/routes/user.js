import express from "express";
import { pool } from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isUser, isAdmin } from "../middleware/auth.js";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "segredo123";

/**
 * Cadastro de usuário normal (modo trial por padrão, credenciais em testnet)
 */
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

    // Cria usuário
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, created_at, nome, sobrenome, telefone, role)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6) RETURNING id`,
      [email, password_hash, nome, sobrenome || '', telefone, 'user']
    );
    const user_id = userResult.rows[0].id;

    // Credenciais Testnet (trial)
    if (bybit_api_key && bybit_api_secret) {
      await pool.query(
        `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, is_testnet, settings)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, 'bybit', bybit_api_key, bybit_api_secret, true, JSON.stringify({})]
      );
    }
    if (binance_api_key && binance_api_secret) {
      await pool.query(
        `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, is_testnet, settings)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, 'binance', binance_api_key, binance_api_secret, true, JSON.stringify({})]
      );
    }

    // Assinatura trial
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plano, status, is_trial, is_active, data_inicio, data_fim, valor_pago, metodo)
       VALUES ($1, 'trial', 'ativo', true, true, NOW(), NOW() + INTERVAL '7 days', 0, 'trial')`,
      [user_id]
    );

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar usuário", details: err.message });
  }
});

/**
 * Upgrade para plano de produção (após trial ou a qualquer momento)
 */
router.post("/upgrade-plan", isUser, async (req, res) => {
  const { plano, bybit_api_key, bybit_api_secret, binance_api_key, binance_api_secret } = req.body;
  const user_id = req.user.id;
  if (!plano) return res.status(400).json({ error: "Plano obrigatório" });

  try {
    await pool.query(
      `UPDATE user_subscriptions SET status='encerrado', is_active=false, data_fim=NOW() WHERE user_id=$1 AND is_trial=true AND is_active=true`,
      [user_id]
    );

    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plano, status, is_trial, is_active, data_inicio)
       VALUES ($1, $2, 'ativo', false, true, NOW())`,
      [user_id, plano]
    );

    if (bybit_api_key && bybit_api_secret) {
      await pool.query(
        `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, is_testnet, settings)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, 'bybit', bybit_api_key, bybit_api_secret, false, JSON.stringify({})]
      );
    }
    if (binance_api_key && binance_api_secret) {
      await pool.query(
        `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, is_testnet, settings)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, 'binance', binance_api_key, binance_api_secret, false, JSON.stringify({})]
      );
    }

    res.json({ status: "Plano atualizado e credenciais cadastradas!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar plano", details: err.message });
  }
});

/**
 * Cadastro de ADMIN (apenas por outro admin)
 */
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
    res.status(500).json({ error: "Erro ao cadastrar admin", details: err.message });
  }
});

/**
 * LOGIN (ambos)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Senha inválida' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role } });
});

/**
 * Rota protegida - dados do usuário logado
 */
router.get("/me", isUser, async (req, res) => {
  const user_id = req.user.id;
  try {
    const userData = await pool.query('SELECT id, nome, sobrenome, email, telefone, role, created_at FROM users WHERE id = $1', [user_id]);
    const subscriptions = await pool.query('SELECT * FROM user_subscriptions WHERE user_id = $1 ORDER BY data_inicio DESC', [user_id]);
    const credentials = await pool.query('SELECT * FROM user_credentials WHERE user_id = $1', [user_id]);
    res.json({
      user: userData.rows[0],
      subscriptions: subscriptions.rows,
      credentials: credentials.rows
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar dados do usuário", details: err.message });
  }
});

export default router;
