import express from 'express';
import { pool } from '../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "segredo123";

/**
 * LOGIN ADMIN
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Senha inválida' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role } });
});

/**
 * KPIs do sistema
 */
router.get('/kpis', isAdmin, async (req, res) => {
  const [{ count: total_users }] = (await pool.query('SELECT COUNT(*) FROM users')).rows;
  const [{ count: active_plans }] = (await pool.query("SELECT COUNT(*) FROM user_subscriptions WHERE status='ativo'")).rows;
  const [{ sum: total_revenue }] = (await pool.query('SELECT SUM(valor_pago) FROM user_subscriptions')).rows;
  const [{ assertiveness }] = (await pool.query("SELECT AVG(assertiveness) FROM trades WHERE status='closed'")).rows;
  res.json({ total_users, active_plans, total_revenue, assertiveness, robot_status: 'ativo' });
});

/**
 * Listar usuários
 */
router.get('/users', isAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT id, nome, sobrenome, email, created_at, false as bloqueado FROM users ORDER BY id DESC');
  res.json(rows);
});

router.get('/user/:id', isAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT id, nome, sobrenome, email, created_at FROM users WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

/**
 * Bloquear/desbloquear usuário (mock)
 */
router.post('/user/:id/block', isAdmin, async (req, res) => {
  res.json({ ok: true });
});

/**
 * Resetar senha
 */
router.post('/user/:id/resetpw', isAdmin, async (req, res) => {
  const novaSenha = 'NovaSenha#2024';
  const hash = await bcrypt.hash(novaSenha, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
  res.json({ ok: true, novaSenha });
});

/**
 * Editar dados do usuário
 */
router.post('/user/:id/edit', isAdmin, async (req, res) => {
  const { nome, sobrenome, email } = req.body;
  await pool.query('UPDATE users SET nome=$1, sobrenome=$2, email=$3 WHERE id=$4', [nome, sobrenome, email, req.params.id]);
  res.json({ ok: true });
});

/**
 * Operações (trades)
 */
router.get('/operations', isAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trades ORDER BY executed_at DESC LIMIT 100');
  res.json(rows);
});

/**
 * KPIs para gráficos avançados
 */
router.get('/graphs/performance', isAdmin, async (req, res) => {
  res.json({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    profit: [520, 630, 1100, 850, 720, 1400, 1280],
    assertiveness: [67, 72, 70, 75, 78, 73, 74]
  });
});

router.get('/graphs/operations-per-day', isAdmin, async (req, res) => {
  res.json({
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    operations: [7, 14, 12, 9, 11, 16, 4]
  });
});

/**
 * Integrações
 */
router.get('/integrations', isAdmin, async (req, res) => {
  res.json([
    { id: 1, name: 'Bybit', status: 'ok' },
    { id: 2, name: 'Binance', status: 'ok' },
    { id: 3, name: 'Kiwify', status: 'ok' }
  ]);
});

/**
 * Logs do robô (mock)
 */
router.get('/logs', isAdmin, async (req, res) => {
  res.json([
    { timestamp: "2024-07-01 12:10", level: "info", message: "Ordem BUY executada BTCUSDT" },
    { timestamp: "2024-07-01 11:58", level: "warn", message: "Sinal não processado (saldo insuficiente)" }
  ]);
});

export default router;
