const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkAdminUser() {
  console.log('🔍 VERIFICAÇÃO DE USUÁRIO ADMINISTRADOR');
  console.log('======================================\n');

  const emailToCheck = 'admin.dashboard@coinbitclub.com';
  
  try {
    console.log(`📧 Verificando usuário: ${emailToCheck}\n`);

    // Buscar usuário específico
    const userResult = await pool.query(`
      SELECT 
        id,
        name,
        email,
        user_type,
        is_active,
        is_email_verified,
        created_at,
        updated_at
      FROM users 
      WHERE email = $1
    `, [emailToCheck]);

    if (userResult.rows.length === 0) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO');
      console.log('==========================');
      console.log(`O email ${emailToCheck} não está registrado no sistema.`);
      console.log('\n💡 Sugestão: Execute o script de criação do admin primeiro.');
      return false;
    }

    const user = userResult.rows[0];
    
    console.log('✅ USUÁRIO ENCONTRADO');
    console.log('=====================');
    console.log(`👤 ID: ${user.id}`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🏷️ Tipo de Usuário: ${user.user_type}`);
    console.log(`✅ Ativo: ${user.is_active ? 'Sim' : 'Não'}`);
    console.log(`📧 Email Verificado: ${user.is_email_verified ? 'Sim' : 'Não'}`);
    console.log(`📅 Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    console.log(`🔄 Atualizado em: ${new Date(user.updated_at).toLocaleString('pt-BR')}`);

    // Verificar se é administrador
    console.log('\n🔐 VERIFICAÇÃO DE PERMISSÕES');
    console.log('============================');
    
    if (user.user_type === 'admin') {
      console.log('✅ CONFIRMADO: Este usuário é um ADMINISTRADOR');
      console.log('🎯 Status: AUTORIZADO para acessar o dashboard admin');
      
      // Verificar se está ativo
      if (user.is_active) {
        console.log('✅ Status Ativo: O usuário pode fazer login');
      } else {
        console.log('⚠️ Status Inativo: O usuário está desabilitado');
      }
      
    } else {
      console.log('❌ ACESSO NEGADO: Este usuário NÃO é um administrador');
      console.log(`🏷️ Tipo atual: ${user.user_type}`);
      console.log('💡 Apenas usuários com tipo "admin" podem acessar o dashboard');
    }

    // Buscar dados relacionados
    console.log('\n📊 DADOS RELACIONADOS');
    console.log('=====================');

    // Verificar subscription
    const subscriptionResult = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.plan_type,
        p.name as plan_name,
        s.created_at
      FROM subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = $1
    `, [user.id]);

    if (subscriptionResult.rows.length > 0) {
      const subscription = subscriptionResult.rows[0];
      console.log(`📦 Subscription: ${subscription.plan_name || 'N/A'} (${subscription.plan_type})`);
      console.log(`📊 Status: ${subscription.status}`);
    } else {
      console.log('📦 Subscription: Nenhuma encontrada');
    }

    // Verificar balance
    const balanceResult = await pool.query(`
      SELECT 
        prepaid_balance,
        total_profit,
        total_loss,
        pending_commission,
        paid_commission
      FROM user_balances
      WHERE user_id = $1
    `, [user.id]);

    if (balanceResult.rows.length > 0) {
      const balance = balanceResult.rows[0];
      console.log(`💰 Saldo Pré-pago: R$ ${parseFloat(balance.prepaid_balance).toFixed(2)}`);
      console.log(`📈 Lucro Total: R$ ${parseFloat(balance.total_profit).toFixed(2)}`);
      console.log(`📉 Perda Total: R$ ${parseFloat(balance.total_loss).toFixed(2)}`);
    } else {
      console.log('💰 Balance: Nenhum encontrado');
    }

    // Se for admin, verificar outros admins
    if (user.user_type === 'admin') {
      console.log('\n👑 OUTROS ADMINISTRADORES');
      console.log('=========================');
      
      const allAdminsResult = await pool.query(`
        SELECT 
          name,
          email,
          is_active,
          created_at
        FROM users 
        WHERE user_type = 'admin'
        ORDER BY created_at DESC
      `);

      allAdminsResult.rows.forEach((admin, index) => {
        const status = admin.is_active ? '✅' : '❌';
        const current = admin.email === emailToCheck ? ' ← USUÁRIO ATUAL' : '';
        console.log(`${index + 1}. ${status} ${admin.name} (${admin.email})${current}`);
      });
    }

    return user.user_type === 'admin' && user.is_active;

  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Função para testar login
async function testAdminLogin() {
  console.log('\n🔑 TESTE DE LOGIN');
  console.log('=================');
  
  try {
    const loginData = {
      email: 'admin.dashboard@coinbitclub.com',
      password: 'admin123'
    };

    const response = await fetch('http://localhost:3004/api/auth/login-real', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();

    if (response.ok && result.user) {
      console.log('✅ LOGIN BEM-SUCEDIDO');
      console.log(`👤 Usuário: ${result.user.name}`);
      console.log(`🏷️ Tipo: ${result.user.userType}`);
      console.log(`🎫 Token gerado: ${result.token ? 'Sim' : 'Não'}`);
      
      if (result.user.userType === 'admin') {
        console.log('🎯 ACESSO AUTORIZADO ao dashboard admin');
      } else {
        console.log('❌ ACESSO NEGADO: Não é administrador');
      }
    } else {
      console.log('❌ LOGIN FALHOU');
      console.log(`📋 Erro: ${result.message || 'Credenciais inválidas'}`);
    }

  } catch (error) {
    console.log('❌ Erro no teste de login:', error.message);
  }
}

async function main() {
  const isAdmin = await checkAdminUser();
  
  if (isAdmin) {
    await testAdminLogin();
    
    console.log('\n🎯 RESULTADO FINAL');
    console.log('==================');
    console.log('✅ Usuário é administrador válido');
    console.log('✅ Pode acessar o dashboard admin');
    console.log('🌐 URL: http://localhost:3004/admin/dashboard');
  } else {
    console.log('\n❌ RESULTADO FINAL');
    console.log('==================');
    console.log('❌ Usuário não é administrador ou não está ativo');
    console.log('💡 Verifique o tipo de usuário e status no banco');
  }
}

main();
