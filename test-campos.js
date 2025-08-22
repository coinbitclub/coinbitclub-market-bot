// Teste simples para descobrir campos da tabela users
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testarCampos() {
  try {
    console.log('🔍 Descobrindo campos da tabela users...');
    
    // Tentar diferentes nomes de campos
    const queries = [
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'",
      "SELECT * FROM users LIMIT 1",
      "SELECT email FROM users LIMIT 1"
    ];

    for (let i = 0; i < queries.length; i++) {
      try {
        console.log(`\n📋 Query ${i + 1}: ${queries[i]}`);
        const result = await pool.query(queries[i]);
        console.log('✅ Resultado:', result.rows);
        
        if (i === 0) {
          console.log('📊 Campos disponíveis:');
          result.rows.forEach(row => console.log(`   - ${row.column_name}`));
        }
      } catch (error) {
        console.log(`❌ Erro na query ${i + 1}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

testarCampos();
