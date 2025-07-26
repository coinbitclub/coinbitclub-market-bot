/**
 * 🔍 VERIFICAR ESTRUTURA DO BANCO ANTES DA MIGRAÇÃO
 * Diagnóstico das tabelas existentes
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO');
  
  try {
    const client = await pool.connect();
    
    // Verificar se tabela users existe
    const usersTable = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    if (usersTable.rows.length > 0) {
      console.log('✅ Tabela users encontrada:');
      usersTable.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ Tabela users NÃO encontrada');
    }
    
    // Verificar todas as tabelas
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 TODAS AS TABELAS:');
    allTables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verificar funções existentes
    const functions = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      ORDER BY routine_name
    `);
    
    console.log('\n🔧 FUNÇÕES EXISTENTES:');
    if (functions.rows.length > 0) {
      functions.rows.forEach(row => {
        console.log(`   - ${row.routine_name}`);
      });
    } else {
      console.log('   Nenhuma função encontrada');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
