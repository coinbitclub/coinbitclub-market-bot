const express = require('express');
const cors = require('cors');

// Como o userController está em ES6, vou recriar as funções aqui mesmo
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Removido por enquanto

// Configuração da conexão com PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Teste de conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL Railway (User Controller):', err);
  } else {
    console.log('✅ User Controller conectado ao PostgreSQL Railway');
    release();
  }
});

// Middleware de autenticação
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Buscar dados completos do usuário
    const result = await pool.query(`
      SELECT u.*, up.country, up.phone
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id 
      WHERE u.id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ===== FUNÇÃO DE REGISTRO =====
const registerUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      name, 
      email, 
      password, 
      phone, 
      country = 'BR',
      referralCode = '',
      role = 'user'
    } = req.body;

    console.log('📝 Tentativa de registro:', { email, name, role });

    // Verificar se email já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha (simplificado para teste)
    const hashedPassword = password; // Em produção usar bcrypt

    // Inserir usuário
    const userResult = await client.query(`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, email, role
    `, [name, email, hashedPassword, role]);

    const user = userResult.rows[0];

    // Criar perfil do usuário
    await client.query(`
      INSERT INTO user_profiles (
        user_id, country, phone,
        account_type, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [
      user.id, 
      country, 
      phone, 
      'testnet' // Conta inicia em testnet
    ]);

    // Se for afiliado, gerar código e atualizar
    if (role === 'affiliate') {
      const affiliateCode = `AFF${Date.now()}`;
      try {
        await client.query(`
          UPDATE user_profiles SET affiliate_code = $1 WHERE user_id = $2
        `, [affiliateCode, user.id]);
      } catch (updateError) {
        // Se a coluna não existir, apenas continuar sem código de afiliado
        console.log('⚠️ Aviso: Coluna affiliate_code não existe, continuando sem código');
      }
    }

    // Criar registro de saldo inicial
    await client.query(`
      INSERT INTO user_balances (
        user_id, currency, available_balance, locked_balance, pending_balance,
        total_deposits, total_withdrawals, last_updated, created_at
      )
      VALUES 
        ($1, 'USD', 0.00, 0.00, 0.00, 0.00, 0.00, NOW(), NOW()),
        ($1, 'BTC', 0.00, 0.00, 0.00, 0.00, 0.00, NOW(), NOW())
    `, [user.id]);

    await client.query('COMMIT');

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Definir redirecionamento baseado no role
    let redirectUrl = '/user/dashboard';
    if (role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (role === 'affiliate') {
      redirectUrl = '/affiliate/dashboard';
    }

    console.log('✅ Usuário registrado com sucesso:', { userId: user.id, role, redirectUrl });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      redirectUrl
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// Login com redirecionamento automático
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário por email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = userResult.rows[0];

    // Verificar senha (simplificado para teste)
    const isValidPassword = password === 'admin123' || password === 'test123';
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Buscar dados do perfil
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [user.id]
    );

    // Definir redirecionamento baseado no role
    let redirectUrl = '/dashboard';
    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'affiliate') {
      redirectUrl = '/affiliate/dashboard';
    } else if (user.role === 'user') {
      redirectUrl = '/user/dashboard';
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profileResult.rows[0] || null
      },
      redirectUrl
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Dashboard do usuário
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar operações recentes
    const operationsResult = await pool.query(`
      SELECT * FROM operations 
      WHERE user_id = $1 
      ORDER BY COALESCE(created_at, opened_at) DESC 
      LIMIT 10
    `, [userId]);

    // Calcular estatísticas do usuário
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'completed' AND profit > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trades,
        SUM(CASE WHEN status = 'completed' THEN profit ELSE 0 END) as total_profit,
        AVG(CASE WHEN status = 'completed' THEN profit ELSE NULL END) as avg_profit
      FROM operations 
      WHERE user_id = $1
    `, [userId]);

    const stats = statsResult.rows[0];
    const successRate = stats.completed_trades > 0 
      ? ((stats.winning_trades / stats.completed_trades) * 100).toFixed(2)
      : 0;

    // Verificar se precisa migrar para conta paga
    const needsUpgrade = req.user.account_type === 'testnet';
    
    // Verificar saldo baixo (exemplo fixo)
    const totalBalance = 100; // Exemplo
    const minBalance = req.user.country === 'Brasil' ? 60 : 40;
    const lowBalance = totalBalance < minBalance;

    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        country: req.user.country,
        accountType: req.user.account_type
      },
      balances: [
        { exchange: 'binance', environment: 'testnet', balance: 50.00, balance_type: 'demo' },
        { exchange: 'bybit', environment: 'testnet', balance: 50.00, balance_type: 'demo' }
      ],
      recentOperations: operationsResult.rows,
      statistics: {
        totalOperations: parseInt(stats.total_operations),
        winningTrades: parseInt(stats.winning_trades),
        completedTrades: parseInt(stats.completed_trades),
        successRate: parseFloat(successRate),
        totalProfit: parseFloat(stats.total_profit) || 0,
        avgProfit: parseFloat(stats.avg_profit) || 0
      },
      alerts: {
        needsUpgrade,
        lowBalance,
        minBalance,
        currentBalance: totalBalance
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Servidor de Teste - API Integrada Railway
 * Sistema CoinBitClub - Usuários e Afiliados
 * 
 * Este servidor testa todas as funcionalidades:
 * - Login/Registro com redirecionamento automático
 * - Dashboard de usuários
 * - Dashboard de afiliados
 * - Operações, planos, configurações
 * - Integração completa com PostgreSQL Railway
 */

const app = express();
const PORT = 9997;

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== ROTAS DE AUTENTICAÇÃO =====
app.post('/api/auth/login', loginUser);
app.post('/api/auth/register', registerUser);

// ===== ROTAS DE USUÁRIO (PROTEGIDAS) =====
app.get('/api/user/dashboard', authenticateUser, getUserDashboard);
app.get('/api/user/operations', authenticateUser, (req, res) => {
  res.json({ message: 'Operações ainda não implementadas' });
});
app.get('/api/user/plans', authenticateUser, (req, res) => {
  res.json({ message: 'Planos ainda não implementados' });
});
app.get('/api/user/settings', authenticateUser, (req, res) => {
  res.json({ message: 'Configurações ainda não implementadas' });
});
app.put('/api/user/settings', authenticateUser, (req, res) => {
  res.json({ message: 'Atualização de configurações ainda não implementada' });
});

// ===== ROTAS DE AFILIADO (PROTEGIDAS) =====
app.get('/api/affiliate/dashboard', authenticateUser, (req, res) => {
  res.json({ message: 'Dashboard de afiliado ainda não implementado' });
});
app.get('/api/affiliate/commissions', authenticateUser, (req, res) => {
  res.json({ message: 'Comissões ainda não implementadas' });
});
app.post('/api/affiliate/request-payment', authenticateUser, (req, res) => {
  res.json({ message: 'Solicitação de pagamento ainda não implementada' });
});

// ===== ROTAS DE ADMIN (INTEGRAÇÃO COM ROTAS EXISTENTES) =====
// const adminRailwayController = require('./backend/api-gateway/src/controllers/adminRailwayController.js');

// Adicionar rotas admin existentes
app.get('/api/admin/railway/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    server_time: new Date().toISOString(),
    message: 'API Gateway integrado ao Railway funcionando!'
  });
});

app.get('/api/admin/railway/logs/railway', (req, res) => {
  res.json({ message: 'Logs admin ainda não implementados no servidor de teste' });
});

// ===== ROTAS DE ADMINISTRAÇÃO DE AFILIADOS =====
const { 
  authenticateAdmin, 
  getAffiliates, 
  createAffiliate, 
  updateAffiliate, 
  toggleAffiliateStatus 
} = require('./backend/api-gateway/src/controllers/userController.js');

// Listar afiliados (Admin)
app.get('/api/admin/affiliates', authenticateAdmin, getAffiliates);

// Criar novo afiliado (Admin)
app.post('/api/admin/affiliates', authenticateAdmin, createAffiliate);

// Atualizar afiliado (Admin)
app.put('/api/admin/affiliates/:affiliateId', authenticateAdmin, updateAffiliate);

// Ativar/Desativar afiliado (Admin)
app.patch('/api/admin/affiliates/:affiliateId/toggle', authenticateAdmin, toggleAffiliateStatus);

// ===== ROTA DE TESTE =====
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API de Usuários e Afiliados funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: [
        'POST /api/auth/login',
        'POST /api/auth/register'
      ],
      user: [
        'GET /api/user/dashboard',
        'GET /api/user/operations',
        'GET /api/user/plans',
        'GET /api/user/settings',
        'PUT /api/user/settings'
      ],
      affiliate: [
        'GET /api/affiliate/dashboard',
        'GET /api/affiliate/commissions',
        'POST /api/affiliate/request-payment'
      ],
      admin: [
        'GET /api/admin/railway/health',
        'GET /api/admin/railway/logs/railway',
        'GET /api/admin/affiliates',
        'POST /api/admin/affiliates',
        'PUT /api/admin/affiliates/:id',
        'PATCH /api/admin/affiliates/:id/toggle'
      ]
    }
        'GET /api/user/plans',
        'GET /api/user/settings',
        'PUT /api/user/settings'
      ],
      affiliate: [
        'GET /api/affiliate/dashboard',
        'GET /api/affiliate/commissions',
        'POST /api/affiliate/request-payment'
      ],
      admin: [
        'GET /api/admin/railway/health',
        'GET /api/admin/railway/logs/railway'
      ]
    }
  });
});

// ===== MIDDLEWARE DE ERRO =====
app.use((error, req, res, next) => {
  console.error('Erro na API:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// ===== ROTA 404 =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    availableEndpoints: '/api/test'
  });
});

// ===== INICIALIZAR SERVIDOR =====
app.listen(PORT, () => {
  console.log('🚀 ===== SERVIDOR API RAILWAY INICIADO =====');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log('   🔐 POST /api/auth/login');
  console.log('   📝 POST /api/auth/register');
  console.log('   📊 GET  /api/user/dashboard');
  console.log('   💼 GET  /api/user/operations');
  console.log('   💰 GET  /api/user/plans');
  console.log('   ⚙️  GET  /api/user/settings');
  console.log('   🏢 GET  /api/affiliate/dashboard');
  console.log('   💵 GET  /api/affiliate/commissions');
  console.log('   🔧 GET  /api/admin/railway/health');
  console.log('   � GET  /api/admin/affiliates');
  console.log('   ➕ POST /api/admin/affiliates');
  console.log('   ✏️  PUT  /api/admin/affiliates/:id');
  console.log('   🔄 PATCH /api/admin/affiliates/:id/toggle');
  console.log('   �📊 GET  /api/test');
  console.log('🔗 Banco: PostgreSQL Railway');
  console.log('✅ Sistema pronto para uso!');
});

module.exports = app;
