const { Pool } = require('pg');

// Configuração de conexão Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:ZJQIWGTaPdaHUbfOFHTyJCnhqCKXCGAC@maglev.proxy.rlwy.net:42095/railway',
  ssl: false
});

async function verificarEstrutura() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA OPERATIONS');
    
    // Verificar estrutura da tabela operations
    const structureRes = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'operations' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 ESTRUTURA DA TABELA OPERATIONS:');
    structureRes.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar alguns registros de exemplo
    const sampleRes = await pool.query(`
      SELECT id, user_id, signal_id, created_at 
      FROM operations 
      LIMIT 5
    `);
    
    console.log('\n📊 EXEMPLOS DE REGISTROS:');
    sampleRes.rows.forEach(row => {
      console.log(`  ID: ${row.id} (tipo: ${typeof row.id})`);
      console.log(`  USER_ID: ${row.user_id} (tipo: ${typeof row.user_id})`);
      console.log(`  SIGNAL_ID: ${row.signal_id} (tipo: ${typeof row.signal_id})`);
      console.log(`  ---`);
    });
    
    // Verificar se há user_id inteiros vs UUIDs
    const userIdTypes = await pool.query(`
      SELECT DISTINCT user_id, 
             CASE 
               WHEN user_id ~ '^[0-9]+$' THEN 'INTEGER'
               WHEN user_id ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN 'UUID'
               ELSE 'OTHER'
             END as id_type
      FROM operations 
      ORDER BY user_id
    `);
    
    console.log('\n🔍 TIPOS DE USER_ID ENCONTRADOS:');
    userIdTypes.rows.forEach(row => {
      console.log(`  ${row.user_id} -> ${row.id_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarEstrutura();
