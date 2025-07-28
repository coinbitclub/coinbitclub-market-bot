const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addEmailVerifiedColumn() {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway";
  
  console.log('🔗 Conectando ao banco:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna is_email_verified já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_email_verified'
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      console.log('🔧 Adicionando coluna is_email_verified...');
      
      const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL
      `;
      
      await client.query(addColumnQuery);
      console.log('✅ Coluna is_email_verified adicionada com sucesso');
    } else {
      console.log('✅ Coluna is_email_verified já existe');
    }

    // Verificar estrutura final da tabela users
    console.log('\n📋 Estrutura atual da tabela users:');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    tableStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  addEmailVerifiedColumn()
    .then(() => {
      console.log('🎉 Script finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { addEmailVerifiedColumn };
