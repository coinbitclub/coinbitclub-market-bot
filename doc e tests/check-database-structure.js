// ========================================
// VERIFICAÇÃO DE ESTRUTURA DO BANCO
// ========================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estrutura do banco...\n');

    // Verificar tabelas existentes
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas existentes:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Verificar estrutura da tabela users
    console.log('\n👤 Estrutura da tabela users:');
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    if (userColumns.rows.length > 0) {
      userColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  ⚠️  Tabela users não encontrada');
    }

    // Verificar funções
    console.log('\n⚙️ Funções personalizadas:');
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    
    if (functions.rows.length > 0) {
      functions.rows.forEach(row => console.log(`  - ${row.routine_name}`));
    } else {
      console.log('  ⚠️  Nenhuma função personalizada encontrada');
    }

    // Verificar views
    console.log('\n👁️ Views:');
    const views = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (views.rows.length > 0) {
      views.rows.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('  ⚠️  Nenhuma view encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
