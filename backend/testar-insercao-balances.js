const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function testarInsercao() {
  try {
    console.log('🔍 TESTANDO INSERÇÃO NA TABELA USER_BALANCES');
    
    // Primeiro, vamos tentar inserir só com os campos obrigatórios
    console.log('\n🔄 Tentativa 1: Só campos obrigatórios...');
    
    try {
      await pool.query(`
        INSERT INTO user_balances (
          user_id, exchange, currency
        ) VALUES (
          28, 'bybit', 'BRL'
        )
      `);
      console.log('   ✅ Inserção básica funcionou!');
    } catch (error) {
      console.log(`   ❌ Erro na inserção básica: ${error.message}`);
    }
    
    // Tentar sem total_balance
    console.log('\n🔄 Tentativa 2: Sem total_balance...');
    
    try {
      await pool.query(`
        INSERT INTO user_balances (
          user_id, exchange, currency, available_balance
        ) VALUES (
          28, 'bybit', 'USD', 500.00
        )
      `);
      console.log('   ✅ Inserção sem total_balance funcionou!');
    } catch (error) {
      console.log(`   ❌ Erro sem total_balance: ${error.message}`);
    }
    
    // Ver o que foi inserido
    const result = await pool.query('SELECT * FROM user_balances WHERE user_id = 28');
    console.log('\n📊 REGISTROS INSERIDOS:');
    result.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Exchange: ${row.exchange}, Currency: ${row.currency}`);
      console.log(`   Available: ${row.available_balance}, Total: ${row.total_balance}`);
    });
    
    // Limpar os testes
    await pool.query('DELETE FROM user_balances WHERE user_id = 28');
    console.log('\n🗑️ Registros de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testarInsercao();
