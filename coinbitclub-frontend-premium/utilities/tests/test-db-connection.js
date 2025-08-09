const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: false
});

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com PostgreSQL...');
    
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL!');
    
    // Teste básico de query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query de teste executada:', result.rows[0]);
    
    // Verificar se existem tabelas de usuários
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'trade_operations', 'affiliates')
    `);
    
    console.log('✅ Tabelas encontradas:', tablesCheck.rows);
    
    // Se tiver tabela users, contar registros
    if (tablesCheck.rows.some(row => row.table_name === 'users')) {
      const userCount = await client.query('SELECT COUNT(*) as total FROM users');
      console.log('👥 Total de usuários:', userCount.rows[0].total);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
