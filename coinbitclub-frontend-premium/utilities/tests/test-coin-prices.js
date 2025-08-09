const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function fixCoinPricesIndexes() {
  console.log('🔧 Corrigindo índices da tabela coin_prices...');
  
  try {
    // Criar índices corretos
    console.log('📊 Criando índices...');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_coin_prices_symbol_date 
      ON coin_prices(symbol, created_at DESC)
    `);
    console.log('✅ Índice symbol + data criado');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_coin_prices_coin_id 
      ON coin_prices(coin_id)
    `);
    console.log('✅ Índice coin_id criado');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_coin_prices_created_at 
      ON coin_prices(created_at DESC)
    `);
    console.log('✅ Índice created_at criado');
    
    // Testar inserção
    console.log('\n🧪 Testando inserção na tabela...');
    await query(`
      INSERT INTO coin_prices (
        coin_id, symbol, name, price, market_cap, 
        volume_24h, change_1d, change_7d, rank
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
    `, [
      'bitcoin-test',
      'BTC',
      'Bitcoin Test',
      50000.00,
      1000000000000,
      30000000000.00,
      2.5,
      -1.2,
      1
    ]);
    
    console.log('✅ Teste de inserção bem-sucedido');
    
    // Verificar os dados
    const testData = await query('SELECT * FROM coin_prices WHERE coin_id = $1', ['bitcoin-test']);
    console.log('📊 Dados inseridos:', testData.rows.length, 'registros');
    
    if (testData.rows.length > 0) {
      console.log('   Exemplo:', testData.rows[0].symbol, testData.rows[0].price);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixCoinPricesIndexes();
