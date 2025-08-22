const { Client } = require('pg');

console.log('🔧 CORREÇÃO PASSO A PASSO');

const client = new Client({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function executarCorrecoes() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // PASSO 1: Corrigir system_metrics
    console.log('\n📊 PASSO 1: Corrigindo system_metrics...');
    
    await client.query(`ALTER TABLE system_metrics ADD COLUMN IF NOT EXISTS metric_type VARCHAR(50)`);
    console.log('✅ Coluna metric_type adicionada');
    
    await client.query(`
      INSERT INTO system_metrics (metric_value, metric_type, created_at)
      VALUES 
        (75.5, 'CPU_USAGE', NOW()),
        (67.2, 'MEMORY_USAGE', NOW()),
        (150.0, 'RESPONSE_TIME', NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Métricas com tipo inseridas');

    // PASSO 2: Corrigir system_alerts
    console.log('\n🚨 PASSO 2: Corrigindo system_alerts...');
    
    await client.query(`ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'`);
    console.log('✅ Coluna status adicionada');
    
    await client.query(`ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'MEDIUM'`);
    console.log('✅ Coluna severity adicionada');
    
    await client.query(`
      INSERT INTO system_alerts (title, message, alert_type, status, severity, created_at)
      VALUES 
        ('High CPU Alert', 'CPU usage exceeded 80%', 'WARNING', 'ACTIVE', 'HIGH', NOW()),
        ('Memory Warning', 'Memory usage is high', 'WARNING', 'ACTIVE', 'MEDIUM', NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Alertas ativos inseridos');

    console.log('\n🎯 Sprint 4 corrigido! Verificando...');
    
    const metricsCheck = await client.query(`
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE metric_type IS NOT NULL) as with_type
      FROM system_metrics
    `);
    console.log(`Métricas: ${metricsCheck.rows[0].total} total, ${metricsCheck.rows[0].with_type} com tipo`);
    
    const alertsCheck = await client.query(`
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'ACTIVE') as active
      FROM system_alerts
    `);
    console.log(`Alertas: ${alertsCheck.rows[0].total} total, ${alertsCheck.rows[0].active} ativos`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

executarCorrecoes();
