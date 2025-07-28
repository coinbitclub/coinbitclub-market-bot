const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: false
});

async function analyzeData() {
  try {
    console.log('🔍 Analisando dados para o dashboard...\n');
    
    const client = await pool.connect();
    
    // Verificar trading_signals (estrutura primeiro)
    const signalsStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trading_signals' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela trading_signals:');
    console.table(signalsStructure.rows);
    
    // Buscar dados de trading_signals
    const tradingSignals = await client.query(`
      SELECT id, symbol, action, price, source, created_at 
      FROM trading_signals 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n📈 Sinais de trading recentes:');
    console.table(tradingSignals.rows);
    
    // Verificar ai_signals
    const aiSignals = await client.query(`
      SELECT * FROM ai_signals 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    console.log('\n🤖 Sinais IA:');
    console.table(aiSignals.rows);
    
    // User balances
    const userBalances = await client.query(`
      SELECT user_id, balance, currency 
      FROM user_balances 
      LIMIT 5
    `);
    console.log('\n💰 Saldos dos usuários:');
    console.table(userBalances.rows);
    
    // System monitoring
    const systemMonitoring = await client.query(`
      SELECT * FROM vw_system_monitoring 
      LIMIT 3
    `);
    console.log('\n🖥️ Monitoramento do sistema:');
    console.table(systemMonitoring.rows);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeData();
