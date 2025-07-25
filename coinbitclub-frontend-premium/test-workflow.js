const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function testCompleteWorkflow() {
  console.log('🔍 Testando workflow completo...\n');
  
  try {
    // 1. Verificar sinais recentes
    console.log('1️⃣ Verificando sinais recentes...');
    const recentSignals = await query(`
      SELECT ts.id, ts.symbol, ts.action, ts.created_at,
             spq.id as queue_id, spq.status
      FROM trading_signals ts
      LEFT JOIN signal_processing_queue spq ON ts.id = spq.signal_id
      ORDER BY ts.created_at DESC
      LIMIT 5
    `);
    
    console.log(`📊 Últimos ${recentSignals.rows.length} sinais:`);
    recentSignals.rows.forEach((signal, i) => {
      console.log(`   ${i+1}. ID=${signal.id}, ${signal.symbol} ${signal.action}, Queue Status: ${signal.status || 'N/A'}`);
    });
    
    // 2. Verificar estatísticas
    console.log('\n2️⃣ Verificando estatísticas...');
    const stats = await query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today_signals
      FROM trading_signals
    `);
    
    const queueStats = await query(`
      SELECT status, COUNT(*) as count
      FROM signal_processing_queue
      GROUP BY status
    `);
    
    console.log(`📈 Total de sinais: ${stats.rows[0].total_signals}`);
    console.log(`📅 Sinais hoje: ${stats.rows[0].today_signals}`);
    console.log('📋 Status da fila:');
    queueStats.rows.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count}`);
    });
    
    // 3. Testar criação de um novo sinal para processamento
    console.log('\n3️⃣ Criando sinal de teste...');
    
    // Simular webhook TradingView
    const testSignal = {
      symbol: 'ETHUSDT',
      action: 'STRONG_SELL',
      price: 3200.50,
      strategy: 'breakdown',
      rsi: 25,
      volume: 987654
    };
    
    const response = await fetch('http://localhost:3001/api/webhooks/tradingview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSignal)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sinal criado:', result.signalId);
      
      // Aguardar um pouco e processar
      setTimeout(async () => {
        console.log('\n4️⃣ Processando sinal...');
        const processResponse = await fetch('http://localhost:3001/api/services/signal-processor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (processResponse.ok) {
          const processResult = await processResponse.json();
          console.log('✅ Processamento concluído');
          console.log('📊 Resultado:', JSON.stringify(processResult, null, 2));
        }
        
        await pool.end();
      }, 2000);
      
    } else {
      console.log('❌ Erro ao criar sinal:', response.status);
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    await pool.end();
  }
}

testCompleteWorkflow();
