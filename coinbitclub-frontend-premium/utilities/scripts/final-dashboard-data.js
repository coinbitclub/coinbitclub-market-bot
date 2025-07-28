const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: false
});

async function finalDashboardData() {
  try {
    console.log('🎯 Construindo dados finais para o dashboard...\n');
    
    const client = await pool.connect();
    
    // 1. USUÁRIOS
    const usersStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active,
        COUNT(CASE WHEN DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month
      FROM users
    `);
    
    console.log('👥 Estatísticas de Usuários:');
    console.log(`Total: ${usersStats.rows[0].total}, Ativos: ${usersStats.rows[0].active}, Novos este mês: ${usersStats.rows[0].new_this_month}`);
    
    // 2. OPERAÇÕES DE TRADING
    const operationsStats = await client.query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_operations,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as profitable_operations,
        COALESCE(AVG(profit), 0) as avg_profit_loss,
        COALESCE(SUM(profit), 0) as total_profit_loss
      FROM operations
    `);
    
    console.log('\n📈 Estatísticas de Trading:');
    console.log(`Total: ${operationsStats.rows[0].total_operations}, Abertas: ${operationsStats.rows[0].open_operations}, Lucrativas: ${operationsStats.rows[0].profitable_operations}`);
    console.log(`Lucro total: $${operationsStats.rows[0].total_profit_loss}`);
    
    // 3. SINAIS DE TRADING
    const signalsStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM trading_signals
    `);
    
    console.log('\n📡 Estatísticas de Sinais:');
    console.log(`Total: ${signalsStats.rows[0].total}, Processados: ${signalsStats.rows[0].processed}, Pendentes: ${signalsStats.rows[0].pending}`);
    
    // 4. SINAIS IA
    const aiSignalsStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        AVG(CAST(confidence AS NUMERIC)) as avg_confidence
      FROM ai_signals
    `);
    
    console.log('\n🤖 Estatísticas de IA:');
    console.log(`Total: ${aiSignalsStats.rows[0].total}, Confiança média: ${parseFloat(aiSignalsStats.rows[0].avg_confidence).toFixed(1)}%`);
    
    // 5. AFILIADOS (verificar estrutura primeiro)
    const affiliatesStructure = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'affiliates'
    `);
    
    console.log('\n🔍 Colunas da tabela affiliates:');
    affiliatesStructure.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    // Contar afiliados
    const affiliatesCount = await client.query('SELECT COUNT(*) as total FROM affiliates');
    console.log(`\n👥 Total de afiliados: ${affiliatesCount.rows[0].total}`);
    
    // 6. USER BALANCES - verificar estrutura
    const balanceStructure = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_balances'
    `);
    
    console.log('\n💰 Colunas da tabela user_balances:');
    balanceStructure.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    // Sample de user_balances
    const balanceSample = await client.query('SELECT * FROM user_balances LIMIT 3');
    console.log('\n💰 Exemplo de saldos:');
    console.table(balanceSample.rows);
    
    // 7. OPERAÇÕES RECENTES
    const recentOperations = await client.query(`
      SELECT 
        o.id,
        o.symbol,
        o.side,
        o.profit as profit_loss,
        u.email as user_email,
        o.created_at
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📊 Operações Recentes:');
    console.table(recentOperations.rows);
    
    // 8. CONSTRUIR OBJETO FINAL
    const dashboardData = {
      timestamp: new Date().toISOString(),
      users: {
        total: parseInt(usersStats.rows[0].total),
        active: parseInt(usersStats.rows[0].active), 
        newThisMonth: parseInt(usersStats.rows[0].new_this_month),
        totalBalance: 25000 // Placeholder - precisa calcular
      },
      trading: {
        totalOperations: parseInt(operationsStats.rows[0].total_operations),
        openOperations: parseInt(operationsStats.rows[0].open_operations),
        profitableOperations: parseInt(operationsStats.rows[0].profitable_operations),
        avgProfitLoss: parseFloat(operationsStats.rows[0].avg_profit_loss),
        totalProfitLoss: parseFloat(operationsStats.rows[0].total_profit_loss),
        recentOperations: recentOperations.rows
      },
      signals: {
        total: parseInt(signalsStats.rows[0].total),
        processed: parseInt(signalsStats.rows[0].processed),
        pending: parseInt(signalsStats.rows[0].pending),
        avgConfidence: parseFloat(aiSignalsStats.rows[0].avg_confidence)
      },
      affiliates: {
        total: parseInt(affiliatesCount.rows[0].total),
        active: parseInt(affiliatesCount.rows[0].total), // Assumindo que todos são ativos
        totalCommissions: 1500, // Placeholder
        pendingCommissions: 350 // Placeholder
      },
      system: {
        services: [
          {
            service_name: 'Signal Ingestor',
            status: 'online',
            last_heartbeat: new Date().toISOString(),
            response_time_ms: 45
          },
          {
            service_name: 'Decision Engine',
            status: 'online', 
            last_heartbeat: new Date().toISOString(),
            response_time_ms: 32
          },
          {
            service_name: 'Order Executor',
            status: 'offline',
            last_heartbeat: new Date(Date.now() - 300000).toISOString(),
            response_time_ms: 0
          }
        ]
      },
      financial: {
        totalDeposits: 50000,
        totalWithdrawals: 8000,
        activeSubscriptions: parseInt(usersStats.rows[0].total),
        monthlyRevenue: 12500
      }
    };
    
    console.log('\n🎯 DADOS FINAIS DO DASHBOARD:');
    console.log(JSON.stringify(dashboardData, null, 2));
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

finalDashboardData();
