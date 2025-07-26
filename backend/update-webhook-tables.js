const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const updateWebhookTables = async () => {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco PostgreSQL');

    // Adicionar colunas faltantes na trading_signals
    console.log('🔧 Atualizando tabela trading_signals...');
    
    try {
      await client.query(`ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS webhook_id INTEGER;`);
      console.log('✅ Coluna webhook_id adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna webhook_id já existe');
    }

    try {
      await client.query(`ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS volume DECIMAL(20, 8);`);
      console.log('✅ Coluna volume adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna volume já existe');
    }

    try {
      await client.query(`ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS signal_timestamp TIMESTAMP;`);
      console.log('✅ Coluna signal_timestamp adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna signal_timestamp já existe');
    }

    try {
      await client.query(`ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS metadata JSONB;`);
      console.log('✅ Coluna metadata adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna metadata já existe');
    }

    try {
      await client.query(`ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      console.log('✅ Coluna updated_at adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna updated_at já existe');
    }

    // Adicionar colunas faltantes na raw_webhook
    console.log('🔧 Atualizando tabela raw_webhook...');
    
    try {
      await client.query(`ALTER TABLE raw_webhook ADD COLUMN IF NOT EXISTS ip_address INET;`);
      console.log('✅ Coluna ip_address adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna ip_address já existe');
    }

    try {
      await client.query(`ALTER TABLE raw_webhook ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      console.log('✅ Coluna created_at adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna created_at já existe');
    }

    try {
      await client.query(`ALTER TABLE raw_webhook ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      console.log('✅ Coluna updated_at adicionada');
    } catch (e) {
      console.log('ℹ️ Coluna updated_at já existe');
    }

    // Criar índices se não existirem
    console.log('📚 Criando índices...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_webhook_id ON trading_signals(webhook_id);',
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);',
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_action ON trading_signals(action);',
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_signal_timestamp ON trading_signals(signal_timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);',
      'CREATE INDEX IF NOT EXISTS idx_raw_webhook_status ON raw_webhook(status);',
      'CREATE INDEX IF NOT EXISTS idx_raw_webhook_received_at ON raw_webhook(received_at);'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (e) {
        // Índice já existe, continuar
      }
    }

    console.log('✅ Índices criados');

    // Testar inserção
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

    console.log('\n🎉 Tabelas de webhooks atualizadas com sucesso!');
    console.log('\n📋 Endpoints disponíveis:');
    console.log('   POST /api/webhooks/signal - Para sinais do TradingView');
    console.log('   POST /api/webhooks/dominance - Para dados de dominância');
    console.log('   GET /api/webhooks/signals/recent - Para consultar sinais recentes');

  } catch (error) {
    console.error('❌ Erro ao atualizar tabelas de webhook:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

updateWebhookTables();
