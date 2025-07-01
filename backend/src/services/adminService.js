import { pool } from "../database.js";
import jwt from "jsonwebtoken";
import { closeBybitOrder } from "./bybitService.js";
import { closeBinanceOrder } from "./binanceService.js";

// Middleware de autenticação admin (JWT)
export function jwtMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Token não enviado" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Validação de permissão extra opcional
    if (decoded.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido/expirado" });
  }
}

// Login do admin (por e-mail)
export async function loginAdmin(email) {
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token, user: { email, role: "admin" } };
}

// KPIs do sistema
export async function getKpis() {
  const total_usuarios = (await pool.query("SELECT count(*) FROM users")).rows[0].count;
  const op_abertas = (await pool.query("SELECT count(*) FROM open_trades WHERE status IN ('aberta','open','ativo')")).rows[0].count;
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

// Logs do sistema (bot, AI, eventos)
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

// --------- ROTINAS GLOBAIS DE OPERAÇÃO ADMIN ---------

// Pausar todos os robôs (status de todos os usuários)
export async function pauseAllBots(motivo = "Manutenção global") {
  await pool.query(
    `UPDATE users SET status = 'pausado', updated_at = NOW() WHERE status = 'ativo'`
  );
  await pool.query(
    `INSERT INTO user_balance_events (user_id, evento, descricao, criado_em)
     SELECT id, 'pausa', $1, NOW() FROM users WHERE status = 'pausado'`,
    [motivo]
  );
}

// Reativar todos os robôs
export async function reactivateAllBots(motivo = "Robôs reativados") {
  await pool.query(
    `UPDATE users SET status = 'ativo', updated_at = NOW() WHERE status = 'pausado'`
  );
  await pool.query(
    `INSERT INTO user_balance_events (user_id, evento, descricao, criado_em)
     SELECT id, 'reativacao', $1, NOW() FROM users WHERE status = 'ativo'`,
    [motivo]
  );
}

// Fechar TODAS as operações abertas no sistema (Bybit/Binance e banco)
export async function closeAllOpenTrades(motivo = "Ordem admin global") {
  const { rows: openTrades } = await pool.query(
    `SELECT id, user_id, exchange, symbol, side, qty, processed FROM open_trades WHERE status IN ('open','ativo','aberta') AND processed = false`
  );
  let totalClosed = 0;

  for (const trade of openTrades) {
    try {
      // Busca credenciais do usuário para cada trade
      const cred = await pool.query(
        `SELECT api_key, api_secret, is_testnet FROM user_credentials WHERE user_id = $1 AND exchange = $2 LIMIT 1`,
        [trade.user_id, trade.exchange]
      );
      const creds = cred.rows[0];
      // Fecha na Exchange
      if (trade.exchange === 'bybit') {
        await closeBybitOrder({
          apiKey: creds.api_key,
          apiSecret: creds.api_secret,
          isTestnet: creds.is_testnet,
          symbol: trade.symbol,
          side: trade.side,
          qty: trade.qty
        });
      } else if (trade.exchange === 'binance') {
        await closeBinanceOrder({
          apiKey: creds.api_key,
          apiSecret: creds.api_secret,
          symbol: trade.symbol,
          side: trade.side,
          qty: trade.qty,
          isTestnet: creds.is_testnet
        });
      }
      // Marca como fechada no banco
      await pool.query(
        `UPDATE open_trades SET status = 'closed', processed = true, updated_at = NOW() WHERE id = $1`, [trade.id]
      );
      // Log de fechamento
      await pool.query(
        `INSERT INTO bot_logs (created_at, severity, message, context)
         VALUES (NOW(), 'WARN', $1, $2)`,
        [`Operação ${trade.id} fechada via exchange por ordem global admin`, JSON.stringify({ tradeId: trade.id, motivo, admin: true })]
      );
      totalClosed++;
    } catch (err) {
      await pool.query(
        `INSERT INTO bot_logs (created_at, severity, message, context)
         VALUES (NOW(), 'ERROR', $1, $2)`,
        [`Erro ao fechar trade ${trade.id}: ${err.message}`, JSON.stringify({ tradeId: trade.id, motivo, admin: true })]
      );
    }
  }
  return totalClosed;
}
