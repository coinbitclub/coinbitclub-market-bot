const { Pool } = require('pg');

async function ativarGestores() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
  });

  try {
    console.log('🚀 Ativando Gestores CoinBitClub...');

    // Criar gestores no banco
    const gestores = [
      { username: 'signals_manager', email: 'signals@coinbitclub.com', type: 'manager' },
      { username: 'operations_manager', email: 'operations@coinbitclub.com', type: 'manager' },
      { username: 'fear_greed_manager', email: 'feargreed@coinbitclub.com', type: 'manager' },
      { username: 'financial_supervisor', email: 'financial@coinbitclub.com', type: 'supervisor' },
      { username: 'trade_supervisor', email: 'trades@coinbitclub.com', type: 'supervisor' },
      { username: 'users_manager', email: 'users@coinbitclub.com', type: 'manager' },
      { username: 'risk_manager', email: 'risk@coinbitclub.com', type: 'manager' },
      { username: 'analytics_manager', email: 'analytics@coinbitclub.com', type: 'manager' }
    ];

    for (const gestor of gestores) {
      try {
        await pool.query(`
          INSERT INTO users (username, email, password, user_type, status, vip_status, created_at, last_login)
          VALUES ($1, $2, 'hashed_password', $3, 'active', true, NOW(), NOW())
          ON CONFLICT (username) DO UPDATE SET
            user_type = $3,
            status = 'active',
            last_login = NOW(),
            vip_status = true
        `, [gestor.username, gestor.email, gestor.type]);
        
        console.log(`✅ ${gestor.username} ativado`);
      } catch (error) {
        console.log(`⚠️ ${gestor.username} já existe ou erro:`, error.message);
      }
    }

    // Verificar gestores criados
    const result = await pool.query(`
      SELECT username, user_type, status, last_login 
      FROM users 
      WHERE user_type IN ('manager', 'supervisor') 
      ORDER BY username
    `);

    console.log('\n📊 GESTORES ATIVOS:');
    console.log('='.repeat(50));
    result.rows.forEach(gestor => {
      console.log(`🤖 ${gestor.username} | ${gestor.user_type} | ${gestor.status}`);
    });

    console.log('\n🎯 FUNÇÕES DOS GESTORES:');
    console.log('📡 signals_manager      - Processamento de sinais');
    console.log('⚡ operations_manager   - Gerenciamento de operações');
    console.log('📈 fear_greed_manager   - Monitoramento Fear & Greed');
    console.log('💰 financial_supervisor - Supervisão financeira');
    console.log('🎯 trade_supervisor     - Supervisão de trades');
    console.log('👥 users_manager        - Gerenciamento de usuários');
    console.log('🛡️ risk_manager         - Análise de riscos');
    console.log('📊 analytics_manager    - Geração de analytics');

    console.log('\n🟢 SISTEMA DE GESTORES ATIVADO!');
    console.log('🌐 Acesse: http://localhost:3011');
    console.log('📋 Os gestores agora aparecem REAIS no dashboard');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

ativarGestores();
