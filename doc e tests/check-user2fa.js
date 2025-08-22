// ========================================
// VERIFICAR ESTRUTURA DA TABELA USER_2FA
// ========================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkUser2FA() {
  try {
    console.log('🔍 Verificando estrutura da tabela user_2fa...\n');

    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_2fa'
      ORDER BY ordinal_position
    `);
    
    if (columns.rows.length > 0) {
      console.log('📋 Colunas da tabela user_2fa:');
      columns.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  ⚠️  Tabela user_2fa não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser2FA();
