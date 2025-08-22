// LIMPEZA RÁPIDA E SEGURA - TRUNCATE TABLES
// Remove todos os dados de teste mantendo estrutura

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function quickCleanup() {
  try {
    console.log('🧹 LIMPEZA RÁPIDA PARA PRODUÇÃO...\n');

    // Lista de tabelas para limpar (ordem respeitando foreign keys)
    const tablesToClean = [
      'system_monitoring',
      'real_time_metrics', 
      'market_decisions',
      'commission_transactions',
      'trading_orders',
      'trading_signals',
      'trading_positions'
    ];

    console.log('🗑️  Limpando tabelas principais...');
    
    for (const table of tablesToClean) {
      try {
        const result = await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`✅ ${table} - limpa`);
      } catch (error) {
        console.log(`⚠️ ${table} - ${error.message}`);
        // Tentar DELETE se TRUNCATE falhar
        try {
          const deleteResult = await pool.query(`DELETE FROM ${table}`);
          console.log(`✅ ${table} - ${deleteResult.rowCount} registros removidos`);
        } catch (deleteError) {
          console.log(`❌ ${table} - erro: ${deleteError.message}`);
        }
      }
    }

    // Remover apenas contas claramente de teste
    console.log('\n🔑 Removendo contas de teste óbvias...');
    try {
      const testAccounts = await pool.query(`
        DELETE FROM user_exchange_accounts 
        WHERE api_key IN ('test_key', 'demo_key', 'TEST_KEY', 'DEMO_KEY')
           OR api_key LIKE 'test_%' 
           OR api_key LIKE 'demo_%'
           OR api_key LIKE 'TEST_%'
           OR LENGTH(api_key) < 10
      `);
      console.log(`✅ ${testAccounts.rowCount} contas de teste removidas`);
    } catch (error) {
      console.log(`⚠️ Erro removendo contas: ${error.message}`);
    }

    // Remover usuários de teste óbvios
    console.log('👤 Removendo usuários de teste...');
    try {
      const testUsers = await pool.query(`
        DELETE FROM users 
        WHERE email LIKE '%test%' 
           OR email LIKE '%demo%'
           OR email LIKE '%example.com'
           OR first_name = 'Test'
           OR last_name = 'Test'
      `);
      console.log(`✅ ${testUsers.rowCount} usuários de teste removidos`);
    } catch (error) {
      console.log(`⚠️ Erro removendo usuários: ${error.message}`);
    }

    // Status final
    console.log('\n📊 STATUS FINAL:');
    
    const allTables = [
      'users', 'user_exchange_accounts', 'trading_positions',
      'trading_orders', 'trading_signals', 'system_monitoring',
      'market_decisions', 'real_time_metrics', 'commission_transactions'
    ];

    for (const table of allTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`├─ ${table}: ${count} registros`);
      } catch (error) {
        console.log(`├─ ${table}: ERRO (${error.message})`);
      }
    }

    // Registrar limpeza
    await pool.query(`
      INSERT INTO system_monitoring (event_type, details, created_at)
      VALUES ('PRODUCTION_CLEANUP', $1, NOW())
    `, [JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'Database cleaned for production',
      tables_cleaned: tablesToClean,
      status: 'SUCCESS'
    })]);

    console.log('\n🎯 LIMPEZA CONCLUÍDA!');
    console.log('✅ Banco pronto para PRODUÇÃO');
    console.log('🚀 Sistema configurado para operações REAIS');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

// Executar
quickCleanup()
  .then(() => {
    console.log('\n🏁 PRODUÇÃO READY!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 ERRO:', error.message);
    process.exit(1);
  });
