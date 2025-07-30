const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function limparDadosTeste() {
  try {
    console.log('🗑️ INICIANDO LIMPEZA DE DADOS DE TESTE...');
    console.log('=' .repeat(50));
    
    // 1. Verificar operações atuais
    console.log('📊 VERIFICANDO OPERAÇÕES ATUAIS:');
    const operacoesAtuais = await pool.query(`
      SELECT id, symbol, side, user_name, created_at 
      FROM user_operations 
      ORDER BY id
    `);
    
    console.log(`   Total de operações: ${operacoesAtuais.rows.length}`);
    operacoesAtuais.rows.forEach(op => {
      console.log(`   Op ${op.id}: ${op.symbol} ${op.side} - ${op.user_name} (${op.created_at})`);
    });
    
    // 2. Remover TODAS as operações (são todas de teste)
    console.log('\n🗑️ REMOVENDO TODAS AS OPERAÇÕES DE TESTE:');
    const deleteOps = await pool.query('DELETE FROM user_operations');
    console.log(`   ✅ ${deleteOps.rowCount} operações removidas`);
    
    // 3. Verificar sinais recentes
    console.log('\n📡 VERIFICANDO SINAIS RECENTES:');
    const sinaisRecentes = await pool.query(`
      SELECT id, symbol, action, created_at, processing_status
      FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '2 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`   Sinais das últimas 2 horas: ${sinaisRecentes.rows.length}`);
    sinaisRecentes.rows.forEach(signal => {
      console.log(`   Sinal ${signal.id}: ${signal.symbol} ${signal.action} - ${signal.processing_status} (${signal.created_at})`);
    });
    
    // 4. Remover sinais muito antigos (manter apenas últimas 2 horas)
    console.log('\n🧹 LIMPANDO SINAIS ANTIGOS:');
    const deleteSignals = await pool.query(`
      DELETE FROM trading_signals 
      WHERE created_at < NOW() - INTERVAL '2 hours'
    `);
    console.log(`   ✅ ${deleteSignals.rowCount} sinais antigos removidos`);
    
    // 5. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    const finalOps = await pool.query('SELECT COUNT(*) as total FROM user_operations');
    const finalSignals = await pool.query('SELECT COUNT(*) as total FROM trading_signals');
    
    console.log(`   📊 Operações restantes: ${finalOps.rows[0].total}`);
    console.log(`   📡 Sinais restantes: ${finalSignals.rows[0].total}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('🚀 SISTEMA PRONTO PARA OPERAÇÃO REAL!');
    console.log('📈 Próximos sinais serão de produção real');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('🔌 Conexão com banco fechada');
  }
}

// Executar limpeza
limparDadosTeste().catch(console.error);
