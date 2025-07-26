const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const createWebhookTables = async () => {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco PostgreSQL');

    // Criar tabela raw_webhook
    console.log('📝 Criando tabela raw_webhook...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS raw_webhook (
        id SERIAL PRIMARY KEY,
        source VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'received',
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        ip_address INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar índices para raw_webhook
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_status ON raw_webhook(status);
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_received_at ON raw_webhook(received_at);
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_payload_gin ON raw_webhook USING gin(payload);
    `);

    // Criar tabela trading_signals
    console.log('📊 Criando tabela trading_signals...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_signals (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER REFERENCES raw_webhook(id),
        symbol VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        price DECIMAL(20, 8),
        volume DECIMAL(20, 8),
        timestamp TIMESTAMP NOT NULL,
        source VARCHAR(50) DEFAULT 'tradingview',
        strategy VARCHAR(100),
        timeframe VARCHAR(20),
        metadata JSONB,
        status VARCHAR(50) DEFAULT 'received',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar índices para trading_signals
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
      CREATE INDEX IF NOT EXISTS idx_trading_signals_action ON trading_signals(action);
      CREATE INDEX IF NOT EXISTS idx_trading_signals_timestamp ON trading_signals(timestamp);
      CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
      CREATE INDEX IF NOT EXISTS idx_trading_signals_source ON trading_signals(source);
    `);

    // Criar tabela dominance_data
    console.log('📈 Criando tabela dominance_data...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS dominance_data (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER REFERENCES raw_webhook(id),
        symbol VARCHAR(20) DEFAULT 'BTC.D',
        dominance_percentage DECIMAL(5, 2) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        source VARCHAR(50) DEFAULT 'tradingview',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar índices para dominance_data
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dominance_data_symbol ON dominance_data(symbol);
      CREATE INDEX IF NOT EXISTS idx_dominance_data_timestamp ON dominance_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_dominance_data_source ON dominance_data(source);
    `);

    // Verificar se as tabelas foram criadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('raw_webhook', 'trading_signals', 'dominance_data')
      ORDER BY table_name;
    `);

    console.log('✅ Tabelas criadas com sucesso:');
    tables.rows.forEach(row => {
      console.log(`   📋 ${row.table_name}`);
    });

    console.log('\n🧪 Testando inserção de dados...');

    // Testar inserção na raw_webhook
    const testWebhook = await client.query(`
      INSERT INTO raw_webhook (source, payload, status) 
      VALUES ('test', '{"test": true}', 'received') 
      RETURNING id;
    `);
    console.log(`✅ Webhook teste inserido: ID ${testWebhook.rows[0].id}`);

    // Testar inserção na trading_signals
    await client.query(`
      INSERT INTO trading_signals (webhook_id, symbol, action, price, timestamp, source) 
      VALUES ($1, 'BTCUSDT', 'BUY', 50000.00, NOW(), 'test');
    `, [testWebhook.rows[0].id]);
    console.log('✅ Sinal de teste inserido');

    // Testar inserção na dominance_data
    await client.query(`
      INSERT INTO dominance_data (webhook_id, symbol, dominance_percentage, timestamp, source) 
      VALUES ($1, 'BTC.D', 45.50, NOW(), 'test');
    `, [testWebhook.rows[0].id]);
    console.log('✅ Dados de dominância de teste inseridos');

    // Limpar dados de teste
    await client.query(`DELETE FROM trading_signals WHERE source = 'test'`);
    await client.query(`DELETE FROM dominance_data WHERE source = 'test'`);
    await client.query(`DELETE FROM raw_webhook WHERE source = 'test'`);
    console.log('🧹 Dados de teste removidos');

    console.log('\n🎉 Todas as tabelas de webhook foram criadas e testadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas de webhook:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

createWebhookTables();
