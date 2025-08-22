// SCRIPT SIMPLES PARA TESTAR DASHBOARD COM DADOS MÍNIMOS
console.log('🔧 CRIANDO DADOS MÍNIMOS PARA DASHBOARD...');

const { Pool } = require('pg');

// Configuração do banco de dados (Railway PostgreSQL)
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function createMinimalData() {
  try {
    console.log('📊 Inserindo dados básicos...');
    
    // 1. Inserir alguns system_monitoring logs
    await pool.query(`
      INSERT INTO system_monitoring (event_type, success, created_at)
      VALUES 
        ('AUTO_TRADE_EXECUTION', true, NOW() - INTERVAL '1 hour'),
        ('WEBHOOK_PROCESSED', true, NOW() - INTERVAL '2 hours'),
        ('MARKET_ANALYSIS', true, NOW() - INTERVAL '3 hours'),
        ('POSITION_OPENED', true, NOW() - INTERVAL '4 hours'),
        ('SIGNAL_RECEIVED', false, NOW() - INTERVAL '5 hours')
    `);

    // 2. Inserir algumas métricas do sistema
    await pool.query(`
      INSERT INTO real_time_metrics (metric_type, metric_value, created_at)
      VALUES 
        ('SYSTEM_MEMORY', 156.7, NOW() - INTERVAL '10 minutes'),
        ('SYSTEM_MEMORY', 162.3, NOW() - INTERVAL '5 minutes'),
        ('SYSTEM_MEMORY', 148.9, NOW())
    `);

    console.log('✅ DADOS MÍNIMOS CRIADOS!');
    console.log('🌐 Dashboard disponível em: http://localhost:3000/dashboard');
    
    // Mostrar estatísticas básicas
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM system_monitoring) as total_logs,
        (SELECT COUNT(*) FROM real_time_metrics) as total_metrics
    `);
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`├─ Logs de Sistema: ${stats.rows[0].total_logs}`);
    console.log(`└─ Métricas: ${stats.rows[0].total_metrics}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
createMinimalData();
