import { pool } from "../database.js";
import jwt from "jsonwebtoken";

// Middleware de autenticação admin (reaproveita JWT)
export function jwtMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Token não enviado" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Você pode adicionar validação extra de permissão se quiser
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido/expirado" });
  }
}

// Login do admin (sem senha por enquanto)
export async function loginAdmin(email) {
  // Você pode ajustar para múltiplos admins ou login fixo
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token, user: { email, role: "admin" } };
}

// KPIs do sistema
export async function getKpis() {
  const total_usuarios = (await pool.query("SELECT count(*) FROM users")).rows[0].count;
  const op_abertas = (await pool.query("SELECT count(*) FROM open_trades WHERE status='aberta'")).rows[0].count;
  const assertividade = (await pool.query("SELECT avg(assertiveness) FROM trades WHERE assertiveness IS NOT NULL")).rows[0].avg || 0;
  const retorno_acumulado = (await pool.query("SELECT sum(profit) FROM trades WHERE profit IS NOT NULL")).rows[0].sum || 0;
  return {
    total_usuarios: +total_usuarios,
    op_abertas: +op_abertas,
    assertividade: +parseFloat(assertividade).toFixed(2),
    retorno_acumulado: +parseFloat(retorno_acumulado).toFixed(2)
  };
}

// Lista todos os usuários
export async function getUsers() {
  const { rows } = await pool.query("SELECT id, nome, sobrenome, email, telefone, pais, created_at FROM users");
  return rows;
}

// Reseta senha de um usuário
export async function resetUserPassword(userId) {
  // Aqui só reseta para senha default (ex: "senha123" com hash) — personalize depois
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.default.hash("senha123", 8);
  await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, userId]);
  return { ok: true, message: "Senha redefinida para senha123" };
}

// Deleta usuário
export async function deleteUser(userId) {
  await pool.query("DELETE FROM users WHERE id=$1", [userId]);
  return { ok: true };
}

// Lista assinaturas dos usuários
export async function getSubscriptions() {
  const { rows } = await pool.query("SELECT * FROM user_subscriptions ORDER BY criado_em DESC LIMIT 100");
  return rows;
}

// Logs do sistema (pode juntar bot_logs, ai_logs, openai_logs, event_logs)
export async function getLogs() {
  const logs = [];
  const bot = await pool.query("SELECT created_at, severity, message FROM bot_logs ORDER BY created_at DESC LIMIT 10");
  const ai = await pool.query("SELECT created_at, status as severity, prompt as message FROM ai_logs ORDER BY created_at DESC LIMIT 5");
  const event = await pool.query("SELECT data as created_at, acao as severity, detalhe as message FROM event_logs ORDER BY data DESC LIMIT 5");
  logs.push(...bot.rows, ...ai.rows, ...event.rows);
  logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return logs.slice(0, 14);
}

// Extrato financeiro de um usuário
export async function getUserFinance(userId) {
  const { rows } = await pool.query("SELECT * FROM user_financial WHERE user_id=$1 ORDER BY data DESC LIMIT 40", [userId]);
  return rows;
}
