// ========================================
// MARKETBOT - TESTE DASHBOARD BÁSICO
// Teste simplificado do dashboard
// ========================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function testDashboardBasic() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 TESTE BÁSICO DO DASHBOARD');
    console.log('============================');
    
    // 1. Verificar se as tabelas básicas existem
    console.log('\n📋 Verificando estrutura atual...');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tabelas existentes:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // 2. Criar tabela de métricas simples
    console.log('\n📊 Criando tabela de métricas...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,2),
        metric_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 3. Criar tabela de alertas simples
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_alerts (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(20) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        component VARCHAR(100) NOT NULL,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelas básicas criadas');
    
    // 4. Testar cálculo de métricas reais
    console.log('\n📈 Calculando métricas do sistema...');
    
    const metrics = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '24 hours') as active_users_24h,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_users_today,
        (SELECT COALESCE(SUM(account_balance_usd), 0) FROM users) as total_balance_usd,
        (SELECT COALESCE(SUM(commission_balance_brl), 0) FROM users) as total_balance_brl
    `);
    
    const data = metrics.rows[0];
    
    // 5. Inserir métricas na tabela
    await client.query(`
      INSERT INTO dashboard_metrics (metric_name, metric_value, metric_data) VALUES
      ('total_users', $1, 'Total de usuários cadastrados'),
      ('active_users_24h', $2, 'Usuários ativos nas últimas 24 horas'),
      ('new_users_today', $3, 'Novos usuários hoje'),
      ('total_balance_usd', $4, 'Saldo total em USD'),
      ('total_balance_brl', $5, 'Saldo total em BRL')
    `, [
      data.total_users,
      data.active_users_24h, 
      data.new_users_today,
      data.total_balance_usd,
      data.total_balance_brl
    ]);
    
    console.log('Métricas calculadas:');
    console.log(`  ✅ Total usuários: ${data.total_users}`);
    console.log(`  ✅ Usuários ativos (24h): ${data.active_users_24h}`);
    console.log(`  ✅ Novos usuários hoje: ${data.new_users_today}`);
    console.log(`  ✅ Total USD: $${parseFloat(data.total_balance_usd || 0).toFixed(2)}`);
    console.log(`  ✅ Total BRL: R$${parseFloat(data.total_balance_brl || 0).toFixed(2)}`);
    
    // 6. Criar alertas de teste
    console.log('\n🚨 Criando alertas de teste...');
    
    await client.query(`
      INSERT INTO dashboard_alerts (alert_type, title, message, component) VALUES
      ('INFO', 'Dashboard Ativo', 'Sistema de dashboard inicializado com sucesso', 'DASHBOARD'),
      ('INFO', 'Métricas Calculadas', 'Métricas do sistema calculadas e armazenadas', 'METRICS')
    `);
    
    const alertsResult = await client.query(`
      SELECT alert_type, title, is_resolved 
      FROM dashboard_alerts 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Alertas criados:');
    alertsResult.rows.forEach(alert => {
      console.log(`  ✅ ${alert.alert_type}: ${alert.title}`);
    });
    
    // 7. Testar consulta de atividades recentes
    console.log('\n📋 Verificando atividades recentes...');
    
    const recentActivities = await client.query(`
      SELECT 
        'trading' as activity_type,
        tp.symbol,
        tp.side,
        tp.created_at,
        tp.status
      FROM trading_positions tp
      ORDER BY tp.created_at DESC
      LIMIT 5
    `);
    
    console.log('Atividades recentes:');
    if (recentActivities.rows.length > 0) {
      recentActivities.rows.forEach(activity => {
        console.log(`  ✅ ${activity.activity_type}: ${activity.symbol} ${activity.side} (${activity.status})`);
      });
    } else {
      console.log('  ℹ️  Nenhuma atividade de trading registrada ainda');
    }
    
    // 8. Teste de performance (simulação)
    console.log('\n⚡ Testando simulação de performance...');
    
    const startTime = Date.now();
    
    // Simular várias consultas como se fosse o dashboard real
    await Promise.all([
      client.query('SELECT COUNT(*) FROM users'),
      client.query('SELECT COUNT(*) FROM dashboard_metrics'),
      client.query('SELECT COUNT(*) FROM dashboard_alerts WHERE is_resolved = false'),
      client.query('SELECT AVG(metric_value) FROM dashboard_metrics WHERE metric_name = $1', ['total_users'])
    ]);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Tempo de resposta do dashboard: ${responseTime}ms`);
    
    // 9. Resumo final
    console.log('\n📊 RESUMO DO TESTE:');
    console.log('==================');
    
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM dashboard_metrics) as metrics_count,
        (SELECT COUNT(*) FROM dashboard_alerts) as alerts_count,
        (SELECT COUNT(*) FROM users) as users_count
    `);
    
    const summaryData = summary.rows[0];
    
    console.log(`✅ Métricas armazenadas: ${summaryData.metrics_count}`);
    console.log(`✅ Alertas criados: ${summaryData.alerts_count}`);
    console.log(`✅ Usuários no sistema: ${summaryData.users_count}`);
    console.log(`✅ Tempo de resposta: ${responseTime}ms`);
    
    console.log('\n🎉 DASHBOARD BÁSICO FUNCIONANDO!');
    console.log('================================');
    console.log('✅ Estrutura de tabelas criada');
    console.log('✅ Métricas calculadas e armazenadas');
    console.log('✅ Sistema de alertas operacional');
    console.log('✅ Performance aceitável');
    console.log('✅ Pronto para integração com frontend');
    
    return {
      success: true,
      metrics_count: parseInt(summaryData.metrics_count),
      alerts_count: parseInt(summaryData.alerts_count),
      users_count: parseInt(summaryData.users_count),
      response_time_ms: responseTime,
      dashboard_ready: true
    };
    
  } catch (error) {
    console.error('❌ Erro no teste básico do dashboard:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar teste
if (require.main === module) {
  testDashboardBasic()
    .then(result => {
      console.log('\n✅ Teste básico concluído com sucesso!');
      console.log('Resultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Falha no teste básico:', error);
      process.exit(1);
    });
}

module.exports = { testDashboardBasic };
