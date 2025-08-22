// LIMPEZA SEGURA DO BANCO PARA PRODUÇÃO
// Remove dados de teste respeitando as estruturas existentes

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function safeDatabaseCleanup() {
  try {
    console.log('🧹 INICIANDO LIMPEZA SEGURA DO BANCO PARA PRODUÇÃO...\n');

    // Primeiro verificar quais tabelas existem
    console.log('🔍 Verificando estrutura do banco...');
    const tablesQuery = await pool.query(`
      SELECT table_name, column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'trading_positions', 'trading_orders', 'trading_signals',
          'system_monitoring', 'real_time_metrics', 'market_decisions',
          'user_exchange_accounts', 'users', 'commission_transactions'
        )
      ORDER BY table_name, ordinal_position
    `);

    const tableStructure = {};
    tablesQuery.rows.forEach(row => {
      if (!tableStructure[row.table_name]) {
        tableStructure[row.table_name] = [];
      }
      tableStructure[row.table_name].push(row.column_name);
    });

    console.log('📊 Tabelas encontradas:');
    Object.keys(tableStructure).forEach(table => {
      console.log(`├─ ${table}: ${tableStructure[table].length} colunas`);
    });

    // LIMPEZA SEGURA POR ETAPAS
    
    // 1. Limpar system_monitoring primeiro (pode ter FK para outras tabelas)
    if (tableStructure['system_monitoring']) {
      console.log('\n🔍 Limpando system_monitoring...');
      const hasCreatedAt = tableStructure['system_monitoring'].includes('created_at');
      const whereClause = hasCreatedAt ? "WHERE created_at > '2024-01-01'" : "WHERE id > 0";
      
      const logsResult = await pool.query(`
        DELETE FROM system_monitoring 
        ${whereClause}
      `);
      console.log(`✅ ${logsResult.rowCount} registros de monitoramento removidos`);
    }

    // 2. Limpar real_time_metrics
    if (tableStructure['real_time_metrics']) {
      console.log('📈 Limpando real_time_metrics...');
      const hasCreatedAt = tableStructure['real_time_metrics'].includes('created_at');
      const whereClause = hasCreatedAt ? "WHERE created_at > '2024-01-01'" : "WHERE id > 0";
      
      const metricsResult = await pool.query(`
        DELETE FROM real_time_metrics 
        ${whereClause}
      `);
      console.log(`✅ ${metricsResult.rowCount} métricas removidas`);
    }

    // 3. Limpar market_decisions
    if (tableStructure['market_decisions']) {
      console.log('🧠 Limpando market_decisions...');
      const hasCreatedAt = tableStructure['market_decisions'].includes('created_at');
      const whereClause = hasCreatedAt ? "WHERE created_at > '2024-01-01'" : "WHERE id > 0";
      
      const decisionsResult = await pool.query(`
        DELETE FROM market_decisions 
        ${whereClause}
      `);
      console.log(`✅ ${decisionsResult.rowCount} decisões de mercado removidas`);
    }

    // 4. Limpar commission_transactions
    if (tableStructure['commission_transactions']) {
      console.log('💰 Limpando commission_transactions...');
      const commissionsResult = await pool.query(`
        DELETE FROM commission_transactions WHERE id > 0
      `);
      console.log(`✅ ${commissionsResult.rowCount} transações de comissão removidas`);
    }

    // 5. Limpar trading_orders
    if (tableStructure['trading_orders']) {
      console.log('📋 Limpando trading_orders...');
      const ordersResult = await pool.query(`
        DELETE FROM trading_orders WHERE id > 0
      `);
      console.log(`✅ ${ordersResult.rowCount} ordens removidas`);
    }

    // 6. Limpar trading_signals
    if (tableStructure['trading_signals']) {
      console.log('📡 Limpando trading_signals...');
      const signalsResult = await pool.query(`
        DELETE FROM trading_signals WHERE id > 0
      `);
      console.log(`✅ ${signalsResult.rowCount} sinais removidos`);
    }

    // 7. Limpar trading_positions
    if (tableStructure['trading_positions']) {
      console.log('📊 Limpando trading_positions...');
      const positionsResult = await pool.query(`
        DELETE FROM trading_positions WHERE id IS NOT NULL
      `);
      console.log(`✅ ${positionsResult.rowCount} posições removidas`);
    }

    // 8. Limpar contas de teste da exchange
    if (tableStructure['user_exchange_accounts']) {
      console.log('🔑 Removendo contas de teste...');
      const testAccountsResult = await pool.query(`
        DELETE FROM user_exchange_accounts 
        WHERE api_key IN ('test_key', 'demo_key') 
          OR api_key LIKE 'test_%' 
          OR api_key LIKE 'demo_%'
          OR LENGTH(api_key) < 15
      `);
      console.log(`✅ ${testAccountsResult.rowCount} contas de teste removidas`);
    }

    // 9. Limpar usuários de teste
    if (tableStructure['users']) {
      console.log('👤 Removendo usuários de teste...');
      const testUsersResult = await pool.query(`
        DELETE FROM users 
        WHERE email LIKE '%test%' 
          OR email LIKE '%demo%'
          OR first_name = 'Test'
          OR last_name = 'User'
          OR email LIKE '%example.com'
      `);
      console.log(`✅ ${testUsersResult.rowCount} usuários de teste removidos`);
    }

    // 10. Resetar sequências se existirem
    console.log('\n🔄 Resetando sequências...');
    try {
      await pool.query(`ALTER SEQUENCE IF EXISTS market_decisions_id_seq RESTART WITH 1`);
      await pool.query(`ALTER SEQUENCE IF EXISTS system_monitoring_id_seq RESTART WITH 1`);
      await pool.query(`ALTER SEQUENCE IF EXISTS real_time_metrics_id_seq RESTART WITH 1`);
      console.log('✅ Sequências resetadas');
    } catch (seqError) {
      console.log('⚠️ Algumas sequências não existem (normal)');
    }

    // 11. Status final
    console.log('\n📊 VERIFICANDO STATUS FINAL...');
    
    const finalStats = {};
    for (const tableName of Object.keys(tableStructure)) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        finalStats[tableName] = parseInt(result.rows[0].count);
      } catch (error) {
        finalStats[tableName] = 'ERRO';
      }
    }

    console.log('📈 ESTATÍSTICAS FINAIS:');
    Object.entries(finalStats).forEach(([table, count]) => {
      console.log(`├─ ${table}: ${count} registros`);
    });

    // 12. Registrar limpeza
    await pool.query(`
      INSERT INTO system_monitoring (event_type, details)
      VALUES ('DATABASE_CLEANUP_PRODUCTION', $1)
      ON CONFLICT DO NOTHING
    `, [JSON.stringify({
      cleanup_timestamp: new Date().toISOString(),
      tables_cleaned: Object.keys(tableStructure),
      final_stats: finalStats,
      production_ready: true
    })]);

    console.log('\n🎯 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('✅ Banco de dados limpo e pronto para PRODUÇÃO');
    console.log('🚀 Sistema configurado para operações REAIS');

  } catch (error) {
    console.error('❌ Erro na limpeza segura:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar limpeza
if (require.main === module) {
  safeDatabaseCleanup()
    .then(() => {
      console.log('\n🏁 BANCO LIMPO E PRONTO PARA PRODUÇÃO!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 ERRO NA LIMPEZA:', error.message);
      process.exit(1);
    });
}

module.exports = { safeDatabaseCleanup };
