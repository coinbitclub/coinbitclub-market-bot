const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const checkAndCreateWebhookTables = async () => {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco PostgreSQL');

    // Verificar tabelas existentes
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('raw_webhook', 'trading_signals', 'dominance_data')
      ORDER BY table_name;
    `);

    console.log('📋 Tabelas existentes:');
    existingTables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Verificar se raw_webhook existe
    const rawWebhookExists = existingTables.rows.some(row => row.table_name === 'raw_webhook');
    
    if (!rawWebhookExists) {
      console.log('📝 Criando tabela raw_webhook...');
      await client.query(`
        CREATE TABLE raw_webhook (
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
        CREATE INDEX idx_raw_webhook_source ON raw_webhook(source);
      `);
      await client.query(`
        CREATE INDEX idx_raw_webhook_status ON raw_webhook(status);
      `);
      await client.query(`
        CREATE INDEX idx_raw_webhook_received_at ON raw_webhook(received_at);
      `);
      await client.query(`
        CREATE INDEX idx_raw_webhook_payload_gin ON raw_webhook USING gin(payload);
      `);
      
      console.log('✅ Tabela raw_webhook criada');
    } else {
      console.log('✅ Tabela raw_webhook já existe');
    }

    // Verificar se trading_signals existe
    const tradingSignalsExists = existingTables.rows.some(row => row.table_name === 'trading_signals');
    
    if (!tradingSignalsExists) {
      console.log('📊 Criando tabela trading_signals...');
      await client.query(`
        CREATE TABLE trading_signals (
          id SERIAL PRIMARY KEY,
          webhook_id INTEGER REFERENCES raw_webhook(id),
          symbol VARCHAR(50) NOT NULL,
          action VARCHAR(20) NOT NULL,
          price DECIMAL(20, 8),
          volume DECIMAL(20, 8),
          signal_timestamp TIMESTAMP NOT NULL,
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
        CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol);
      `);
      await client.query(`
        CREATE INDEX idx_trading_signals_action ON trading_signals(action);
      `);
      await client.query(`
        CREATE INDEX idx_trading_signals_timestamp ON trading_signals(signal_timestamp);
      `);
      await client.query(`
        CREATE INDEX idx_trading_signals_status ON trading_signals(status);
      `);
      await client.query(`
        CREATE INDEX idx_trading_signals_source ON trading_signals(source);
      `);
      
      console.log('✅ Tabela trading_signals criada');
    } else {
      console.log('✅ Tabela trading_signals já existe');
    }

    // Verificar se dominance_data existe
    const dominanceDataExists = existingTables.rows.some(row => row.table_name === 'dominance_data');
    
    if (!dominanceDataExists) {
      console.log('📈 Criando tabela dominance_data...');
      await client.query(`
        CREATE TABLE dominance_data (
          id SERIAL PRIMARY KEY,
          webhook_id INTEGER REFERENCES raw_webhook(id),
          symbol VARCHAR(20) DEFAULT 'BTC.D',
          dominance_percentage DECIMAL(5, 2) NOT NULL,
          signal_timestamp TIMESTAMP NOT NULL,
          source VARCHAR(50) DEFAULT 'tradingview',
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Criar índices para dominance_data
      await client.query(`
        CREATE INDEX idx_dominance_data_symbol ON dominance_data(symbol);
      `);
      await client.query(`
        CREATE INDEX idx_dominance_data_timestamp ON dominance_data(signal_timestamp);
      `);
      await client.query(`
        CREATE INDEX idx_dominance_data_source ON dominance_data(source);
      `);
      
      console.log('✅ Tabela dominance_data criada');
    } else {
      console.log('✅ Tabela dominance_data já existe');
    }

    // Verificar tabelas finais
    const finalTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('raw_webhook', 'trading_signals', 'dominance_data')
      ORDER BY table_name;
    `);

    console.log('\n✅ Tabelas de webhook disponíveis:');
    finalTables.rows.forEach(row => {
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
      INSERT INTO trading_signals (webhook_id, symbol, action, price, signal_timestamp, source) 
      VALUES ($1, 'BTCUSDT', 'BUY', 50000.00, NOW(), 'test');
    `, [testWebhook.rows[0].id]);
    console.log('✅ Sinal de teste inserido');

    // Testar inserção na dominance_data
    await client.query(`
      INSERT INTO dominance_data (webhook_id, symbol, dominance_percentage, signal_timestamp, source) 
      VALUES ($1, 'BTC.D', 45.50, NOW(), 'test');
    `, [testWebhook.rows[0].id]);
    console.log('✅ Dados de dominância de teste inseridos');

    // Limpar dados de teste
    await client.query(`DELETE FROM trading_signals WHERE source = 'test'`);
    await client.query(`DELETE FROM dominance_data WHERE source = 'test'`);
    await client.query(`DELETE FROM raw_webhook WHERE source = 'test'`);
    console.log('🧹 Dados de teste removidos');

    console.log('\n🎉 Sistema de webhooks configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao configurar tabelas de webhook:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

checkAndCreateWebhookTables();
