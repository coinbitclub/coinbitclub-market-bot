// Script simples para aplicar migration financeira
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function applyFinancialMigration() {
  console.log('🚀 Aplicando Migration do Sistema Financeiro...');
  
  try {
    // Verificar se já foi aplicada
    const check = await pool.query("SELECT * FROM schema_migrations WHERE version = '005_stripe_financial_system.sql'");
    
    if (check.rows.length > 0) {
      console.log('✅ Migration 005_stripe_financial_system.sql já aplicada!');
      return;
    }
    
    console.log('📦 Lendo arquivo de migration...');
    const migrationSQL = fs.readFileSync('./migrations/005_stripe_financial_system.sql', 'utf8');
    
    console.log('🔄 Executando migration...');
    await pool.query('BEGIN');
    
    // Executar a migration
    await pool.query(migrationSQL);
    
    // Registrar como aplicada
    await pool.query(
      "INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())",
      ['005_stripe_financial_system.sql']
    );
    
    await pool.query('COMMIT');
    
    console.log('✅ Migration 005_stripe_financial_system.sql aplicada com sucesso!');
    
    // Verificar tabelas criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('coupons', 'coupon_usage', 'affiliates', 'referrals', 'commission_payments', 'user_subscriptions', 'payment_history')
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas do sistema financeiro criadas:');
    tables.rows.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Erro ao aplicar migration:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

applyFinancialMigration();
