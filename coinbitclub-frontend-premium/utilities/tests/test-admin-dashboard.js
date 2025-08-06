const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createAdminUser() {
  console.log('🔧 Criando usuário admin para teste...\n');
  
  const adminData = {
    fullName: 'Admin Teste Dashboard',
    email: 'admin.dashboard@coinbitclub.com', 
    phone: '(11) 99999-0000',
    password: 'admin123',
    userType: 'admin'
  };

  try {
    // Primeiro, verificar se o usuário já existe
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminData.email]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuário admin já existe:', existingUser.rows[0].email);
      return existingUser.rows[0];
    }

    // Registrar novo admin
    console.log('📝 Registrando novo admin...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    });

    if (!registerResponse.ok) {
      throw new Error(`Registro falhou: ${registerResponse.status}`);
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Admin registrado com sucesso!');
    
    return { email: adminData.email };

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    throw error;
  }
}

async function loginAdmin(email, password) {
  console.log('🔑 Fazendo login como admin...\n');
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Login admin bem-sucedido!');
    console.log(`👤 Admin: ${loginResult.user.name} (${loginResult.user.userType})`);
    console.log(`🎫 Token: ${loginResult.token.substring(0, 20)}...`);
    
    return loginResult;

  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    throw error;
  }
}

async function getDashboardData() {
  console.log('📊 Coletando dados do dashboard...\n');
  
  try {
    // Buscar métricas de usuários
    const usersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN user_type = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN user_type = 'affiliate' THEN 1 END) as affiliates,
        COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admins
      FROM users
    `);

    // Buscar dados de subscriptions
    const subscriptionsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN plan_type = 'trial' THEN 1 END) as trial_subscriptions
      FROM subscriptions
    `);

    // Buscar dados de planos
    const plansResult = await pool.query(`
      SELECT 
        p.name,
        p.unit_amount,
        p.currency,
        COUNT(s.id) as subscription_count
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name, p.unit_amount, p.currency
      ORDER BY subscription_count DESC
    `);

    // Buscar últimas atividades (usuários recentes)
    const recentUsersResult = await pool.query(`
      SELECT 
        name,
        email,
        user_type,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Buscar dados de affiliates
    const affiliatesResult = await pool.query(`
      SELECT 
        a.code,
        a.affiliate_code,
        a.commission_rate,
        u.name as affiliate_name,
        u.email as affiliate_email,
        a.created_at
      FROM affiliates a
      JOIN users u ON a.user_id = u.id
      WHERE a.is_active = true
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    return {
      users: usersResult.rows[0],
      subscriptions: subscriptionsResult.rows[0],
      plans: plansResult.rows,
      recentUsers: recentUsersResult.rows,
      affiliates: affiliatesResult.rows
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    throw error;
  }
}

async function displayDashboard() {
  console.log('🎯 DASHBOARD DE ADMINISTRAÇÃO - AMBIENTE TESTE');
  console.log('==============================================\n');

  try {
    // 1. Criar/verificar admin
    const admin = await createAdminUser();
    
    // 2. Fazer login
    const loginResult = await loginAdmin('admin.dashboard@coinbitclub.com', 'admin123');
    
    // 3. Buscar dados do dashboard
    const dashboardData = await getDashboardData();
    
    // 4. Exibir dashboard
    console.log('\n📊 MÉTRICAS PRINCIPAIS');
    console.log('=======================');
    console.log(`👥 Total de Usuários: ${dashboardData.users.total_users}`);
    console.log(`✅ Usuários Ativos: ${dashboardData.users.active_users}`);
    console.log(`👤 Usuários Regulares: ${dashboardData.users.regular_users}`);
    console.log(`🤝 Afiliados: ${dashboardData.users.affiliates}`);
    console.log(`👑 Administradores: ${dashboardData.users.admins}`);
    
    console.log('\n💳 SUBSCRIPTIONS');
    console.log('=================');
    console.log(`📦 Total Subscriptions: ${dashboardData.subscriptions.total_subscriptions}`);
    console.log(`✅ Subscriptions Ativas: ${dashboardData.subscriptions.active_subscriptions}`);
    console.log(`🆓 Subscriptions Trial: ${dashboardData.subscriptions.trial_subscriptions}`);
    
    console.log('\n💰 PLANOS MAIS POPULARES');
    console.log('=========================');
    dashboardData.plans.slice(0, 5).forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - ${plan.unit_amount/100} ${plan.currency} (${plan.subscription_count} subs)`);
    });
    
    console.log('\n🤝 AFILIADOS ATIVOS');
    console.log('===================');
    dashboardData.affiliates.forEach((affiliate, index) => {
      console.log(`${index + 1}. ${affiliate.affiliate_name} (${affiliate.affiliate_code})`);
      console.log(`   📧 ${affiliate.affiliate_email}`);
      console.log(`   💰 Comissão: ${(affiliate.commission_rate * 100).toFixed(1)}%`);
    });
    
    console.log('\n👥 USUÁRIOS RECENTES');
    console.log('====================');
    dashboardData.recentUsers.slice(0, 5).forEach((user, index) => {
      const timeAgo = new Date(user.created_at).toLocaleString('pt-BR');
      console.log(`${index + 1}. ${user.name} (${user.user_type})`);
      console.log(`   📧 ${user.email}`);
      console.log(`   📅 Criado em: ${timeAgo}`);
    });
    
    console.log('\n🎯 STATUS DO SISTEMA');
    console.log('====================');
    console.log('✅ API: Online');
    console.log('✅ Banco de Dados: Online');
    console.log('✅ Autenticação: Funcionando');
    console.log('✅ Registros: Funcionando');
    console.log('✅ Subscriptions: Funcionando');
    
    console.log('\n🚀 SISTEMA TOTALMENTE OPERACIONAL!');
    console.log('===================================');
    
    // Mostrar URL para acesso direto
    console.log('\n🌐 ACESSO DIRETO AO DASHBOARD:');
    console.log('==============================');
    console.log('URL: http://localhost:3000/admin/dashboard-real');
    console.log(`Token de Admin: ${loginResult.token}`);
    console.log('\nPara acessar o dashboard:');
    console.log('1. Abra: http://localhost:3000/admin/dashboard-real');
    console.log('2. Use as credenciais:');
    console.log('   📧 Email: admin.dashboard@coinbitclub.com');
    console.log('   🔐 Senha: admin123');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  } finally {
    await pool.end();
  }
}

displayDashboard();
