// ========================================
// MARKETBOT - EXECUTAR MIGRATION 014
// Script para aplicar migration do dashboard
// ========================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration014() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando Migration 014 - Dashboard Tables...');
    
    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, 'migrations', '014_dashboard_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar migration
    await client.query('BEGIN');
    
    console.log('📋 Executando migration do dashboard...');
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration 014 executada com sucesso!');
    
    // Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_sessions', 'system_metrics', 'system_alerts', 'audit_log', 'performance_metrics', 'websocket_connections')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tabelas de dashboard criadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verificar métricas iniciais
    const metricsResult = await client.query(`
      SELECT metric_name, metric_value 
      FROM system_metrics 
      ORDER BY metric_name
    `);
    
    console.log('\n📈 Métricas iniciais criadas:');
    metricsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.metric_name}: ${row.metric_value}`);
    });
    
    // Verificar alertas iniciais
    const alertsResult = await client.query(`
      SELECT title, alert_type 
      FROM system_alerts 
      WHERE is_resolved = false
    `);
    
    console.log('\n🚨 Alertas ativos:');
    alertsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.alert_type}: ${row.title}`);
    });
    
    console.log('\n🎉 Sistema de dashboard pronto para uso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migration 014:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration014()
    .then(() => {
      console.log('\n✅ Migration 014 concluída com sucesso');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Falha na Migration 014:', error);
      process.exit(1);
    });
}

module.exports = { runMigration014 };
