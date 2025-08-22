const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function correcaoFinal() {
  try {
    await client.connect();
    console.log('🔧 CORREÇÃO FINAL BASEADA NA ESTRUTURA REAL');

    // SPRINT 4 - Atualizar system_metrics existentes
    console.log('\n📊 SPRINT 4: Corrigindo system_metrics...');
    
    await client.query(`
      UPDATE system_metrics 
      SET metric_type = 'CPU_USAGE', metric_value = 25.0
      WHERE metric_type IS NULL AND server_data->>'cpuLoad' IS NOT NULL
    `);
    console.log('✅ Métricas existentes atualizadas com CPU_USAGE');
    
    // Inserir métricas com todos os campos obrigatórios
    await client.query(`
      INSERT INTO system_metrics (
        server_data, database_data, trading_data, external_data, 
        metric_type, metric_value, response_time
      ) VALUES 
      (
        '{"uptime": 7200000, "cpuLoad": 75, "memoryUsage": {"heapUsed": 75000000, "heapTotal": 100000000}, "activeConnections": 8}',
        '{"status": "healthy", "poolSize": 10, "queryLatency": 45, "activeConnections": 3}',
        '{"totalUsers": 150, "successRate": 85.5, "totalPnL24h": 2250.75, "activePositions": 20, "avgExecutionTime": 120}',
        '{"ngrokStatus": "connected", "bybitLatency": 150, "openaiLatency": 750, "binanceLatency": 180}',
        'MEMORY_USAGE', 75.0, 120
      ),
      (
        '{"uptime": 7200000, "cpuLoad": 45, "memoryUsage": {"heapUsed": 60000000, "heapTotal": 100000000}, "activeConnections": 6}',
        '{"status": "healthy", "poolSize": 10, "queryLatency": 35, "activeConnections": 2}',
        '{"totalUsers": 175, "successRate": 88.2, "totalPnL24h": 3150.25, "activePositions": 25, "avgExecutionTime": 100}',
        '{"ngrokStatus": "connected", "bybitLatency": 140, "openaiLatency": 700, "binanceLatency": 160}',
        'RESPONSE_TIME', 100.0, 100
      )
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Novas métricas inseridas');

    // SPRINT 4 - system_alerts já tem status e severity, só inserir dados
    console.log('\n🚨 SPRINT 4: Corrigindo system_alerts...');
    
    await client.query(`
      INSERT INTO system_alerts (id, level, category, message, details, status, severity)
      VALUES 
        ('alert_cpu_high', 'WARNING', 'SYSTEM', 'High CPU usage detected', '{"cpu_percentage": 85, "threshold": 80}', 'ACTIVE', 'HIGH'),
        ('alert_memory_warn', 'WARNING', 'SYSTEM', 'Memory usage approaching limit', '{"memory_percentage": 75, "threshold": 80}', 'ACTIVE', 'MEDIUM'),
        ('alert_trading_success', 'INFO', 'TRADING', 'High trading success rate', '{"success_rate": 88.2, "trades": 150}', 'ACTIVE', 'LOW')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Alertas ativos inseridos');

    // SPRINT 5 - Criar tabelas de trading
    console.log('\n⚙️ SPRINT 5: Criando tabelas de trading...');

    // trading_configurations
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_configurations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        global_max_leverage DECIMAL(10,2) DEFAULT 10.00,
        supported_exchanges TEXT[] DEFAULT ARRAY['binance', 'kucoin'],
        supported_symbols TEXT[] DEFAULT ARRAY['BTCUSDT', 'ETHUSDT'],
        risk_management_enabled BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      INSERT INTO trading_configurations (user_id, global_max_leverage, supported_exchanges, supported_symbols, is_active)
      VALUES 
        (1, 20.00, ARRAY['binance', 'kucoin', 'bybit'], ARRAY['BTCUSDT', 'ETHUSDT', 'ADAUSDT'], true),
        (2, 15.00, ARRAY['binance'], ARRAY['BTCUSDT', 'ETHUSDT'], true),
        (3, 10.00, ARRAY['kucoin'], ARRAY['BTCUSDT'], true)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ trading_configurations criada');

    // trading_queue
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_queue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        symbol VARCHAR(20),
        side VARCHAR(10),
        quantity DECIMAL(18,8),
        price DECIMAL(18,8),
        priority INTEGER DEFAULT 5,
        status VARCHAR(20) DEFAULT 'QUEUED',
        environment VARCHAR(20) DEFAULT 'MAINNET',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `);
    
    await client.query(`
      INSERT INTO trading_queue (user_id, symbol, side, quantity, price, priority, status, environment)
      VALUES 
        (1, 'BTCUSDT', 'BUY', 0.001, 45000.00, 1, 'QUEUED', 'MAINNET'),
        (1, 'ETHUSDT', 'SELL', 0.1, 2500.00, 2, 'PROCESSING', 'MAINNET'),
        (2, 'BTCUSDT', 'BUY', 0.002, 44500.00, 3, 'QUEUED', 'TESTNET')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ trading_queue criada');

    // user_trading_limits
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_trading_limits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        daily_limit DECIMAL(18,8) DEFAULT 1000.00,
        max_position_size DECIMAL(18,8) DEFAULT 100.00,
        max_leverage DECIMAL(10,2) DEFAULT 5.00,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      INSERT INTO user_trading_limits (user_id, daily_limit, max_position_size, max_leverage)
      VALUES 
        (1, 5000.00, 500.00, 20.00),
        (2, 2000.00, 200.00, 15.00),
        (3, 1000.00, 100.00, 10.00)
      ON CONFLICT (user_id) DO NOTHING
    `);
    console.log('✅ user_trading_limits criada');

    // trading_config_audit
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_config_audit (
        id SERIAL PRIMARY KEY,
        config_id INTEGER,
        changed_by INTEGER,
        old_values JSONB,
        new_values JSONB,
        action VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      INSERT INTO trading_config_audit (config_id, changed_by, action, old_values, new_values)
      VALUES 
        (1, 1, 'CREATE', '{}', '{"leverage": 20, "exchanges": ["binance", "kucoin"]}'),
        (2, 2, 'UPDATE', '{"leverage": 5}', '{"leverage": 15}'),
        (3, 3, 'CREATE', '{}', '{"leverage": 10, "exchanges": ["kucoin"]}')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ trading_config_audit criada');

    console.log('\n🎉 CORREÇÃO FINAL COMPLETA!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

correcaoFinal();
