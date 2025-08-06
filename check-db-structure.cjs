const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Verificar estrutura da tabela users
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estrutura da tabela users:');
    result.rows.forEach(row => {
      console.log(`• ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar alguns usuários existentes
    const usersResult = await client.query('SELECT id, email, role, status FROM users LIMIT 3');
    console.log('\n👥 Usuários existentes:');
    usersResult.rows.forEach(user => {
      console.log(`• ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
