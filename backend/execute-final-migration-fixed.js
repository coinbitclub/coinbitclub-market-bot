const { Pool } = require('pg');

// Configuração da conexão com o banco PostgreSQL do Railway
const DATABASE_URL = 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function executeMigration() {
  console.log('🚀 INICIANDO MIGRAÇÃO FINAL DO BANCO DE DADOS');
  console.log('=============================================');
  
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL do Railway');
    
    // Verificar se já existem tabelas
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Tabelas existentes: ${existingTables.rows.length}`);
    existingTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Script SQL completo para migração (sem gen_random_bytes)
    const migrationSQL = `
      -- ==========================================
      -- MIGRAÇÃO COMPLETA COINBITCLUB MARKET BOT
      -- Data: ${new Date().toISOString()}
      -- ==========================================
      
      -- Tabela principal para webhooks recebidos
      CREATE TABLE IF NOT EXISTS raw_webhook (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'received',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        server_id VARCHAR(100),
        version VARCHAR(50),
        error_message TEXT,
        retry_count INTEGER DEFAULT 0
      );
      
      -- Índices para otimização
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_created_at ON raw_webhook(created_at);
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_status ON raw_webhook(status);
      CREATE INDEX IF NOT EXISTS idx_raw_webhook_payload_gin ON raw_webhook USING gin(payload);
      
      -- Tabela de configurações do sistema
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        api_key VARCHAR(255) UNIQUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Tabela de sinais do TradingView
      CREATE TABLE IF NOT EXISTS tradingview_signals (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell', 'close')),
        price DECIMAL(15,8),
        strategy VARCHAR(100),
        timestamp TIMESTAMP DEFAULT NOW(),
        processed BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        webhook_id INTEGER REFERENCES raw_webhook(id)
      );
      
      -- Índices para tradingview_signals
      CREATE INDEX IF NOT EXISTS idx_tradingview_signals_symbol ON tradingview_signals(symbol);
      CREATE INDEX IF NOT EXISTS idx_tradingview_signals_action ON tradingview_signals(action);
      CREATE INDEX IF NOT EXISTS idx_tradingview_signals_timestamp ON tradingview_signals(timestamp);
      CREATE INDEX IF NOT EXISTS idx_tradingview_signals_processed ON tradingview_signals(processed);
      
      -- Tabela de transações/operações
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        signal_id INTEGER REFERENCES tradingview_signals(id),
        transaction_type VARCHAR(20) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        amount DECIMAL(15,8),
        price DECIMAL(15,8),
        status VARCHAR(20) DEFAULT 'pending',
        exchange_response JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        executed_at TIMESTAMP
      );
      
      -- Trigger para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Aplicar trigger nas tabelas necessárias
      DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
      CREATE TRIGGER update_system_config_updated_at
        BEFORE UPDATE ON system_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    console.log('📥 Executando migração SQL...');
    await client.query(migrationSQL);
    console.log('✅ Estrutura do banco criada com sucesso!');
    
    // Inserir configurações iniciais
    console.log('⚙️ Inserindo configurações do sistema...');
    await client.query(`
      INSERT INTO system_config (config_key, config_value, description) VALUES
      ($1, $2, $3),
      ($4, $5, $6),
      ($7, $8, $9),
      ($10, $11, $12),
      ($13, $14, $15),
      ($16, $17, $18),
      ($19, $20, $21),
      ($22, $23, $24)
      ON CONFLICT (config_key) DO UPDATE SET 
        config_value = EXCLUDED.config_value,
        updated_at = NOW()
    `, [
      'migration_version', '2.0.0', 'Versão da migração atual',
      'migration_date', new Date().toISOString(), 'Data da última migração',
      'project_name', 'coinbitclub-market-bot-v3', 'Nome do projeto Railway',
      'api_version', '1.0.0', 'Versão da API',
      'webhook_enabled', 'true', 'Habilitar recepção de webhooks',
      'max_webhook_retries', '3', 'Máximo de tentativas para processar webhooks',
      'rate_limit_requests', '1000', 'Limite de requisições por hora',
      'rate_limit_window', '3600', 'Janela de tempo para rate limit (segundos)'
    ]);
    
    // Inserir usuário admin padrão (com API key manual)
    console.log('👤 Criando usuário admin...');
    const apiKey = `cbm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await client.query(`
      INSERT INTO users (email, name, role, status, api_key) VALUES
      ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@coinbitclub.com', 'Admin', 'admin', 'active', apiKey]);
    
    // Verificar tabelas criadas
    const newTablesResult = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 TABELAS CRIADAS:');
    newTablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name} (${row.column_count} colunas)`);
    });
    
    // Verificar configurações inseridas
    const configResult = await client.query('SELECT config_key, config_value FROM system_config ORDER BY config_key');
    console.log('⚙️ CONFIGURAÇÕES DO SISTEMA:');
    configResult.rows.forEach(row => {
      console.log(`  🔧 ${row.config_key}: ${row.config_value}`);
    });
    
    // Verificar usuários criados
    const usersResult = await client.query('SELECT email, name, role, status, api_key FROM users');
    console.log('👥 USUÁRIOS CRIADOS:');
    usersResult.rows.forEach(row => {
      console.log(`  👤 ${row.email} (${row.name}) - ${row.role} [${row.status}]`);
      console.log(`     🔑 API Key: ${row.api_key}`);
    });
    
    // Testar inserção de dados
    console.log('🧪 Testando inserção de webhook...');
    const testWebhook = await client.query(`
      INSERT INTO raw_webhook (source, payload, status) 
      VALUES ($1, $2, $3) 
      RETURNING id, created_at
    `, ['test', JSON.stringify({ test: true, timestamp: new Date() }), 'received']);
    
    console.log(`✅ Webhook teste inserido: ID ${testWebhook.rows[0].id}`);
    
    // Estatísticas finais
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM raw_webhook) as webhooks_count,
        (SELECT COUNT(*) FROM system_config) as config_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM tradingview_signals) as signals_count,
        (SELECT COUNT(*) FROM transactions) as transactions_count
    `);
    
    console.log('📊 ESTATÍSTICAS FINAIS:');
    console.log(`  📡 Webhooks: ${stats.rows[0].webhooks_count}`);
    console.log(`  ⚙️ Configurações: ${stats.rows[0].config_count}`);
    console.log(`  👥 Usuários: ${stats.rows[0].users_count}`);
    console.log(`  📈 Sinais: ${stats.rows[0].signals_count}`);
    console.log(`  💰 Transações: ${stats.rows[0].transactions_count}`);
    
    client.release();
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS:');
    console.log('  1. ✅ Banco de dados migrado e configurado');
    console.log('  2. 🧪 Teste o servidor: GET/POST nos endpoints');
    console.log('  3. 📡 Configure webhooks do TradingView');
    console.log('  4. 🔍 Monitore os logs para verificar funcionamento');
    
  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar migração
executeMigration();
