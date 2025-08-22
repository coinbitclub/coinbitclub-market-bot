const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function cleanFinancialTables() {
  try {
    console.log('🧹 Limpando todas as tabelas do sistema financeiro...');
    
    // Lista de tabelas relacionadas ao sistema financeiro
    const financialTables = [
      'payment_history',
      'commission_payments', 
      'referrals',
      'affiliates',
      'user_subscriptions',
      'coupon_usage',
      'coupons',
      'coupon_stats',
      'affiliate_stats'
    ];
    
    // Dropar views primeiro
    console.log('🔄 Removendo views...');
    await pool.query('DROP VIEW IF EXISTS affiliate_stats CASCADE');
    await pool.query('DROP VIEW IF EXISTS coupon_stats CASCADE');
    
    // Dropar tabelas em ordem reversa (para evitar problemas de FK)
    for (const table of financialTables) {
      try {
        console.log(`🗑️ Removendo tabela ${table}...`);
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      } catch (error) {
        console.log(`  ⚠️ ${table}: ${error.message}`);
      }
    }
    
    console.log('✅ Limpeza concluída!');
    
    // Verificar tabelas restantes
    const remaining = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas restantes no banco:');
    remaining.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
  } finally {
    await pool.end();
  }
}

cleanFinancialTables();
