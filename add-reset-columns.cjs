const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function addPasswordResetColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Verificar se as colunas existem
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_reset_token', 'password_reset_expires')
    `);

    console.log('📋 Colunas de reset existentes:', checkColumns.rows.map(r => r.column_name));

    if (checkColumns.rows.length < 2) {
      console.log('🔧 Adicionando colunas de reset de senha...');
      
      // Adicionar coluna de token se não existir
      if (!checkColumns.rows.find(r => r.column_name === 'password_reset_token')) {
        await client.query('ALTER TABLE users ADD COLUMN password_reset_token TEXT');
        console.log('✅ Coluna password_reset_token adicionada');
      }

      // Adicionar coluna de expiração se não existir
      if (!checkColumns.rows.find(r => r.column_name === 'password_reset_expires')) {
        await client.query('ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP WITH TIME ZONE');
        console.log('✅ Coluna password_reset_expires adicionada');
      }
    } else {
      console.log('✅ Colunas de reset já existem');
    }

    // Verificar estrutura final
    const finalCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%reset%'
      ORDER BY column_name
    `);

    console.log('\n📋 Colunas de reset finais:');
    finalCheck.rows.forEach(row => {
      console.log(`• ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

addPasswordResetColumns();
