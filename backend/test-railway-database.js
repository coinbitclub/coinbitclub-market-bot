// Teste específico do banco de dados Railway
const { Pool } = require('pg');

console.log('🔍 TESTANDO BANCO DE DADOS RAILWAY');
console.log('================================');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function testDatabase() {
  try {
    console.log('⏳ Conectando ao PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida!');
    
    // Teste básico
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('🕐 Hora atual do banco:', timeResult.rows[0].current_time);
    
    // Verificar versão
    const versionResult = await client.query('SELECT version() as pg_version');
    console.log('📊 PostgreSQL Version:', versionResult.rows[0].pg_version.substring(0, 50) + '...');
    
    // Listar tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log('   - ' + row.table_name);
      });
    } else {
      console.log('   ⚠️ Nenhuma tabela encontrada - banco vazio');
    }
    
    // Teste de inserção básica (se não existir tabela, criar)
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP DEFAULT NOW(),
          message TEXT
        )
      `);
      
      await client.query(`
        INSERT INTO test_connection (message) 
        VALUES ('Teste de conexão - ' || NOW())
      `);
      
      const testResult = await client.query(`
        SELECT * FROM test_connection 
        ORDER BY timestamp DESC 
        LIMIT 3
      `);
      
      console.log('✅ Teste de inserção OK - últimos registros:');
      testResult.rows.forEach(row => {
        console.log(`   ${row.id}: ${row.message} (${row.timestamp})`);
      });
      
    } catch (testError) {
      console.log('⚠️ Erro no teste de inserção:', testError.message);
    }
    
    client.release();
    console.log('✅ BANCO DE DADOS FUNCIONANDO PERFEITAMENTE!');
    
  } catch (error) {
    console.error('❌ ERRO NA CONEXÃO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testDatabase();
