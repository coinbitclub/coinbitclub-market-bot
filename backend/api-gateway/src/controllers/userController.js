const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * User Controller Integrado ao PostgreSQL Railway
 * Sistema CoinBitClub - Área de Usuários e Afiliados
 * 
 * Este arquivo implementa todas as funcionalidades para:
 * - Área de usuários (operações, planos, configurações)
 * - Área de afiliados (gestão de indicados, comissões)
 * - Integração real com banco PostgreSQL Railway
 */

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

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Buscar dados completos do usuário
    const result = await pool.query(`
      SELECT u.*, up.country, up.phone, up.affiliate_code, up.api_keys, up.bank_details
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

// ===== AUTENTICAÇÃO E REGISTRO =====

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

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
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

    // Log do login
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'INFO',
      'Auth-Service',
      'Login realizado com sucesso',
      `Usuário ${user.email} logou no sistema como ${user.role}`,
      user.id,
      req.ip
    ]);

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

// Registro de usuário
const registerUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      name, 
      email, 
      password, 
      phone, 
      country = 'Brasil',
      affiliateCode = '',
      role = 'user'
    } = req.body;

    // Verificar se email já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

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
        user_id, country, phone, affiliate_code, 
        account_type, balance_prepaid, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      user.id, 
      country, 
      phone, 
      affiliateCode,
      'testnet', // Conta inicia em testnet
      0.00
    ]);

    // Criar registro de saldo
    await client.query(`
      INSERT INTO user_balances (
        user_id, exchange, environment, balance, balance_type, last_updated
      )
      VALUES 
        ($1, 'binance', 'testnet', 0.00, 'demo', NOW()),
        ($1, 'bybit', 'testnet', 0.00, 'demo', NOW())
    `, [user.id]);

    await client.query('COMMIT');

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Log de registro
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'INFO',
      'Auth-Service',
      'Novo usuário registrado',
      `Usuário ${email} registrado como ${role}`,
      user.id,
      req.ip
    ]);

    // Redirecionamento baseado no role
    let redirectUrl = '/user/dashboard';
    if (role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (role === 'affiliate') {
      redirectUrl = '/affiliate/dashboard';
    }

    res.status(201).json({
      success: true,
      token,
      user,
      redirectUrl
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// ===== DASHBOARD DO USUÁRIO =====

// Dashboard do usuário
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar saldos do usuário
    const balanceResult = await pool.query(`
      SELECT exchange, environment, balance, balance_type, last_updated
      FROM user_balances 
      WHERE user_id = $1
      ORDER BY exchange, environment
    `, [userId]);

    // Buscar operações recentes
    const operationsResult = await pool.query(`
      SELECT * FROM operations 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
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
    
    // Verificar saldo baixo
    const totalBalance = balanceResult.rows.reduce((sum, balance) => sum + parseFloat(balance.balance), 0);
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
      balances: balanceResult.rows,
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

// ===== OPERAÇÕES DO USUÁRIO =====

// Listar operações do usuário
const getUserOperations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      status = 'all',
      exchange = 'all',
      environment = 'all'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['user_id = $1'];
    let params = [userId];
    let paramCount = 1;

    if (status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (exchange !== 'all') {
      paramCount++;
      whereConditions.push(`exchange = $${paramCount}`);
      params.push(exchange);
    }

    if (environment !== 'all') {
      paramCount++;
      whereConditions.push(`environment = $${paramCount}`);
      params.push(environment);
    }

    const whereClause = whereConditions.join(' AND ');

    // Buscar operações
    const operationsResult = await pool.query(`
      SELECT * FROM operations 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    // Contar total
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM operations WHERE ${whereClause}
    `, params);

    res.json({
      success: true,
      operations: operationsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar operações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== PLANOS E ASSINATURAS =====

// Listar planos disponíveis
const getAvailablePlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const userCountry = req.user.country || 'Brasil';
    
    // Planos baseados no país do usuário
    const plans = userCountry === 'Brasil' ? [
      {
        id: 'prepaid_commission',
        name: 'Plano Pré-pago + Comissão',
        description: 'Mensalidade R$ 200 + 10% de comissão sobre o lucro',
        monthlyFee: 200,
        commissionRate: 0.10,
        currency: 'BRL',
        features: [
          'Sinais em tempo real',
          'Operações automatizadas',
          'Suporte premium',
          'Análises IA 24/7'
        ]
      },
      {
        id: 'commission_only',
        name: 'Plano Apenas Comissão',
        description: '20% de comissão sobre o lucro (sem mensalidade)',
        monthlyFee: 0,
        commissionRate: 0.20,
        currency: 'BRL',
        features: [
          'Sinais em tempo real',
          'Operações automatizadas',
          'Suporte padrão',
          'Análises IA'
        ]
      }
    ] : [
      {
        id: 'prepaid_commission_usd',
        name: 'Prepaid + Commission Plan',
        description: 'Monthly fee $120 + 10% commission on profit',
        monthlyFee: 120,
        commissionRate: 0.10,
        currency: 'USD',
        features: [
          'Real-time signals',
          'Automated operations',
          'Premium support',
          'AI Analysis 24/7'
        ]
      },
      {
        id: 'commission_only_usd',
        name: 'Commission Only Plan',
        description: '20% commission on profit (no monthly fee)',
        monthlyFee: 0,
        commissionRate: 0.20,
        currency: 'USD',
        features: [
          'Real-time signals',
          'Automated operations',
          'Standard support',
          'AI Analysis'
        ]
      }
    ];

    // Verificar plano atual do usuário
    const currentPlanResult = await pool.query(`
      SELECT plan_type, status, created_at FROM user_subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    res.json({
      success: true,
      plans,
      currentPlan: currentPlanResult.rows[0] || null,
      userCountry
    });

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== CONFIGURAÇÕES DO USUÁRIO =====

// Obter configurações do usuário
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const settingsResult = await pool.query(`
      SELECT 
        up.api_keys,
        up.bank_details,
        up.trading_parameters,
        up.phone,
        up.country
      FROM user_profiles up
      WHERE up.user_id = $1
    `, [userId]);

    const settings = settingsResult.rows[0] || {};

    // Parâmetros padrão de trading
    const defaultParams = {
      maxRisk: 2, // Máximo 5%
      minBalance: req.user.country === 'Brasil' ? 60 : 40,
      autoTrade: false,
      exchanges: ['binance', 'bybit'],
      leverage: 10, // Máximo 20x
      stopLoss: 2, // 2%
      takeProfit: 4 // 4%
    };

    res.json({
      success: true,
      settings: {
        apiKeys: settings.api_keys || {},
        bankDetails: settings.bank_details || {},
        tradingParameters: settings.trading_parameters || defaultParams,
        phone: settings.phone,
        country: settings.country,
        defaultParameters: defaultParams
      }
    });

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar configurações do usuário
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      apiKeys = {},
      bankDetails = {},
      tradingParameters = {},
      phone,
      cpf
    } = req.body;

    // Validar parâmetros de trading
    if (tradingParameters.maxRisk && tradingParameters.maxRisk > 5) {
      return res.status(400).json({ error: 'Risco máximo permitido: 5%' });
    }

    if (tradingParameters.leverage && tradingParameters.leverage > 20) {
      return res.status(400).json({ error: 'Alavancagem máxima permitida: 20x' });
    }

    await pool.query(`
      UPDATE user_profiles SET
        api_keys = $1,
        bank_details = $2,
        trading_parameters = $3,
        phone = $4,
        cpf = $5,
        updated_at = NOW()
      WHERE user_id = $6
    `, [
      JSON.stringify(apiKeys),
      JSON.stringify(bankDetails),
      JSON.stringify(tradingParameters),
      phone,
      cpf,
      userId
    ]);

    // Log da atualização
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'INFO',
      'User-Settings',
      'Configurações atualizadas',
      'Usuário atualizou configurações da conta',
      userId
    ]);

    res.json({ success: true, message: 'Configurações atualizadas com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== ÁREA DE AFILIADOS =====

// Dashboard do afiliado
const getAffiliateDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se é afiliado
    if (req.user.role !== 'affiliate') {
      return res.status(403).json({ error: 'Acesso negado - privilégios de afiliado requeridos' });
    }

    // Buscar código de afiliado
    const affiliateResult = await pool.query(`
      SELECT affiliate_code FROM user_profiles WHERE user_id = $1
    `, [userId]);

    let affiliateCode = affiliateResult.rows[0]?.affiliate_code;

    // Se não tiver código, gerar um
    if (!affiliateCode) {
      affiliateCode = `AFF${Date.now()}`;
      try {
        await pool.query(`
          UPDATE user_profiles SET affiliate_code = $1 WHERE user_id = $2
        `, [affiliateCode, userId]);
      } catch (updateError) {
        // Se não conseguir atualizar, usar um código temporário
        affiliateCode = `TEMP_AFF_${userId}`;
      }
    }

    // Buscar indicados
    const referralsResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.created_at,
        up.country, up.account_type,
        CASE WHEN us.status = 'active' THEN true ELSE false END as has_active_plan
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
      WHERE up.affiliate_code = $1
      ORDER BY u.created_at DESC
    `, [affiliateCode]);

    // Calcular comissões
    const commissionsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_commissions,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_commissions,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM affiliate_commissions 
      WHERE affiliate_id = $1
    `, [userId]);

    const commissions = commissionsResult.rows[0];

    // Estatísticas do afiliado
    const stats = {
      totalReferrals: referralsResult.rows.length,
      activeReferrals: referralsResult.rows.filter(r => r.has_active_plan).length,
      totalCommissions: parseFloat(commissions.paid_commissions) || 0,
      pendingCommissions: parseFloat(commissions.pending_commissions) || 0,
      paidCommissions: parseInt(commissions.paid_count) || 0,
      pendingCount: parseInt(commissions.pending_count) || 0
    };

    res.json({
      success: true,
      affiliateCode,
      referrals: referralsResult.rows,
      statistics: stats,
      commissions: commissions
    });

  } catch (error) {
    console.error('Erro no dashboard do afiliado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter comissões do afiliado
const getAffiliateCommissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    if (req.user.role !== 'affiliate') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const offset = (page - 1) * limit;
    let whereCondition = 'affiliate_id = $1';
    let params = [userId];

    if (status !== 'all') {
      whereCondition += ' AND status = $2';
      params.push(status);
    }

    const commissionsResult = await pool.query(`
      SELECT 
        ac.*,
        u.name as user_name,
        u.email as user_email
      FROM affiliate_commissions ac
      JOIN users u ON ac.user_id = u.id
      WHERE ${whereCondition}
      ORDER BY ac.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM affiliate_commissions WHERE ${whereCondition}
    `, params);

    res.json({
      success: true,
      commissions: commissionsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Solicitar pagamento de comissão
const requestCommissionPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description = 'Solicitação de pagamento de comissão' } = req.body;

    if (req.user.role !== 'affiliate') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar saldo disponível
    const balanceResult = await pool.query(`
      SELECT SUM(amount) as available_balance
      FROM affiliate_commissions 
      WHERE affiliate_id = $1 AND status = 'pending'
    `, [userId]);

    const availableBalance = parseFloat(balanceResult.rows[0].available_balance) || 0;

    if (amount > availableBalance) {
      return res.status(400).json({ 
        error: 'Valor solicitado maior que saldo disponível',
        availableBalance
      });
    }

    // Criar solicitação de pagamento
    await pool.query(`
      INSERT INTO commission_payouts (
        affiliate_id, amount, status, description, created_at
      )
      VALUES ($1, $2, 'requested', $3, NOW())
    `, [userId, amount, description]);

    // Log da solicitação
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'INFO',
      'Affiliate-Commission',
      'Solicitação de pagamento criada',
      `Afiliado solicitou pagamento de R$ ${amount}`,
      userId
    ]);

    res.json({ 
      success: true, 
      message: 'Solicitação de pagamento criada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao solicitar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== ÁREA DE ADMINISTRAÇÃO =====

// Middleware para verificar se é admin
const authenticateAdmin = async (req, res, next) => {
  try {
    // Primeiro fazer autenticação normal
    await authenticateUser(req, res, () => {});
    
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - privilégios de administrador requeridos' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Erro na autenticação de admin' });
  }
};

// Listar todos os afiliados
const getAffiliates = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = "u.role = 'affiliate'";
    let params = [];

    if (status === 'active') {
      whereCondition += " AND up.account_type != 'testnet'";
    } else if (status === 'testnet') {
      whereCondition += " AND up.account_type = 'testnet'";
    }

    const affiliatesResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.created_at,
        up.country, up.phone, up.account_type, up.affiliate_code,
        COUNT(referrals.id) as total_referrals,
        COALESCE(SUM(ac.amount), 0) as total_commissions
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_profiles referrals ON referrals.affiliate_code = up.affiliate_code
      LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = u.id AND ac.status = 'paid'
      WHERE ${whereCondition}
      GROUP BY u.id, u.name, u.email, u.created_at, up.country, up.phone, up.account_type, up.affiliate_code
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id 
      WHERE ${whereCondition}
    `, params);

    res.json({
      success: true,
      affiliates: affiliatesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar afiliados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo afiliado (Admin)
const createAffiliate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      name, 
      email, 
      password = 'affiliate123', // Senha padrão para afiliados criados pelo admin
      phone, 
      country = 'BR',
      accountType = 'testnet'
    } = req.body;

    // Verificar se email já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário como afiliado
    const userResult = await client.query(`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, 'affiliate', NOW(), NOW())
      RETURNING id, name, email, role
    `, [name, email, hashedPassword]);

    const user = userResult.rows[0];

    // Gerar código de afiliado único
    const affiliateCode = `AFF${Date.now()}${user.id.substring(0, 4)}`;

    // Criar perfil do afiliado
    await client.query(`
      INSERT INTO user_profiles (
        user_id, country, phone, account_type, 
        affiliate_code, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [
      user.id, 
      country, 
      phone, 
      accountType,
      affiliateCode
    ]);

    // Criar registro de saldo inicial
    await client.query(`
      INSERT INTO user_balances (
        user_id, exchange, environment, balance, balance_type, last_updated
      )
      VALUES 
        ($1, 'binance', 'testnet', 0.00, 'demo', NOW()),
        ($1, 'bybit', 'testnet', 0.00, 'demo', NOW())
    `, [user.id]);

    await client.query('COMMIT');

    // Log da criação
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'INFO',
      'Admin-Management',
      'Novo afiliado criado pelo admin',
      `Admin criou afiliado ${email} com código ${affiliateCode}`,
      req.user.id,
      req.ip
    ]);

    res.status(201).json({
      success: true,
      affiliate: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        affiliateCode,
        accountType,
        tempPassword: password // Retornar senha temporária para o admin informar ao afiliado
      },
      message: 'Afiliado criado com sucesso'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar afiliado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// Atualizar dados do afiliado (Admin)
const updateAffiliate = async (req, res) => {
  try {
    const { affiliateId } = req.params;
    const { name, email, phone, country, accountType, status } = req.body;

    // Verificar se o afiliado existe
    const affiliateResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'affiliate'",
      [affiliateId]
    );

    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    // Atualizar dados básicos do usuário
    await pool.query(`
      UPDATE users SET 
        name = $1, 
        email = $2, 
        updated_at = NOW()
      WHERE id = $3
    `, [name, email, affiliateId]);

    // Atualizar perfil do afiliado
    await pool.query(`
      UPDATE user_profiles SET 
        phone = $1, 
        country = $2, 
        account_type = $3,
        updated_at = NOW()
      WHERE user_id = $4
    `, [phone, country, accountType, affiliateId]);

    // Log da atualização
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'INFO',
      'Admin-Management',
      'Dados do afiliado atualizados',
      `Admin atualizou dados do afiliado ${email}`,
      req.user.id
    ]);

    res.json({ 
      success: true, 
      message: 'Dados do afiliado atualizados com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao atualizar afiliado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Desativar/Ativar afiliado (Admin)
const toggleAffiliateStatus = async (req, res) => {
  try {
    const { affiliateId } = req.params;
    const { action } = req.body; // 'activate' ou 'deactivate'

    const newStatus = action === 'activate' ? 'active' : 'inactive';

    await pool.query(`
      UPDATE user_profiles SET 
        status = $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [newStatus, affiliateId]);

    // Log da ação
    await pool.query(`
      INSERT INTO system_logs (level, service, message, details, user_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'INFO',
      'Admin-Management',
      `Afiliado ${action === 'activate' ? 'ativado' : 'desativado'}`,
      `Admin ${action === 'activate' ? 'ativou' : 'desativou'} afiliado ID: ${affiliateId}`,
      req.user.id
    ]);

    res.json({ 
      success: true, 
      message: `Afiliado ${action === 'activate' ? 'ativado' : 'desativado'} com sucesso` 
    });

  } catch (error) {
    console.error('Erro ao alterar status do afiliado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  loginUser,
  registerUser,
  getUserDashboard,
  getUserOperations,
  getAvailablePlans,
  getUserSettings,
  updateUserSettings,
  getAffiliateDashboard,
  getAffiliateCommissions,
  requestCommissionPayment,
  // Admin functions
  getAffiliates,
  createAffiliate,
  updateAffiliate,
  toggleAffiliateStatus
};
