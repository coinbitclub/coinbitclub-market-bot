console.log('🔗 Testando conexão com PostgreSQL Railway...');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function testAll() {
  try {
    // Test database connection
    console.log('\n📊 Testando banco de dados...');
    const dbResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Banco conectado:', dbResult.rows[0].current_time);
    
    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users LIMIT 1');
    console.log('✅ Tabela users acessível. Total de usuários:', usersResult.rows[0].count);
    
    // Test operations table
    const opsResult = await pool.query('SELECT COUNT(*) as count FROM operations LIMIT 1');
    console.log('✅ Tabela operations acessível. Total de operações:', opsResult.rows[0].count);
    
    console.log('\n🎉 Todos os testes passaram! O banco está funcionando corretamente.');
    console.log('\n📝 Próximos passos:');
    console.log('1. Iniciar API Gateway: cd backend/api-gateway && npm start');
    console.log('2. Iniciar Admin Panel: cd backend/admin-panel && npm start');
    console.log('3. Iniciar Frontend: cd coinbitclub-frontend-premium && npm run dev');
    console.log('\n🌐 URLs dos serviços:');
    console.log('• API Gateway: http://localhost:8081');
    console.log('• Admin Panel: http://localhost:8082'); 
    console.log('• Frontend: http://localhost:3000');
    console.log('• Admin Area: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  } finally {
    await pool.end();
  }
}

testAll();
