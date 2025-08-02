const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function verificarConstraints() {
  try {
    console.log('🔍 VERIFICANDO CONSTRAINTS DA TABELA USER_BALANCES');
    
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        cc.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'user_balances'
    `);
    
    console.log('\n📋 CONSTRAINTS ENCONTRADAS:');
    constraints.rows.forEach(row => {
      console.log(`   ${row.constraint_type}: ${row.constraint_name}`);
      if (row.check_clause) {
        console.log(`      Condição: ${row.check_clause}`);
      }
    });
    
    // Verificar se total_balance é calculado
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        is_generated,
        generation_expression
      FROM information_schema.columns 
      WHERE table_name = 'user_balances'
    `);
    
    console.log('\n📊 DETALHES DAS COLUNAS:');
    columns.rows.forEach(row => {
      console.log(`   ${row.column_name}:`);
      console.log(`      Tipo: ${row.data_type}`);
      console.log(`      Nullable: ${row.is_nullable}`);
      console.log(`      Default: ${row.column_default || 'NULL'}`);
      console.log(`      Generated: ${row.is_generated}`);
      if (row.generation_expression) {
        console.log(`      Expression: ${row.generation_expression}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarConstraints();
