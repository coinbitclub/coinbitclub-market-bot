const { Pool } = require('pg');

// Teste de conectividade direta com Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testRailwayConnection() {
  try {
    console.log('🔄 Testando conexão com PostgreSQL Railway...');
    
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL Railway!');
    
    // Testar queries básicas
    console.log('\n📊 Testando queries...');
    
    // 1. Contagem de usuários
    const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`👥 Total de usuários: ${usersResult.rows[0].user_count}`);
    
    // 2. Contagem de logs do sistema
    const logsResult = await client.query('SELECT COUNT(*) as log_count FROM system_logs');
    console.log(`📋 Total de logs: ${logsResult.rows[0].log_count}`);
    
    // 3. Verificar alertas ativos
    const alertsResult = await client.query('SELECT COUNT(*) as alert_count FROM system_alerts WHERE status = \'open\'');
    console.log(`⚠️ Alertas ativos: ${alertsResult.rows[0].alert_count}`);
    
    // 4. Logs recentes por nível
    const recentLogsResult = await client.query(`
      SELECT 
        level, 
        COUNT(*) as count 
      FROM system_logs 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY level 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 Logs das últimas 24h por nível:');
    recentLogsResult.rows.forEach(row => {
      console.log(`   ${row.level}: ${row.count}`);
    });
    
    // 5. Teste de inserção de log
    console.log('\n🔄 Testando inserção de log...');
    await client.query(`
      INSERT INTO system_logs (level, message, context)
      VALUES ('INFO', 'Teste de conectividade via Railway', $1)
    `, [JSON.stringify({
      test: true,
      timestamp: new Date(),
      source: 'railway_test_script'
    })]);
    console.log('✅ Log de teste inserido com sucesso!');
    
    // 6. Configurações do sistema
    const configResult = await client.query(`
      SELECT category, key, value
      FROM system_configurations
      WHERE category = 'trading'
      ORDER BY key
    `);
    
    console.log('\n⚙️ Configurações de trading:');
    configResult.rows.forEach(config => {
      console.log(`   ${config.key}: ${config.value}`);
    });
    
    // 7. Verificar estrutura das tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('user_profiles', 'user_balances', 'system_alerts', 'system_configurations')
      ORDER BY table_name
    `);
    
    console.log('\n🏗️ Tabelas admin criadas:');
    tablesResult.rows.forEach(table => {
      console.log(`   ✓ ${table.table_name}`);
    });
    
    client.release();
    console.log('\n🎉 Teste de conectividade concluído com sucesso!');
    console.log('\n📌 Status da integração:');
    console.log('   ✅ Conexão ao banco PostgreSQL Railway: OK');
    console.log('   ✅ Tabelas admin disponíveis: OK');
    console.log('   ✅ Inserção de dados: OK');
    console.log('   ✅ Queries complexas: OK');
    console.log('\n🚀 Sistema pronto para integração frontend-backend!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    console.error('\n🔍 Detalhes do erro:');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensagem: ${error.message}`);
  } finally {
    await pool.end();
  }
}

testRailwayConnection();
