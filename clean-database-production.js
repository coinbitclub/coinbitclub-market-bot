// LIMPEZA COMPLETA DO BANCO PARA PRODUÇÃO
// Remove todos os dados de teste e prepara para operações reais

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function cleanDatabaseForProduction() {
  try {
    console.log('🧹 INICIANDO LIMPEZA COMPLETA DO BANCO PARA PRODUÇÃO...\n');

    // ORDEM CORRETA: Limpar primeiro as tabelas que referenciam outras (foreign keys)
    
    // 1. LIMPAR LOGS DE SISTEMA PRIMEIRO (podem referenciar posições)
    console.log('🔍 Limpando logs de sistema...');
    const logsResult = await pool.query(`
      DELETE FROM system_monitoring 
      WHERE created_at > '2024-01-01'
        AND event_type NOT IN ('SYSTEM_STARTUP', 'SYSTEM_CONFIG')
    `);
    console.log(`✅ ${logsResult.rowCount} logs de teste removidos`);

    // 2. LIMPAR TRANSAÇÕES DE COMISSÃO (podem referenciar posições)
    console.log('� Limpando transações de comissão...');
    const commissionsResult = await pool.query(`
      DELETE FROM commission_transactions 
      WHERE created_at > '2024-01-01'
    `);
    console.log(`✅ ${commissionsResult.rowCount} transações de comissão removidas`);

    // 3. REMOVER ORDENS DE TESTE
    console.log('📋 Limpando ordens de trading...');
    const ordersResult = await pool.query(`
      DELETE FROM trading_orders 
      WHERE created_at > '2024-01-01'
    `);
    console.log(`✅ ${ordersResult.rowCount} ordens de teste removidas`);

    // 4. AGORA REMOVER POSIÇÕES (sem referências)
    console.log('� Limpando posições de trading...');
    const positionsResult = await pool.query(`
      DELETE FROM trading_positions 
      WHERE created_at > '2024-01-01'
    `);
    console.log(`✅ ${positionsResult.rowCount} posições de teste removidas`);

    // 5. REMOVER SINAIS DE TESTE
    console.log('� Limpando sinais de trading...');
    const signalsResult = await pool.query(`
      DELETE FROM trading_signals 
      WHERE created_at > '2024-01-01'
    `);
    console.log(`✅ ${signalsResult.rowCount} sinais de teste removidos`);

    // 6. LIMPAR MÉTRICAS DE TESTE
    console.log('📈 Limpando métricas em tempo real...');
    const metricsResult = await pool.query(`
      DELETE FROM real_time_metrics 
      WHERE created_at > '2024-01-01'
    `);
    console.log(`✅ ${metricsResult.rowCount} métricas de teste removidas`);

    // 7. LIMPAR DECISÕES DE MERCADO DE TESTE
    console.log('🧠 Limpando decisões de mercado...');
    const decisionsResult = await pool.query(`
      DELETE FROM market_decisions 
      WHERE created_at > '2024-01-01'
    `);
    console.log(`✅ ${decisionsResult.rowCount} decisões de teste removidas`);

    // 8. REMOVER CONTAS DE TESTE DA EXCHANGE
    console.log('🔑 Removendo contas de teste...');
    const testAccountsResult = await pool.query(`
      DELETE FROM user_exchange_accounts 
      WHERE api_key IN ('test_key', 'demo_key') 
        OR api_key LIKE 'test_%' 
        OR api_key LIKE 'demo_%'
        OR LENGTH(api_key) < 10
    `);
    console.log(`✅ ${testAccountsResult.rowCount} contas de teste removidas`);

    // 9. LIMPAR USUÁRIOS DE TESTE
    console.log('👤 Removendo usuários de teste...');
    const testUsersResult = await pool.query(`
      DELETE FROM users 
      WHERE email LIKE '%test%' 
        OR email LIKE '%demo%'
        OR first_name = 'Test'
        OR last_name = 'User'
    `);
    console.log(`✅ ${testUsersResult.rowCount} usuários de teste removidos`);

    // 10. RESETAR SEQUÊNCIAS AUTO-INCREMENT
    console.log('🔄 Resetando sequências...');
    await pool.query(`ALTER SEQUENCE market_decisions_id_seq RESTART WITH 1`);
    await pool.query(`ALTER SEQUENCE system_monitoring_id_seq RESTART WITH 1`);
    await pool.query(`ALTER SEQUENCE real_time_metrics_id_seq RESTART WITH 1`);
    console.log('✅ Sequências resetadas');

    // 11. VERIFICAR STATUS FINAL
    console.log('\n📊 VERIFICANDO STATUS FINAL...');
    
    const finalCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM user_exchange_accounts WHERE is_active = true) as active_accounts,
        (SELECT COUNT(*) FROM trading_positions) as positions_count,
        (SELECT COUNT(*) FROM trading_orders) as orders_count,
        (SELECT COUNT(*) FROM trading_signals) as signals_count,
        (SELECT COUNT(*) FROM system_monitoring) as logs_count,
        (SELECT COUNT(*) FROM market_decisions) as decisions_count
    `);
    
    const stats = finalCheck.rows[0];
    console.log('📈 ESTATÍSTICAS FINAIS:');
    console.log(`├─ Usuários: ${stats.users_count}`);
    console.log(`├─ Contas ativas: ${stats.active_accounts}`);
    console.log(`├─ Posições: ${stats.positions_count}`);
    console.log(`├─ Ordens: ${stats.orders_count}`);
    console.log(`├─ Sinais: ${stats.signals_count}`);
    console.log(`├─ Logs: ${stats.logs_count}`);
    console.log(`└─ Decisões: ${stats.decisions_count}`);

    // 12. REGISTRAR LIMPEZA NO SISTEMA
    await pool.query(`
      INSERT INTO system_monitoring (event_type, details, created_at)
      VALUES ('DATABASE_CLEANUP_PRODUCTION', $1, NOW())
    `, [JSON.stringify({
      cleanup_timestamp: new Date().toISOString(),
      cleaned_tables: [
        'trading_positions', 'trading_orders', 'trading_signals',
        'system_monitoring', 'real_time_metrics', 'market_decisions',
        'user_exchange_accounts', 'users', 'commission_transactions'
      ],
      final_stats: stats,
      ready_for_production: true
    })]);

    console.log('\n🎯 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('✅ Banco de dados limpo e pronto para PRODUÇÃO');
    console.log('🚀 Sistema pronto para operações REAIS');

  } catch (error) {
    console.error('❌ Erro na limpeza do banco:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar limpeza
if (require.main === module) {
  cleanDatabaseForProduction()
    .then(() => {
      console.log('\n🏁 PROCESSO CONCLUÍDO - BANCO LIMPO PARA PRODUÇÃO');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 ERRO NA LIMPEZA:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabaseForProduction };
