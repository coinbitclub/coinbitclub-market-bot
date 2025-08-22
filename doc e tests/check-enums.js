// ========================================
// VERIFICAÇÃO DE ENUMS E MIGRAÇÃO
// ========================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkEnums() {
  try {
    console.log('🔍 Verificando ENUMs...\n');

    // Verificar valores permitidos para user_type
    const userTypes = await pool.query(`
      SELECT unnest(enum_range(NULL::user_type)) as allowed_values
    `);
    
    console.log('👤 Valores permitidos para user_type:');
    userTypes.rows.forEach(row => console.log(`  - ${row.allowed_values}`));

    // Verificar valores permitidos para user_status
    const userStatus = await pool.query(`
      SELECT unnest(enum_range(NULL::user_status)) as allowed_values
    `);
    
    console.log('\n📊 Valores permitidos para user_status:');
    userStatus.rows.forEach(row => console.log(`  - ${row.allowed_values}`));

    // Verificar se tables de segurança existem
    console.log('\n🔒 Verificando tabelas de segurança:');
    const securityTables = ['blocked_ips', 'blocked_devices', 'system_settings', 'suspicious_activities'];
    
    for (const table of securityTables) {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      console.log(`  - ${table}: ${exists.rows[0].exists ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnums();
