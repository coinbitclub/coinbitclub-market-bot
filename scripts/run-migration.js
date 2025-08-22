// Script para executar migração específica do sistema 2FA
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  // Configuração do banco
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Lê o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'migrations', '007_monitoring_system.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📋 Executando migração do sistema de Monitoramento...');
    
    // Executa a migração
    await pool.query(migrationSql);
    
    console.log('✅ Migração 006_two_factor_system.sql executada com sucesso!');
    
    // Verifica se as tabelas foram criadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%2fa%' OR table_name LIKE '%sms%'
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas 2FA criadas:');
    result.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
