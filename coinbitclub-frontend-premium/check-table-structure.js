const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: false
});

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...');
    
    // Verificar colunas da tabela users
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Colunas da tabela users:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
