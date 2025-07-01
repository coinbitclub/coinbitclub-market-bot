import { pool } from "../database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Middleware de autenticação JWT
export function jwtMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Token não enviado" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido/expirado" });
  }
}

// Cadastra novo usuário
export async function registerUser({ nome, sobrenome, email, telefone, pais, aceite_termo }) {
  const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
  if (exists.rowCount) throw new Error("E-mail já cadastrado.");
  const hash = await bcrypt.hash(email + Date.now(), 8); // senha default fake, ajuste depois
  const { rows } = await pool.query(
    `INSERT INTO users (nome, sobrenome, email, telefone, pais, password_hash, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
    [nome, sobrenome, email, telefone, pais, hash]
  );
  return { id: rows[0].id, email: rows[0].email };
}

// Login do usuário
export async function loginUser({ email }) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (!rows.length) return { status: 404, error: "Usuário não encontrado." };
  // NÃO checa senha por enquanto (ajuste depois)
  const token = jwt.sign(
    { id: rows[0].id, email: rows[0].email, nome: rows[0].nome },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { token, user: { id: rows[0].id, nome: rows[0].nome, sobrenome: rows[0].sobrenome, email: rows[0].email, telefone: rows[0].telefone, pais: rows[0].pais } };
}

// Recuperação de senha (stub)
export async function forgotPassword(email) {
  // Aqui você pode integrar um envio de e-mail ou notificação
  return { ok: true, message: "Em breve você receberá instruções no e-mail." };
}

// Consulta dados do usuário
export async function getUserById(id) {
  const { rows } = await pool.query("SELECT id, nome, sobrenome, email, telefone, pais, created_at FROM users WHERE id=$1", [id]);
  return rows[0] || null;
}

// Atualiza dados do usuário
export async function updateUser(id, data) {
  const keys = ["nome", "sobrenome", "telefone", "pais"];
  const updates = [];
  const values = [];
  keys.forEach((key, idx) => {
    if (data[key]) {
      updates.push(`${key}=$${values.length + 1}`);
      values.push(data[key]);
    }
  });
  if (!updates.length) throw new Error("Nenhum campo para atualizar.");
  values.push(id);
  await pool.query(`UPDATE users SET ${updates.join(",")}, updated_at=NOW() WHERE id=$${values.length}`);
  return { ok: true };
}

// Salva credenciais de API
export async function saveCredentials(userId, { exchange, api_key, api_secret, is_testnet }) {
  const { rows } = await pool.query(
    `INSERT INTO user_credentials (user_id, exchange, api_key, api_secret, is_testnet)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (user_id, exchange, is_testnet)
    DO UPDATE SET api_key=EXCLUDED.api_key, api_secret=EXCLUDED.api_secret
    RETURNING *`,
    [userId, exchange, api_key, api_secret, !!is_testnet]
  );
  return rows[0];
}

// Consulta operações do usuário
export async function getOperations(userId, modo) {
  let sql = `SELECT * FROM user_operations WHERE user_id=$1`;
  if (modo === "testnet") sql += ` AND exchange ~* 'testnet'`;
  if (modo === "producao") sql += ` AND exchange !~* 'testnet'`;
  sql += " ORDER BY opened_at DESC";
  const { rows } = await pool.query(sql, [userId]);
  return rows;
}

// Consulta extrato financeiro do usuário
export async function getFinance(userId) {
  const { rows } = await pool.query(`SELECT * FROM user_financial WHERE user_id=$1 ORDER BY data DESC LIMIT 40`, [userId]);
  // Calcula saldo atual:
  const saldo = rows.length ? rows[0].saldo_apos : 0;
  return { saldo, extrato: rows };
}

// Consulta assinaturas/plano do usuário
export async function getSubscriptions(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_subscriptions WHERE user_id=$1 ORDER BY criado_em DESC`, [userId]
  );
  return rows;
}

// Altera assinatura/plano do usuário
export async function changeSubscription(userId, data) {
  // Exemplo simples, expanda conforme suas regras de negócio
  const { tipo_plano, valor_pago, metodo } = data;
  await pool.query(
    `INSERT INTO user_subscriptions (user_id, tipo_plano, valor_pago, metodo, is_active, criado_em)
     VALUES ($1,$2,$3,$4,TRUE,NOW())`,
    [userId, tipo_plano, valor_pago, metodo]
  );
  return { ok: true };
}
