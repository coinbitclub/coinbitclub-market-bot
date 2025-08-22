const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FYHVNKLIXYmRWdRLKNnYdCXhGNsgjLSr@autorack.proxy.rlwy.net:39170/railway'
});

async function checkStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela trading_positions...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trading_positions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Colunas encontradas:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Verificar se existem registros
    const countResult = await pool.query('SELECT COUNT(*) FROM trading_positions');
    console.log(`\n📊 Total de registros: ${countResult.rows[0].count}`);
    
    // Verificar algumas linhas se existirem
    if (parseInt(countResult.rows[0].count) > 0) {
      const sampleResult = await pool.query('SELECT * FROM trading_positions LIMIT 3');
      console.log('\n📄 Exemplo de registros:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`${index + 1}:`, row);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkStructure();
