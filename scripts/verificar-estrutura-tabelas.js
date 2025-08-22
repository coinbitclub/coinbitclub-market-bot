const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

async function verificarEstrutura() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    
    console.log('📋 ESTRUTURA DAS TABELAS');
    console.log('========================');
    
    // Verificar system_metrics
    const metrics = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'system_metrics' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 system_metrics:');
    metrics.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Verificar system_alerts
    const alerts = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'system_alerts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🚨 system_alerts:');
    alerts.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarEstrutura().catch(console.error);
