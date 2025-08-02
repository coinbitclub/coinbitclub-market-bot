const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function verificarStatusSistema() {
  try {
    console.log('🔍 VERIFICANDO STATUS COMPLETO DO SISTEMA');
    
    const now = Date.now();
    
    // Verificar atividade dos usuários
    const activity = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as active_1h,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '2 hours' THEN 1 END) as active_2h,
        MAX(last_login) as most_recent,
        EXTRACT(EPOCH FROM (NOW() - MAX(last_login)))/3600 as hours_since_activity
      FROM users 
      WHERE status = 'active'
    `);

    const data = activity.rows[0];
    
    console.log('\n📊 ANÁLISE DE ATIVIDADE:');
    console.log(`   👥 Total de usuários: ${data.total_users}`);
    console.log(`   🕐 Ativos na última hora: ${data.active_1h}`);
    console.log(`   🕑 Ativos nas últimas 2 horas: ${data.active_2h}`);
    console.log(`   ⏰ Última atividade: ${data.most_recent}`);
    console.log(`   📉 Horas desde atividade: ${parseFloat(data.hours_since_activity).toFixed(2)}h`);
    
    // Determinar status baseado na atividade
    const isOnline = data.hours_since_activity < 2 && data.active_1h > 0;
    const status = isOnline ? 'ONLINE' : 'OFFLINE';
    
    console.log(`\n🚀 STATUS DO SISTEMA: ${status}`);
    console.log(`   Critério: Atividade < 2h e usuários ativos = ${isOnline ? 'SIM' : 'NÃO'}`);
    
    // Verificar dados detalhados
    const detailedUsers = await pool.query(`
      SELECT 
        id, name, email, role, vip_status, status, last_login,
        EXTRACT(EPOCH FROM (NOW() - last_login))/60 as minutes_since_login
      FROM users 
      WHERE status = 'active'
      ORDER BY last_login DESC
    `);
    
    console.log('\n👥 DETALHES DOS USUÁRIOS:');
    detailedUsers.rows.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : user.vip_status ? '💎' : '👤';
      const minutesAgo = parseFloat(user.minutes_since_login).toFixed(1);
      console.log(`   ${roleIcon} ${user.name}: há ${minutesAgo} min`);
    });
    
    // Verificar API Keys
    const apiKeys = await pool.query(`
      SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active
      FROM user_api_keys
    `);
    
    console.log(`\n🔑 API KEYS: ${apiKeys.rows[0].active}/${apiKeys.rows[0].total} ativas`);
    
    // Verificar balanços
    const balances = await pool.query(`
      SELECT 
        COUNT(*) as total_balances,
        SUM(total_balance) as total_value,
        COUNT(DISTINCT user_id) as users_with_balance
      FROM user_balances
    `);
    
    console.log(`💰 BALANÇOS: ${balances.rows[0].users_with_balance} usuários com $${balances.rows[0].total_value}`);
    
    if (isOnline) {
      console.log('\n✅ SISTEMA ESTÁ ONLINE E FUNCIONAL!');
    } else {
      console.log('\n⚠️ Sistema mostra OFFLINE no dashboard');
      console.log('💡 Para mostrar ONLINE, precisa de atividade recente (< 2h)');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarStatusSistema();
