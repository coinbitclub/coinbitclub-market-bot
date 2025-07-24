import dotenv from 'dotenv';
import pkg from 'pg';

// Carregar variáveis de ambiente
dotenv.config();

const { Pool } = pkg;

console.log('🔍 Testando conexão PostgreSQL Railway...');
console.log('📝 DATABASE_URL:', process.env.DATABASE_URL ? 'CARREGADA' : 'NÃO ENCONTRADA');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Teste de conexão
async function testConnection() {
  try {
    console.log('🚀 Iniciando teste de conexão...');
    
    const client = await pool.connect();
    console.log('✅ Conectado com sucesso ao PostgreSQL Railway!');
    
    // Teste simples de query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Dados do servidor:', result.rows[0]);
    
    // Testar se tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.length);
    console.log('🗂️ Primeiras 10 tabelas:', tablesResult.rows.slice(0, 10).map(t => t.table_name));
    
    client.release();
    
    // Testar conexão do controller
    console.log('\n🔧 Testando query de usuários...');
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log('👥 Total de usuários:', usersResult.rows[0].total);
    
    console.log('\n✅ TODOS OS TESTES PASSARAM! A conexão está funcionando.');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes do erro:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();
