const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function verificarConstraints() {
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO CONSTRAINTS');

    // Ver constraints da tabela system_alerts
    const constraints = await client.query(`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        consrc AS constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'system_alerts'::regclass
    `);
    
    console.log('\n🚨 system_alerts constraints:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.constraint_type} - ${row.constraint_definition}`);
    });

    // Ver dados existentes em system_alerts
    const existingAlerts = await client.query('SELECT * FROM system_alerts LIMIT 3');
    console.log('\n🚨 system_alerts dados existentes:');
    existingAlerts.rows.forEach(row => {
      console.log('  ', {
        id: row.id,
        level: row.level,
        category: row.category,
        message: row.message.substring(0, 50) + '...',
        status: row.status,
        severity: row.severity
      });
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarConstraints();
