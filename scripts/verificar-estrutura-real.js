const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function verificarEstrutura() {
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO ESTRUTURA REAL');

    // Ver colunas de system_metrics
    const metricsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'system_metrics' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 system_metrics colunas:');
    metricsColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) default: ${row.column_default}`);
    });

    // Ver dados existentes
    const existingData = await client.query('SELECT * FROM system_metrics LIMIT 3');
    console.log('\n📊 system_metrics dados existentes:');
    existingData.rows.forEach(row => {
      console.log('  ', row);
    });

    // Ver colunas de system_alerts
    const alertsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'system_alerts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🚨 system_alerts colunas:');
    alertsColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) default: ${row.column_default}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarEstrutura();
