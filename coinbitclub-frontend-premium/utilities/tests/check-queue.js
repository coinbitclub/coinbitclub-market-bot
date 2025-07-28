const { query } = require('./src/lib/database');

async function checkQueue() {
  try {
    console.log('🔍 Verificando fila de processamento...');
    
    // Verificar sinais pendentes
    const pending = await query(`
      SELECT id, signal_id, symbol, action, status, confidence, created_at 
      FROM signal_processing_queue 
      WHERE status = 'PENDING' 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Sinais pendentes: ${pending.rows.length}`);
    
    if (pending.rows.length > 0) {
      console.log('🚨 Primeiro sinal pendente:');
      const signal = pending.rows[0];
      console.log(`   ID: ${signal.id}`);
      console.log(`   Signal ID: ${signal.signal_id}`);
      console.log(`   Symbol: ${signal.symbol}`);
      console.log(`   Action: ${signal.action}`);
      console.log(`   Confidence: ${signal.confidence}%`);
      console.log(`   Created: ${signal.created_at}`);
    }
    
    // Verificar sinais recentes
    const recent = await query(`
      SELECT id, signal_id, symbol, action, status, confidence, created_at 
      FROM signal_processing_queue 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`\n📈 Últimos 5 sinais:`);
    recent.rows.forEach((signal, i) => {
      console.log(`   ${i+1}. ID=${signal.id}, Status=${signal.status}, ${signal.symbol} ${signal.action} (${signal.confidence}%)`);
    });
    
    // Verificar estatísticas
    const stats = await query(`
      SELECT status, COUNT(*) as count 
      FROM signal_processing_queue 
      GROUP BY status
    `);
    
    console.log(`\n📊 Estatísticas por status:`);
    stats.rows.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar fila:', error.message);
  }
  
  process.exit(0);
}

checkQueue();
