const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function cleanupPartialUsers() {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway";
  
  console.log('🔗 Conectando ao banco:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Listar usuários de teste criados
    console.log('\n📋 Usuários de teste existentes:');
    const users = await client.query(`
      SELECT id, email, name, user_type, created_at 
      FROM users 
      WHERE email LIKE '%teste%' OR email LIKE '%@coinbitclub.com%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Encontrados ${users.rows.length} usuários de teste:`);
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.user_type}) - ID: ${user.id.slice(0, 8)}...`);
    });

    if (users.rows.length > 0) {
      console.log('\n🗑️ Removendo usuários de teste...');
      
      // Remover balances primeiro
      await client.query(`
        DELETE FROM user_balances 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%teste%' OR email LIKE '%@coinbitclub.com%'
        )
      `);
      console.log('✅ Balances removidos');

      // Remover affiliates
      await client.query(`
        DELETE FROM affiliates 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%teste%' OR email LIKE '%@coinbitclub.com%'
        )
      `);
      console.log('✅ Affiliates removidos');

      // Remover subscriptions
      await client.query(`
        DELETE FROM subscriptions 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%teste%' OR email LIKE '%@coinbitclub.com%'
        )
      `);
      console.log('✅ Subscriptions removidas');

      // Remover usuários
      await client.query(`
        DELETE FROM users 
        WHERE email LIKE '%teste%' OR email LIKE '%@coinbitclub.com%'
      `);
      console.log('✅ Usuários de teste removidos');
    }

    console.log('\n✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  cleanupPartialUsers()
    .then(() => {
      console.log('🎉 Script finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { cleanupPartialUsers };
