const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function verificarTabelaBalances() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA USER_BALANCES');
    
    // Primeiro, verificar se a tabela existe
    const tablesExist = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%balance%'
      OR table_name LIKE '%wallet%'
      OR table_name LIKE '%account%'
    `);
    
    console.log('\n📋 TABELAS RELACIONADAS A BALANÇOS/CONTAS:');
    tablesExist.rows.forEach(row => {
      console.log(`   📊 ${row.table_name}`);
    });
    
    if (tablesExist.rows.length === 0) {
      console.log('\n⚠️ Nenhuma tabela de balanço encontrada');
      
      // Verificar se existe campo balance na tabela users
      const userBalance = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name LIKE '%balance%'
      `);
      
      console.log('\n💰 CAMPOS DE BALANÇO NA TABELA USERS:');
      userBalance.rows.forEach(row => {
        console.log(`   💰 ${row.column_name}: ${row.data_type}`);
      });
      
    } else {
      // Verificar estrutura de cada tabela encontrada
      for (const table of tablesExist.rows) {
        console.log(`\n📊 ESTRUTURA DA TABELA ${table.table_name.toUpperCase()}:`);
        
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
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTabelaBalances();
