const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: false
});

async function buildDashboardData() {
  try {
    console.log('🔄 Construindo dados para o dashboard...\n');
    
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
    console.table(usersStats.rows);
    
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
    
    console.log('📈 Estatísticas de Trading:');
    console.table(operationsStats.rows);
    
    // 3. SINAIS DE TRADING
    const signalsStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM trading_signals
    `);
    
    console.log('📡 Estatísticas de Sinais:');
    console.table(signalsStats.rows);
    
    // 4. SINAIS IA
    const aiSignalsStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        AVG(CAST(confidence AS NUMERIC)) as avg_confidence
      FROM ai_signals
    `);
    
    console.log('🤖 Estatísticas de IA:');
    console.table(aiSignalsStats.rows);
    
    // 5. AFILIADOS
    const affiliatesStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM affiliates
    `);
    
    console.log('👥 Estatísticas de Afiliados:');
    console.table(affiliatesStats.rows);
    
    // 6. USER BALANCES (verificar estrutura primeiro)
    const balanceStructure = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_balances'
    `);
    
    console.log('\n💰 Colunas da tabela user_balances:');
    console.table(balanceStructure.rows);
    
    // Verificar alguns dados
    const balanceSample = await client.query('SELECT * FROM user_balances LIMIT 3');
    console.log('\n💰 Exemplo de saldos:');
    console.table(balanceSample.rows);
    
    // 7. OPERAÇÕES RECENTES
    const recentOperations = await client.query(`
      SELECT 
        o.id,
        o.symbol,
        o.side,
        o.profit,
        u.email as user_email,
        o.created_at
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📊 Operações Recentes:');
    console.table(recentOperations.rows);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

buildDashboardData();
