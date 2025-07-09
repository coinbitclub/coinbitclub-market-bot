import { pool } from "../services/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Middleware de autenticação JWT
export function jwtMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Token não enviado" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Cadastra novo usuário
export async function registerUser({ nome, sobrenome, email, senha, telefone, pais, aceite_termo }) {
  const exists = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );
  if (exists.rowCount) {
    throw new Error("E-mail já cadastrado.");
  }
  const hash = await bcrypt.hash(senha, 8);
  const { rows } = await pool.query(
    `INSERT INTO users
       (nome, sobrenome, email, telefone, pais, password_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, email`,
    [nome, sobrenome, email, telefone, pais, hash]
  );
  return rows[0];
}

// Login do usuário
export async function loginUser({ email, senha }) {
  const { rows } = await pool.query(
    "SELECT id, nome, sobrenome, email, telefone, pais, password_hash, role FROM users WHERE email = $1",
    [email]
  );
  if (!rows.length) {
    return { status: 404, error: "Usuário não encontrado." };
  }
  const user = rows[0];
  const valid = await bcrypt.compare(senha, user.password_hash);
  if (!valid) {
    return { status: 401, error: "Senha incorreta." };
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  delete user.password_hash;
  return { token, user };
}

// Recuperação de senha (stub)
export async function forgotPassword(email) {
  return { ok: true, message: "Em breve você receberá instruções no seu e-mail." };
}

// Consulta dados do usuário
export async function getUserById(id) {
  console.log('[🔍 getUserById] ID recebido:', id);
  const { rows } = await pool.query(
    `SELECT id, nome, sobrenome, email, telefone, pais, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  console.log('[🧪 Resultado SELECT]', rows);
  return rows[0] || null;
}

// Atualiza dados do usuário
export async function updateUser(id, data) {
  const fields = [];
  const values = [];
  const keys = ["nome", "sobrenome", "telefone", "pais"];
  keys.forEach((key) => {
    if (data[key] !== undefined) {
      values.push(data[key]);
      fields.push(`${key} = $${values.length}`);
    }
  });
  if (!fields.length) {
    throw new Error("Nenhum campo para atualizar.");
  }
  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`;
  await pool.query(query, values);
  return { ok: true };
}

// Salva credenciais de API
export async function saveCredentials(userId, { exchange, api_key, api_secret, is_testnet }) {
  const { rows } = await pool.query(
    `INSERT INTO user_credentials
       (user_id, exchange, api_key, api_secret, is_testnet)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, exchange, is_testnet)
     DO UPDATE SET api_key = EXCLUDED.api_key,
                   api_secret = EXCLUDED.api_secret
     RETURNING *`,
    [userId, exchange, api_key, api_secret, !!is_testnet]
  );
  return rows[0];
}

// Consulta operações do usuário
export async function getOperations(userId, modo) {
  let sql = `SELECT * FROM user_operations WHERE user_id = $1`;
  if (modo === "testnet") sql += ` AND exchange ~* 'testnet'`;
  if (modo === "producao") sql += ` AND exchange !~* 'testnet'`;
  sql += ` ORDER BY opened_at DESC`;
  const { rows } = await pool.query(sql, [userId]);
  return rows;
}

// Consulta extrato financeiro do usuário
export async function getFinance(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_financial WHERE user_id = $1 ORDER BY data DESC LIMIT 40`,
    [userId]
  );
  const saldo = rows.length ? rows[0].saldo_apos : 0;
  return { saldo, extrato: rows };
}

// Consulta assinaturas/plano do usuário
export async function getSubscriptions(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_subscriptions WHERE user_id = $1 ORDER BY criado_em DESC`,
    [userId]
  );
  return rows;
}

// Altera assinatura/plano do usuário
export async function changeSubscription(userId, { tipo_plano, valor_pago, metodo }) {
  await pool.query(
    `INSERT INTO user_subscriptions
       (user_id, tipo_plano, valor_pago, metodo, is_active, criado_em)
     VALUES ($1, $2, $3, $4, TRUE, NOW())`,
    [userId, tipo_plano, valor_pago, metodo]
  );
  return { ok: true };
}

// GET/PUT riscos do usuário
export async function getRisks(userId) {
  const { rows } = await pool.query(
    `SELECT leverage, capital_pct AS "capitalPct", stop_pct AS "stopPct"
     FROM user_risks WHERE user_id = $1`,
    [userId]
  );
  return rows.length
    ? { defaults: { leverage: 3, capitalPct: 5, stopPct: 10 }, custom: rows[0] }
    : { defaults: { leverage: 3, capitalPct: 5, stopPct: 10 }, custom: null };
}

export async function updateRisks(userId, { leverage, capitalPct, stopPct }) {
  await pool.query(
    `INSERT INTO user_risks (user_id, leverage, capital_pct, stop_pct)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
     SET leverage = EXCLUDED.leverage,
         capital_pct = EXCLUDED.capital_pct,
         stop_pct = EXCLUDED.stop_pct`,
    [userId, leverage, capitalPct, stopPct]
  );
  return { ok: true };
}

// GET sinais do usuário
export async function getSignals(userId) {
  const { rows } = await pool.query(
    `SELECT id, pair, type, direction, time
     FROM signals WHERE user_id = $1 ORDER BY time DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

// POST solicitação de saque
export async function requestWithdrawal(userId, amount) {
  await pool.query(
    `INSERT INTO withdrawals (user_id, amount) VALUES ($1, $2)`,
    [userId, amount]
  );
  return { ok: true };
}

// Consulta usuário por email
export async function getUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, nome, sobrenome, email, telefone, pais, password_hash, role
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function getTradeHistory(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_operations WHERE user_id = $1 ORDER BY opened_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

// ✅ NOVA FUNÇÃO — status do usuário (assinatura ativa + saldo atual)
export async function getUserStatus(userId) {
  const assinatura = await pool.query(
    `SELECT tipo_plano, criado_em, is_active
     FROM user_subscriptions
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY criado_em DESC LIMIT 1`,
    [userId]
  );

  const financeiro = await pool.query(
    `SELECT saldo_apos
     FROM user_financial
     WHERE user_id = $1
     ORDER BY data DESC LIMIT 1`,
    [userId]
  );

  return {
    assinatura_ativa: !!assinatura.rowCount,
    plano: assinatura.rows[0]?.tipo_plano || null,
    saldo_pre_pago: financeiro.rows[0]?.saldo_apos || 0
  };
}
