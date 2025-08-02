const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function verificarTamanhosCampos() {
  try {
    console.log('🔍 VERIFICANDO TAMANHOS DOS CAMPOS DA TABELA USERS');
    
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 ESTRUTURA DETALHADA DA TABELA USERS:');
    result.rows.forEach(row => {
      const maxLength = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
      
      console.log(`   ${row.column_name}: ${row.data_type}${maxLength} ${nullable}${defaultVal}`);
    });
    
    console.log('\n⚠️ CAMPOS COM LIMITAÇÕES DE TAMANHO:');
    const limitedFields = result.rows.filter(row => 
      row.character_maximum_length && row.character_maximum_length <= 10
    );
    
    limitedFields.forEach(field => {
      console.log(`   ⚠️ ${field.column_name}: máximo ${field.character_maximum_length} caracteres`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTamanhosCampos();
