import express from 'express';
import { pool, getUserById, addUserMessage } from '../database.js';
import { sendWhatsApp } from '../services/whatsapp.js';

const router = express.Router();

//
// 1. MENSAGENS (degustação, push, campanhas)
//

// Dispara mensagem de fim de degustação via WhatsApp
router.post('/notificar-fim-degustacao/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const user = await getUserById(user_id);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (!user.telefone_whatsapp) return res.status(400).json({ error: 'Usuário sem telefone' });

    const mensagem = `
${user.nome ? `Olá, ${user.nome}! ` : ''}
Sua degustação com o nosso robô chegou ao fim... mas você não precisa parar por aqui! 🚀
Curtiu a experiência? Agora é hora de dar o próximo passo:
👉 [Clique aqui para ativar sua assinatura e seguir operando com o robô mais inteligente do mercado!]
Não deixe as melhores oportunidades passarem. Seu futuro de ganhos começa agora!
`;

    const respostaZAPI = await sendWhatsApp(user.telefone_whatsapp, mensagem);

    await addUserMessage(user_id, 'degustacao_expirada', mensagem);

    res.json({ ok: true, mensagem, zapi: respostaZAPI });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar mensagens por usuário
router.get('/mensagens/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { rows } = await pool.query(
      'SELECT * FROM user_messages WHERE user_id = $1 ORDER BY enviado_em DESC LIMIT 50',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todas as mensagens recentes
router.get('/mensagens', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_messages ORDER BY enviado_em DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 2. USUÁRIOS
//

// Listar usuários (com busca, filtro e paginação)
router.get('/usuarios', async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '' } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (q) {
      where = 'WHERE nome ILIKE $1 OR email ILIKE $1';
      params.push(`%${q}%`);
    }
    const query = `
      SELECT id, nome, email, telefone_whatsapp, cpf, status, is_teste, criado_em
      FROM users
      ${where}
      ORDER BY criado_em DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalhes de um usuário
router.get('/usuarios/:user_id', async (req, res) => {
  try {
    const user = await getUserById(req.params.user_id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar usuário
router.put('/usuarios/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const fields = req.body;
    const allowed = ['nome', 'email', 'telefone_whatsapp', 'cpf', 'data_nascimento', 'status'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [user_id, ...keys.map(k => fields[k])];
    const { rows } = await pool.query(
      `UPDATE users SET ${sets}, atualizado_em = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 3. ASSINATURAS/PLANOS
//

router.get('/usuarios/:user_id/assinaturas', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { rows } = await pool.query(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 ORDER BY data_inicio DESC',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 4. OPERAÇÕES/TRADES
//

router.get('/usuarios/:user_id/operacoes', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { rows } = await pool.query(
      'SELECT * FROM user_operations WHERE user_id = $1 ORDER BY opened_at DESC LIMIT 50',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 5. CREDENCIAIS (BYBIT/BINANCE)
//

// Buscar credenciais Bybit/Binance
router.get('/usuarios/:user_id/credenciais', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const bybit = await pool.query(
      'SELECT * FROM user_bybit_credentials WHERE user_id = $1', [user_id]
    );
    const binance = await pool.query(
      'SELECT * FROM user_binance_credentials WHERE user_id = $1', [user_id]
    );
    res.json({ bybit: bybit.rows, binance: binance.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar credenciais Bybit (real ou testnet)
router.put('/usuarios/:user_id/credenciais/bybit', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { api_key, api_secret, is_testnet } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO user_bybit_credentials (user_id, api_key, api_secret, is_testnet)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, is_testnet) DO UPDATE
       SET api_key = $2, api_secret = $3, atualizado_em = NOW()
       RETURNING *`,
      [user_id, api_key, api_secret, !!is_testnet]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar credenciais Binance
router.put('/usuarios/:user_id/credenciais/binance', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { api_key, api_secret } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO user_binance_credentials (user_id, api_key, api_secret)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET api_key = $2, api_secret = $3, atualizado_em = NOW()
       RETURNING *`,
      [user_id, api_key, api_secret]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 6. DASHBOARD / RELATÓRIO RESUMIDO
//

router.get('/relatorio', async (req, res) => {
  try {
    const [{ count: total_usuarios }] = (await pool.query('SELECT COUNT(*) FROM users')).rows;
    const [{ count: ativos }] = (await pool.query(`SELECT COUNT(*) FROM users WHERE status = 'ativo'`)).rows;
    const [{ count: em_teste }] = (await pool.query(`SELECT COUNT(*) FROM users WHERE is_teste = TRUE`)).rows;
    const [{ count: assinantes }] = (await pool.query(`SELECT COUNT(*) FROM user_subscriptions WHERE status = 'ativo' AND data_fim >= NOW()`)).rows;
    const [{ count: total_op }] = (await pool.query(`SELECT COUNT(*) FROM user_operations`)).rows;

    res.json({
      total_usuarios: Number(total_usuarios),
      ativos: Number(ativos),
      em_teste: Number(em_teste),
      assinantes: Number(assinantes),
      total_operacoes: Number(total_op)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 7. SAUDAÇÃO DO PAINEL
//

router.get('/', (req, res) => {
  res.send('Painel de Controle CoinbitClub – API REST pronta!');
});

export default router;
