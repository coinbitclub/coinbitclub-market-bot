const { Client } = require('pg');

async function verificarEstruturasTabelas() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway' 
  });
  
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO ESTRUTURAS DAS TABELAS');
    
    // Verificar system_metrics
    try {
      const metrics = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'system_metrics' 
        ORDER BY ordinal_position
      `);
      console.log('Colunas system_metrics:', metrics.rows.map(r => r.column_name));
    } catch (e) {
      console.log('system_metrics não existe');
    }
    
    // Verificar system_alerts
    try {
      const alerts = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'system_alerts' 
        ORDER BY ordinal_position
      `);
      console.log('Colunas system_alerts:', alerts.rows.map(r => r.column_name));
    } catch (e) {
      console.log('system_alerts não existe ou erro');
    }
    
    // Verificar trading_configurations
    try {
      const trading = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'trading_configurations' 
        ORDER BY ordinal_position
      `);
      console.log('Colunas trading_configurations:', trading.rows.map(r => r.column_name));
    } catch (e) {
      console.log('trading_configurations não existe');
    }
    
    // Verificar trading_queue
    try {
      const queue = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'trading_queue' 
        ORDER BY ordinal_position
      `);
      console.log('Colunas trading_queue:', queue.rows.map(r => r.column_name));
    } catch (e) {
      console.log('trading_queue não existe');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarEstruturasTabelas();
