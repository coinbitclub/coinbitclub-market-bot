const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function verificarUsuariosCriados() {
  try {
    console.log('🔍 VERIFICANDO USUÁRIOS CRIADOS NO SISTEMA');
    
    // Listar todos os usuários
    const users = await pool.query(`
      SELECT 
        id, name, email, role, vip_status, balance, credit_bonus, status, created_at
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n👥 USUÁRIOS NO SISTEMA:');
    users.rows.forEach(user => {
      const vipStatus = user.vip_status ? '💎 VIP' : '👤 Regular';
      const roleIcon = user.role === 'admin' ? '👑' : user.role === 'vip' ? '💎' : '👤';
      
      console.log(`   ${roleIcon} ID: ${user.id} - ${user.name}`);
      console.log(`      📧 Email: ${user.email}`);
      console.log(`      🏷️ Role: ${user.role} ${vipStatus}`);
      console.log(`      💰 Balance: R$${user.balance || 0}`);
      console.log(`      🎁 Bonus: R$${user.credit_bonus || 0}`);
      console.log(`      📅 Criado: ${user.created_at}`);
      console.log('');
    });
    
    // Verificar balanços
    console.log('💰 BALANÇOS NA TABELA USER_BALANCES:');
    const balances = await pool.query(`
      SELECT 
        ub.user_id, u.name, ub.exchange, ub.currency, 
        ub.available_balance, ub.total_balance
      FROM user_balances ub
      JOIN users u ON ub.user_id = u.id
      ORDER BY ub.user_id
    `);
    
    balances.rows.forEach(balance => {
      console.log(`   👤 ${balance.name} (ID: ${balance.user_id})`);
      console.log(`      Exchange: ${balance.exchange}, Currency: ${balance.currency}`);
      console.log(`      Available: R$${balance.available_balance}, Total: R$${balance.total_balance}`);
      console.log('');
    });
    
    // Verificar API Keys
    console.log('🔑 CHAVES API CONFIGURADAS:');
    const apiKeys = await pool.query(`
      SELECT 
        ak.user_id, u.name, ak.exchange, ak.api_key, 
        ak.is_active, ak.validation_status, ak.environment
      FROM user_api_keys ak
      JOIN users u ON ak.user_id = u.id
      ORDER BY ak.user_id
    `);
    
    apiKeys.rows.forEach(key => {
      const status = key.is_active ? '✅ Ativa' : '⏸️ Inativa';
      const validation = key.validation_status === 'valid' ? '✅ Válida' : '⏳ Pendente';
      
      console.log(`   👤 ${key.name} (ID: ${key.user_id})`);
      console.log(`      Exchange: ${key.exchange}, Env: ${key.environment}`);
      console.log(`      API Key: ${key.api_key.substring(0, 10)}...`);
      console.log(`      Status: ${status}, Validação: ${validation}`);
      console.log('');
    });
    
    console.log('✅ VERIFICAÇÃO COMPLETA!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarUsuariosCriados();
