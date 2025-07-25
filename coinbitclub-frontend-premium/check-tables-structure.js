const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructures() {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway";
  
  console.log('🔗 Conectando ao banco:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela users
    console.log('\n📋 Estrutura da tabela users:');
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    usersStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Verificar estrutura da tabela subscriptions
    console.log('\n📋 Estrutura da tabela subscriptions:');
    const subscriptionsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      ORDER BY ordinal_position
    `);
    
    if (subscriptionsStructure.rows.length > 0) {
      subscriptionsStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('  ⚠️ Tabela subscriptions não existe');
    }

    // Verificar estrutura da tabela affiliates
    console.log('\n📋 Estrutura da tabela affiliates:');
    const affiliatesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'affiliates' 
      ORDER BY ordinal_position
    `);
    
    if (affiliatesStructure.rows.length > 0) {
      affiliatesStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('  ⚠️ Tabela affiliates não existe');
    }

    // Verificar estrutura da tabela user_balances
    console.log('\n📋 Estrutura da tabela user_balances:');
    const balancesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_balances' 
      ORDER BY ordinal_position
    `);
    
    if (balancesStructure.rows.length > 0) {
      balancesStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('  ⚠️ Tabela user_balances não existe');
    }

    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  checkTableStructures()
    .then(() => {
      console.log('🎉 Script finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { checkTableStructures };
