// ========================================
// CORREÇÃO URGENTE - TABELA TRADING_POSITIONS
// Adicionar coluna notes faltante
// ========================================

const { Pool } = require('pg');

async function corrigirTabelaTrading() {
  const pool = new Pool({
    connectionString: "postgresql://postgres:bYvbYSSLlSRlEQlRddFzLiwqfFYgoLAV@junction.proxy.rlwy.net:17592/railway",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Iniciando correção da tabela trading_positions...');
    
    // 1. Verificar se coluna notes existe
    const checkColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trading_positions' 
      AND column_name = 'notes'
    `;
    
    const checkResult = await pool.query(checkColumn);
    
    if (checkResult.rows.length === 0) {
      console.log('📝 Coluna notes não existe. Adicionando...');
      
      // 2. Adicionar coluna notes
      await pool.query(`
        ALTER TABLE trading_positions 
        ADD COLUMN notes TEXT
      `);
      
      console.log('✅ Coluna notes adicionada com sucesso!');
    } else {
      console.log('✅ Coluna notes já existe!');
    }
    
    // 3. Verificar estrutura atual da tabela
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trading_positions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estrutura atual da tabela trading_positions:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 4. Verificar se há posições existentes
    const positionsCount = await pool.query(`
      SELECT COUNT(*) as total FROM trading_positions
    `);
    
    console.log(`\n📈 Total de posições existentes: ${positionsCount.rows[0].total}`);
    
    console.log('\n✅ Correção da tabela concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na correção da tabela:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar correção
corrigirTabelaTrading()
  .then(() => {
    console.log('🎉 Processo de correção finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Falha crítica:', error);
    process.exit(1);
  });
