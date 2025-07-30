const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarELimpar() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS...');
    
    // Verificar tabelas existentes
    const tabelas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:');
    tabelas.rows.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Verificar estrutura da tabela user_operations
    console.log('\n📊 ESTRUTURA DA TABELA user_operations:');
    const colunas = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_operations'
      ORDER BY ordinal_position
    `);
    
    if (colunas.rows.length > 0) {
      console.log('   Colunas:');
      colunas.rows.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));
      
      // Verificar dados na tabela
      const dados = await pool.query('SELECT * FROM user_operations LIMIT 5');
      console.log(`\n   Total de registros: ${dados.rows.length}`);
      
      if (dados.rows.length > 0) {
        console.log('   Primeiros registros:');
        dados.rows.forEach((row, idx) => {
          console.log(`   ${idx + 1}:`, JSON.stringify(row, null, 2));
        });
        
        // LIMPAR TODOS OS DADOS DE TESTE
        console.log('\n🗑️ REMOVENDO TODOS OS REGISTROS DE TESTE...');
        const deleteResult = await pool.query('DELETE FROM user_operations');
        console.log(`✅ ${deleteResult.rowCount} registros removidos!`);
      }
    } else {
      console.log('   ⚠️ Tabela user_operations não encontrada ou sem colunas');
    }
    
    // Verificar e limpar trading_signals também
    console.log('\n📡 LIMPANDO SINAIS ANTIGOS...');
    const deleteSignals = await pool.query(`
      DELETE FROM trading_signals 
      WHERE created_at < NOW() - INTERVAL '1 hour'
    `);
    console.log(`✅ ${deleteSignals.rowCount} sinais antigos removidos`);
    
    console.log('\n✅ LIMPEZA CONCLUÍDA!');
    console.log('🚀 Sistema pronto para operação real sem dados de teste');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarELimpar().catch(console.error);
