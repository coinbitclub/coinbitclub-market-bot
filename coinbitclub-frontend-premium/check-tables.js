const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tabelas disponíveis:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
  } catch(e) { 
    console.error('Erro:', e.message); 
  } finally { 
    await pool.end(); 
  }
}

checkTables();
