// src/routes/dashboard.js
import express from 'express';
import {
  pool,
  getUserById,
  updateUser,
  addUserMessage,
  getBybitCredentials,
  getBinanceCredentials,
  saveBybitCredentials,
  saveBinanceCredentials,
  hasActiveSubscription,
  getUserOperations
} from '../database.js';
import { sendWhatsApp } from '../services/whatsapp.js';

const router = express.Router();

// 1) Notificar fim de degustação via WhatsApp
router.post('/notificar-fim-degustacao/:user_id', async (req, res, next) => {
  try {
    const userId = req.params.user_id;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const dtFim = user.data_fim_teste
      ? new Date(user.data_fim_teste).toLocaleDateString('pt-BR')
      : 'desconhecida';
    const msg = `Olá ${user.nome}, seu período de degustação terminou em ${dtFim}. Quer assinar nosso serviço?`;

    await sendWhatsApp(user.telefone_whatsapp, msg);
    await addUserMessage(user.id, 'notificacao_fim_degustacao', msg);

    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// 2) Mensagens de um usuário
router.get('/mensagens/:user_id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_messages
       WHERE user_id = $1
       ORDER BY criado_em DESC`,
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// 3) Todas as últimas 100 mensagens
router.get('/mensagens', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_messages
       ORDER BY criado_em DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// 4) Lista de usuários
router.get('/usuarios', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM users ORDER BY criado_em DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// 5) Dados de um usuário
router.get('/usuarios/:user_id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.user_id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// 6) Atualiza perfil do usuário
router.put('/usuarios/:user_id', async (req, res, next) => {
  try {
    const updated = await updateUser(req.params.user_id, req.body);
    if (!updated) return res.status(400).json({ error: 'Campos inválidos' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// 7) Verifica assinatura ativa
router.get('/usuarios/:user_id/assinaturas', async (req, res, next) => {
  try {
    const active = await hasActiveSubscription(req.params.user_id);
    res.json({ active });
  } catch (err) {
    next(err);
  }
});

// 8) Operações recentes do usuário
router.get('/usuarios/:user_id/operacoes', async (req, res, next) => {
  try {
    const ops = await getUserOperations(req.params.user_id);
    res.json(ops);
  } catch (err) {
    next(err);
  }
});

// 9) Credenciais de exchange
router.get('/usuarios/:user_id/credenciais', async (req, res, next) => {
  try {
    const bybit = await getBybitCredentials(req.params.user_id);
    const binance = await getBinanceCredentials(req.params.user_id);
    res.json({ bybit, binance });
  } catch (err) {
    next(err);
  }
});

// 10) Atualiza credenciais Bybit
router.put('/usuarios/:user_id/credenciais/bybit', async (req, res, next) => {
  try {
    const { api_key, api_secret, is_testnet } = req.body;
    const saved = await saveBybitCredentials({
      user_id: req.params.user_id,
      api_key,
      api_secret,
      is_testnet: !!is_testnet
    });
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

// 11) Atualiza credenciais Binance
router.put('/usuarios/:user_id/credenciais/binance', async (req, res, next) => {
  try {
    const { api_key, api_secret } = req.body;
    const saved = await saveBinanceCredentials({
      user_id: req.params.user_id,
      api_key,
      api_secret
    });
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

// 12) Relatório geral (contagens)
router.get('/relatorio', async (_req, res, next) => {
  try {
    const [{ count: totalUsers }]    = (await pool.query(`SELECT COUNT(*) FROM users`)).rows;
    const [{ count: totalSubs }]     = (await pool.query(`SELECT COUNT(*) FROM user_subscriptions WHERE status='ativo'`)).rows;
    const [{ count: totalOps }]      = (await pool.query(`SELECT COUNT(*) FROM user_operations`)).rows;
    const [{ count: totalMessages }] = (await pool.query(`SELECT COUNT(*) FROM user_messages`)).rows;

    res.json({
      totalUsers:    +totalUsers,
      activeSubs:    +totalSubs,
      totalOperations: +totalOps,
      totalMessages: +totalMessages
    });
  } catch (err) {
    next(err);
  }
});

// 13) Health-check do painel
router.get('/', (_req, res) => {
  res.send('Painel CoinbitClub – API REST pronta!');
});

export default router;
