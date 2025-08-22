const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkCouponsTable() {
  try {
    // Verificar se existe tabela coupons
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'coupon%'
    `);
    
    console.log('📋 Tabelas relacionadas a cupons:', result.rows);
    
    if (result.rows.length > 0) {
      // Verificar estrutura da tabela coupons
      try {
        const columns = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'coupons'
          ORDER BY ordinal_position
        `);
        
        console.log('📊 Estrutura da tabela coupons existente:');
        columns.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        // Se a tabela existe mas não tem expires_at, vamos dropar e recriar
        const hasExpiresAt = columns.rows.some(col => col.column_name === 'expires_at');
        if (!hasExpiresAt) {
          console.log('⚠️ Tabela coupons existe mas está incompleta. Dropando para recriar...');
          await pool.query('DROP TABLE IF EXISTS coupon_usage CASCADE');
          await pool.query('DROP TABLE IF EXISTS coupons CASCADE');
          console.log('✅ Tabelas antigas removidas');
        }
        
      } catch (error) {
        console.log('❌ Erro ao verificar estrutura:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkCouponsTable();
