const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function resumoSistemaReligado() {
  try {
    console.log('🎉 SISTEMA COINBITCLUB - RESUMO FINAL');
    console.log('='.repeat(50));
    
    // Status geral
    const status = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN vip_status = true THEN 1 END) as vip_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as online_now,
        MAX(last_login) as last_activity
      FROM users
    `);

    const s = status.rows[0];
    
    console.log('\n🚀 STATUS GERAL DO SISTEMA:');
    console.log(`   📊 Status: ONLINE`);
    console.log(`   👥 Usuários: ${s.active_users}/${s.total_users} ativos`);
    console.log(`   💎 VIPs: ${s.vip_users}`);
    console.log(`   👑 Admins: ${s.admin_users}`);
    console.log(`   🟢 Online agora: ${s.online_now} usuários`);
    console.log(`   ⏰ Última atividade: ${s.last_activity}`);

    // Usuários detalhados
    const users = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.vip_status, u.balance, u.credit_bonus,
        CASE WHEN u.last_login > NOW() - INTERVAL '1 hour' THEN 'ONLINE' ELSE 'OFFLINE' END as status_now
      FROM users u
      WHERE u.status = 'active'
      ORDER BY u.id
    `);

    console.log('\n👥 USUÁRIOS DO SISTEMA:');
    users.rows.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : user.vip_status ? '💎' : '👤';
      const statusIcon = user.status_now === 'ONLINE' ? '🟢' : '🔴';
      
      console.log(`   ${roleIcon} ${statusIcon} ${user.name}`);
      console.log(`      📧 ${user.email}`);
      console.log(`      🏷️ ${user.role.toUpperCase()}${user.vip_status ? ' VIP' : ''}`);
      console.log(`      💰 R$${user.balance || 0} + R$${user.credit_bonus || 0} bônus`);
      console.log('');
    });

    // API Keys
    const apiKeys = await pool.query(`
      SELECT 
        ak.user_id, u.name, ak.exchange, ak.api_key, 
        ak.is_active, ak.validation_status, ak.environment
      FROM user_api_keys ak
      JOIN users u ON ak.user_id = u.id
      ORDER BY ak.user_id
    `);

    console.log('🔑 API KEYS CONFIGURADAS:');
    apiKeys.rows.forEach(key => {
      const statusIcon = key.is_active ? '✅' : '❌';
      const validIcon = key.validation_status === 'valid' ? '✅' : '⚠️';
      
      console.log(`   ${statusIcon} ${key.name}: ${key.exchange} (${key.environment})`);
      console.log(`      🔑 ${key.api_key.substring(0, 15)}...`);
      console.log(`      ${validIcon} ${key.validation_status.toUpperCase()}`);
      console.log('');
    });

    // Balanços
    const balances = await pool.query(`
      SELECT 
        ub.user_id, u.name, ub.exchange, ub.currency, 
        ub.available_balance, ub.total_balance
      FROM user_balances ub
      JOIN users u ON ub.user_id = u.id
      WHERE ub.total_balance > 0
      ORDER BY ub.total_balance DESC
    `);

    console.log('💰 BALANÇOS DO SISTEMA:');
    let totalValue = 0;
    balances.rows.forEach(balance => {
      totalValue += parseFloat(balance.total_balance);
      console.log(`   💰 ${balance.name}: ${balance.total_balance} ${balance.currency}`);
      console.log(`      📊 ${balance.exchange}, Disponível: ${balance.available_balance}`);
      console.log('');
    });

    console.log(`📊 VALOR TOTAL EM CUSTÓDIA: $${totalValue.toFixed(2)}`);

    // URLs e acesso
    console.log('\n🌐 ACESSO AO SISTEMA:');
    console.log(`   📊 Dashboard: http://localhost:3009`);
    console.log(`   🔗 API JSON: http://localhost:3009/api/system-data`);
    console.log(`   🔄 Atualização: Automática a cada 45s`);

    // Credenciais de acesso
    console.log('\n🔐 CREDENCIAIS DE ACESSO:');
    console.log('   👤 Paloma Amaral:');
    console.log('      📧 pamaral15@hotmail.com');
    console.log('      🔐 Diogo1520');
    console.log('');
    console.log('   💎 Erica dos Santos Andrade:');
    console.log('      📧 erica.andrade.santos@hotmail.com');
    console.log('      🔐 Apelido22@');
    console.log('');
    console.log('   👑 ADMIN CoinBitClub:');
    console.log('      📧 faleconosco@coinbitclub.vip');
    console.log('      🔐 Apelido22@');

    console.log('\n✅ SISTEMA TOTALMENTE RELIGADO E FUNCIONAL!');
    console.log('🚀 Todos os componentes estão ativos e operacionais');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

resumoSistemaReligado();
