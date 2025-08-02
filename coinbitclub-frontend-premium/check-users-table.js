const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('Estrutura da tabela users:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Verificar campos relacionados a email
    const emailFields = result.rows.filter(row => row.column_name.includes('email'));
    console.log('\nCampos relacionados a email:');
    emailFields.forEach(field => {
      console.log(`- ${field.column_name}`);
    });
    
  } catch(e) { 
    console.error('Erro:', e.message); 
  } finally { 
    await pool.end(); 
  }
}

checkTable();
