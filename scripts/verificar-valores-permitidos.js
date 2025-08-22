const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function verificarValoresPermitidos() {
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO VALORES PERMITIDOS');

    // Ver valores únicos existentes
    const levels = await client.query('SELECT DISTINCT level FROM system_alerts');
    console.log('\n📊 Levels existentes:', levels.rows.map(r => r.level));

    const categories = await client.query('SELECT DISTINCT category FROM system_alerts');
    console.log('📊 Categories existentes:', categories.rows.map(r => r.category));

    const statuses = await client.query('SELECT DISTINCT status FROM system_alerts');
    console.log('📊 Status existentes:', statuses.rows.map(r => r.status));

    const severities = await client.query('SELECT DISTINCT severity FROM system_alerts');
    console.log('📊 Severities existentes:', severities.rows.map(r => r.severity));

    // Tentar inserir com valores conhecidos
    console.log('\n🔧 Tentando inserir com valores existentes...');
    
    const level = levels.rows[0]?.level || 'INFO';
    const category = categories.rows[0]?.category || 'general';
    
    await client.query(`
      INSERT INTO system_alerts (id, level, category, message, details, status, severity)
      VALUES 
        ('alert_test_1', '${level}', '${category}', 'Test alert for validation', '{"test": true}', 'ACTIVE', 'MEDIUM')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log(`✅ Alert inserido com level: ${level}, category: ${category}`);

    // Verificar contagem final
    const count = await client.query('SELECT COUNT(*) as count FROM system_alerts WHERE status = \'ACTIVE\'');
    console.log(`✅ Total de alertas ativos: ${count.rows[0].count}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarValoresPermitidos();
