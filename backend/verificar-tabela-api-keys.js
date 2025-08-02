const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function verificarTabelaApiKeys() {
  try {
    console.log('🔍 VERIFICANDO TABELAS RELACIONADAS A API KEYS');
    
    const tablesExist = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%api%'
        OR table_name LIKE '%key%'
        OR table_name LIKE '%bybit%'
        OR table_name LIKE '%exchange%'
      )
    `);
    
    console.log('\n📋 TABELAS RELACIONADAS A API/CHAVES:');
    if (tablesExist.rows.length === 0) {
      console.log('   ⚠️ Nenhuma tabela de API encontrada');
    } else {
      tablesExist.rows.forEach(row => {
        console.log(`   🔑 ${row.table_name}`);
      });
      
      // Verificar estrutura de cada tabela encontrada
      for (const table of tablesExist.rows) {
        console.log(`\n🔑 ESTRUTURA DA TABELA ${table.table_name.toUpperCase()}:`);
        
        const columns = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table.table_name]);
        
        columns.rows.forEach(row => {
          const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
          console.log(`   ${row.column_name}: ${row.data_type} ${nullable}${defaultVal}`);
        });
      }
    }
    
    // Verificar se existe campo api_key na tabela users
    console.log('\n🔑 CAMPOS DE API NA TABELA USERS:');
    const userApiFields = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND (
        column_name LIKE '%api%'
        OR column_name LIKE '%key%'
        OR column_name LIKE '%secret%'
        OR column_name LIKE '%bybit%'
      )
    `);
    
    if (userApiFields.rows.length === 0) {
      console.log('   ⚠️ Nenhum campo de API encontrado na tabela users');
    } else {
      userApiFields.rows.forEach(row => {
        console.log(`   🔑 users.${row.column_name}: ${row.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTabelaApiKeys();
