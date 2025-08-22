const { Client } = require('pg');

async function verificarEstrutura() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway' 
  });
  
  try {
    await client.connect();
    
    // Verificar estrutura da tabela coupons
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'coupons' 
      ORDER BY ordinal_position
    `);
    
    console.log('Estrutura da tabela coupons:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarEstrutura();
