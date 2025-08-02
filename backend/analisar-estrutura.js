const { Pool } = require('pg');

// Usar a conexão correta fornecida pelo usuário
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false
});

async function analisarEstruturaBanco() {
  try {
    console.log('🔍 ANALISANDO ESTRUTURA DO BANCO');
    console.log('🔗 Conexão: maglev.proxy.rlwy.net:42095');

    // 1. Verificar estrutura da tabela operations
    console.log('\n📋 ESTRUTURA DA TABELA OPERATIONS:');
    const opsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'operations' 
      ORDER BY ordinal_position
    `);
    
    opsStructure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Verificar alguns registros de operations
    console.log('\n📊 AMOSTRA DE DADOS DA TABELA OPERATIONS:');
    const opsSample = await pool.query('SELECT id, user_id, created_at FROM operations LIMIT 3');
    opsSample.rows.forEach(row => {
      console.log(`   ID: ${row.id} | USER_ID: ${row.user_id} (tipo: ${typeof row.user_id})`);
    });

    // 3. Verificar estrutura da tabela users
    console.log('\n👥 ESTRUTURA DA TABELA USERS:');
    const usersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    usersStructure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 4. Verificar relação entre users e operations
    console.log('\n🔗 VERIFICANDO RELAÇÃO USERS <-> OPERATIONS:');
    const relationCheck = await pool.query(`
      SELECT DISTINCT 
        u.id as user_id_int,
        o.user_id as operations_user_id,
        u.name
      FROM users u
      LEFT JOIN operations o ON u.id::text = o.user_id
      LIMIT 5
    `);
    
    relationCheck.rows.forEach(row => {
      console.log(`   User ID (int): ${row.user_id_int} | Operations User ID: ${row.operations_user_id} | Nome: ${row.name}`);
    });

    // 5. Contar operações por conversão de tipo
    console.log('\n📈 CONTAGEM DE OPERAÇÕES:');
    const opsCount = await pool.query(`
      SELECT COUNT(*) as total_operations FROM operations
    `);
    console.log(`   Total de operações: ${opsCount.rows[0].total_operations}`);

    const validOpsCount = await pool.query(`
      SELECT COUNT(*) as valid_ops 
      FROM operations o
      INNER JOIN users u ON u.id::text = o.user_id
    `);
    console.log(`   Operações com usuários válidos: ${validOpsCount.rows[0].valid_ops}`);

    console.log('\n✅ ANÁLISE CONCLUÍDA');
    console.log('💡 DESCOBERTA: user_id em operations é STRING, em users é INTEGER');
    console.log('🔧 SOLUÇÃO: Usar conversão u.id::text = o.user_id');

  } catch (error) {
    console.error('❌ Erro durante análise:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar análise
analisarEstruturaBanco();
