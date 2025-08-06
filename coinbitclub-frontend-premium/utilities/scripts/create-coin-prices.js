const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function createCoinPricesTable() {
  console.log('🏗️ Criando tabela coin_prices...');
  
  try {
    // Primeiro verificar se a tabela existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'coin_prices'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela coin_prices já existe');
      return;
    }
    
    // Criar a tabela com sintaxe correta para PostgreSQL
    await query(`
      CREATE TABLE coin_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coin_id VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(20,8),
        market_cap BIGINT,
        volume_24h DECIMAL(20,8),
        change_1d DECIMAL(10,4),
        change_7d DECIMAL(10,4),
        rank INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tabela coin_prices criada com sucesso');
    
    // Criar índice único separadamente
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_prices_unique_daily 
      ON coin_prices(coin_id, DATE(created_at))
    `);
    
    console.log('✅ Índice único criado');
    
    // Criar outros índices
    await query(`
      CREATE INDEX IF NOT EXISTS idx_coin_prices_symbol_date 
      ON coin_prices(symbol, created_at DESC)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_coin_prices_coin_id 
      ON coin_prices(coin_id)
    `);
    
    console.log('✅ Índices de performance criados');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela coin_prices:', error.message);
  } finally {
    await pool.end();
  }
}

createCoinPricesTable();
