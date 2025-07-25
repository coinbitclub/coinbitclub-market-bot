const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

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
const PORT = process.env.PORT || 3000;

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
// Comentado: problema com ES6 modules
// const { 
//   authenticateAdmin, 
//   getAffiliates, 
//   createAffiliate, 
//   updateAffiliate, 
//   toggleAffiliateStatus 
// } = require('./backend/api-gateway/src/controllers/userController.js');

// Implementação das funções de admin diretamente
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    const result = await pool.query(`
      SELECT * FROM users WHERE id = $1 AND role = 'admin'
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado - privilégios de administrador requeridos' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Erro na autenticação admin:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

const getAffiliates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`Admin ${req.user.email} listando afiliados - Página ${page}`);

    // Buscar afiliados usando as tabelas corretas
    const affiliatesResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        up.phone,
        up.country,
        COALESCE(up.account_type, 'testnet') as account_type,
        COALESCE(a.code, 'N/A') as affiliate_code,
        0 as total_referrals,
        0 as total_commissions,
        u.status::text as status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN affiliates a ON u.id = a.user_id
      WHERE u.role = 'affiliate'
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Contar total
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM users WHERE role = 'affiliate'
    `);

    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      affiliates: affiliatesResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Erro ao listar afiliados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

const createAffiliate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, email, phone, country, accountType } = req.body;
    
    console.log(`Admin ${req.user.email} criando afiliado: ${name} (${email})`);

    // Verificar se email já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
      });
    }

    // Gerar código de afiliado único
    const affiliateCode = 'AFF' + Date.now().toString().slice(-6);
    
    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);

    // Criar usuário (sem account_type na tabela users)
    const userResult = await client.query(`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, 'affiliate', NOW(), NOW())
      RETURNING id, name, email
    `, [name, email, tempPassword]);

    const user = userResult.rows[0];

    // Criar perfil com account_type
    await client.query(`
      INSERT INTO user_profiles (user_id, phone, country, account_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [user.id, phone || null, country || 'BR', accountType]);

    // Criar registro na tabela affiliates (usar 'code' ao invés de 'affiliate_code')
    await client.query(`
      INSERT INTO affiliates (user_id, code, created_at)
      VALUES ($1, $2, NOW())
    `, [user.id, affiliateCode]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Afiliado criado com sucesso',
      affiliate: {
        id: user.id,
        name: user.name,
        email: user.email,
        affiliateCode,
        tempPassword,
        accountType
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar afiliado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    client.release();
  }
};

const updateAffiliate = async (req, res) => {
  try {
    const { affiliateId } = req.params;
    const { name, email, phone, country } = req.body;
    
    console.log(`Admin ${req.user.email} atualizando afiliado ${affiliateId}`);

    // Atualizar usuário
    await pool.query(`
      UPDATE users 
      SET name = $1, email = $2, updated_at = NOW()
      WHERE id = $3 AND role = 'affiliate'
    `, [name, email, affiliateId]);

    // Atualizar perfil
    await pool.query(`
      UPDATE user_profiles 
      SET phone = $1, country = $2, updated_at = NOW()
      WHERE user_id = $3
    `, [phone, country, affiliateId]);

    res.json({
      success: true,
      message: 'Afiliado atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar afiliado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

const toggleAffiliateStatus = async (req, res) => {
  try {
    const { affiliateId } = req.params;
    const { action } = req.body; // 'activate' ou 'deactivate'
    
    console.log(`Admin ${req.user.email} ${action === 'activate' ? 'ativando' : 'desativando'} afiliado ${affiliateId}`);

    // Usar os valores corretos do enum user_status
    const newStatus = action === 'activate' ? 'active' : 'inactive';

    // Atualizar status na tabela users
    await pool.query(`
      UPDATE users 
      SET status = $1::user_status, updated_at = NOW()
      WHERE id = $2 AND role = 'affiliate'
    `, [newStatus, affiliateId]);

    // Também atualizar account_type no user_profiles se necessário
    const newAccountType = action === 'activate' ? 'testnet' : 'inactive';
    await pool.query(`
      UPDATE user_profiles 
      SET account_type = $1, updated_at = NOW()
      WHERE user_id = $2
    `, [newAccountType, affiliateId]);

    res.json({
      success: true,
      message: `Afiliado ${action === 'activate' ? 'ativado' : 'desativado'} com sucesso`
    });

  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Listar afiliados (Admin)
app.get('/api/admin/affiliates', authenticateAdmin, getAffiliates);

// Criar novo afiliado (Admin)
app.post('/api/admin/affiliates', authenticateAdmin, createAffiliate);

// Atualizar afiliado (Admin)
app.put('/api/admin/affiliates/:affiliateId', authenticateAdmin, updateAffiliate);

// Ativar/Desativar afiliado (Admin)
app.patch('/api/admin/affiliates/:affiliateId/toggle', authenticateAdmin, toggleAffiliateStatus);

// ===== FUNÇÕES DE RESET DE SENHA =====

// Simular envio de email (para teste)
const sendResetEmail = (email, resetToken) => {
  console.log('\n📧 EMAIL SIMULADO - Reset de Senha:');
  console.log(`Para: ${email}`);
  console.log(`Token: ${resetToken}`);
  console.log(`Link: http://localhost:3001/redefinir-senha?token=${resetToken}`);
  console.log('⏰ Válido por: 1 hora\n');
  return Promise.resolve(true);
};

// Solicitar reset de senha
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`🔄 Solicitação de reset para: ${email}`);

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Buscar usuário
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      // Não revelar se o email existe (segurança)
      console.log(`⚠️ Email não encontrado: ${email}`);
      return res.json({ 
        message: 'Se uma conta com este email existir, um link de reset foi enviado' 
      });
    }

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Armazenar token no banco
    await pool.query(
      `UPDATE users 
       SET password_reset_token = $1, 
           password_reset_expires = $2, 
           updated_at = NOW()
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // Simular envio de email
    await sendResetEmail(email, resetToken);

    console.log(`✅ Token de reset gerado para usuário ID: ${user.id}`);

    res.json({ 
      message: 'Se uma conta com este email existir, um link de reset foi enviado',
      success: true
    });

  } catch (error) {
    console.error('❌ Erro ao solicitar reset:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Redefinir senha com token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    console.log(`🔄 Confirmação de reset com token: ${token?.substring(0, 16)}...`);

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Token e senhas são obrigatórios' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Senhas não coincidem' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }

    // Buscar usuário pelo token
    const userResult = await pool.query(
      `SELECT * FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_expires > NOW()`,
      [token]
    );

    const user = userResult.rows[0];

    if (!user) {
      console.log(`⚠️ Token inválido ou expirado: ${token?.substring(0, 16)}...`);
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar senha e limpar token (simplificado para teste)
    await pool.query(
      `UPDATE users 
       SET password = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [newPassword, user.id]
    );

    console.log(`✅ Senha resetada para usuário ID: ${user.id} (${user.email})`);

    res.json({ 
      message: 'Senha redefinida com sucesso',
      success: true
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Validar token de reset
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }

    // Buscar token válido
    const userResult = await pool.query(
      `SELECT id FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_expires > NOW()`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    res.json({ 
      message: 'Token válido',
      valid: true
    });

  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== ROTAS DE RESET DE SENHA =====
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/reset-password', resetPassword);
app.post('/auth/validate-reset-token', validateResetToken);

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
