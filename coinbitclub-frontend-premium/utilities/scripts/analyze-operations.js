const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: false
});

async function analyzeOperationsTable() {
  try {
    console.log('🔍 Analisando tabela operations...\n');
    
    const client = await pool.connect();
    
    // Verificar estrutura da tabela operations
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'operations' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela operations:');
    console.table(structure.rows);
    
    // Dados da tabela operations
    const operations = await client.query('SELECT * FROM operations LIMIT 5');
    console.log('\n📊 Dados da tabela operations:');
    console.table(operations.rows);
    
    // Verificar trading_signals
    const tradingSignals = await client.query(`
      SELECT id, symbol, action, price, confidence, source, created_at 
      FROM trading_signals 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n📈 Sinais de trading recentes:');
    console.table(tradingSignals.rows);
    
    // Verificar vw_trading_dashboard (view)
    const dashboardView = await client.query('SELECT * FROM vw_trading_dashboard LIMIT 3');
    console.log('\n📊 View vw_trading_dashboard:');
    console.table(dashboardView.rows);
    
    // Verificar vw_operations_summary
    const operationsSummary = await client.query('SELECT * FROM vw_operations_summary LIMIT 3');
    console.log('\n📈 View vw_operations_summary:');
    console.table(operationsSummary.rows);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeOperationsTable();
