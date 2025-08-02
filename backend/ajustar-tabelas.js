const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function ajustarTabelas() {
  try {
    console.log('🔧 AJUSTANDO TABELAS EXISTENTES');
    console.log('═'.repeat(40));

    // 1. VERIFICAR ESTRUTURA DAS TABELAS
    console.log('\n1️⃣ VERIFICANDO ESTRUTURAS EXISTENTES');
    
    const operations = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'operations'
      ORDER BY ordinal_position
    `);

    console.log('   📊 Estrutura da tabela operations:');
    if (operations.rows.length > 0) {
      operations.rows.forEach(col => {
        console.log(`      ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('      ⚠️ Tabela operations não existe');
    }

    const signals = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'signals'
      ORDER BY ordinal_position
    `);

    console.log('\n   📡 Estrutura da tabela signals:');
    if (signals.rows.length > 0) {
      signals.rows.forEach(col => {
        console.log(`      ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('      ⚠️ Tabela signals não existe');
    }

    // 2. AJUSTAR OU RECRIAR TABELAS
    console.log('\n2️⃣ AJUSTANDO TABELAS');

    // Remover e recriar operations se necessário
    if (operations.rows.length > 0) {
      await pool.query('DROP TABLE IF EXISTS operations CASCADE');
      console.log('   🗑️ Tabela operations removida');
    }

    // Criar operations com estrutura correta
    await pool.query(`
      CREATE TABLE operations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        exchange VARCHAR(50) DEFAULT 'bybit',
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL, -- 'buy' ou 'sell'
        quantity DECIMAL(20,8) NOT NULL,
        entry_price DECIMAL(20,8),
        exit_price DECIMAL(20,8),
        status VARCHAR(20) DEFAULT 'pending',
        profit_loss DECIMAL(20,8) DEFAULT 0,
        fees DECIMAL(20,8) DEFAULT 0,
        opened_at TIMESTAMP DEFAULT NOW(),
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('   ✅ Tabela operations recriada');

    // Ajustar signals se necessário
    if (signals.rows.length > 0) {
      await pool.query('DROP TABLE IF EXISTS signals CASCADE');
      console.log('   🗑️ Tabela signals removida');
    }

    await pool.query(`
      CREATE TABLE signals (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL, -- 'buy' ou 'sell'
        entry_price DECIMAL(20,8),
        target_price DECIMAL(20,8),
        stop_loss DECIMAL(20,8),
        confidence DECIMAL(5,2) DEFAULT 75.00,
        status VARCHAR(20) DEFAULT 'active',
        source VARCHAR(50) DEFAULT 'ai_analysis',
        timeframe VARCHAR(10) DEFAULT '1h',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('   ✅ Tabela signals recriada');

    // 3. INSERIR DADOS DE EXEMPLO
    console.log('\n3️⃣ INSERINDO DADOS DE EXEMPLO');

    // Operações
    await pool.query(`
      INSERT INTO operations (user_id, symbol, side, quantity, entry_price, exit_price, status, profit_loss, opened_at, closed_at) VALUES
      (4, 'BTCUSDT', 'buy', 0.001, 45000.00, 45250.00, 'completed', 2.50, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours'),
      (30, 'ETHUSDT', 'sell', 0.05, 3200.00, 3180.00, 'completed', -10.00, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours'),
      (31, 'BTCUSDT', 'buy', 0.002, 45100.00, NULL, 'active', 0, NOW() - INTERVAL '2 hours', NULL),
      (4, 'ADAUSDT', 'buy', 100, 1.25, 1.28, 'completed', 30.00, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'),
      (30, 'SOLUSDT', 'buy', 5, 180.00, NULL, 'active', 0, NOW() - INTERVAL '45 minutes', NULL),
      (31, 'ETHUSDT', 'buy', 0.1, 3150.00, 3200.00, 'completed', 50.00, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours')
    `);

    console.log('   ✅ 6 operações inseridas');

    // Sinais
    await pool.query(`
      INSERT INTO signals (symbol, side, entry_price, target_price, stop_loss, confidence, source) VALUES
      ('BTCUSDT', 'buy', 45000.00, 46500.00, 44000.00, 85.5, 'ai_analysis'),
      ('ETHUSDT', 'sell', 3200.00, 3100.00, 3300.00, 78.2, 'technical_analysis'),
      ('ADAUSDT', 'buy', 1.25, 1.35, 1.20, 82.1, 'momentum_analysis'),
      ('SOLUSDT', 'buy', 180.00, 195.00, 175.00, 76.8, 'volume_analysis'),
      ('DOGEUSDT', 'sell', 0.08, 0.075, 0.085, 71.3, 'sentiment_analysis'),
      ('BNBUSDT', 'buy', 300.00, 320.00, 290.00, 79.6, 'ai_analysis')
    `);

    console.log('   ✅ 6 sinais inseridos');

    // 4. VERIFICAÇÃO FINAL
    console.log('\n4️⃣ VERIFICAÇÃO FINAL');

    const finalCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM operations) as total_operations,
        (SELECT COUNT(*) FROM operations WHERE status = 'active') as active_operations,
        (SELECT COUNT(*) FROM signals) as total_signals,
        (SELECT COUNT(*) FROM signals WHERE status = 'active') as active_signals,
        (SELECT SUM(profit_loss) FROM operations WHERE status = 'completed') as total_profit
    `);

    const fc = finalCheck.rows[0];

    console.log('   📊 DADOS INSERIDOS:');
    console.log(`   📈 Operações: ${fc.total_operations} (${fc.active_operations} ativas)`);
    console.log(`   📡 Sinais: ${fc.total_signals} (${fc.active_signals} ativos)`);
    console.log(`   💰 Lucro total: $${fc.total_profit || 0}`);

    // Verificar usuários
    const userActivity = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 minutes' THEN 1 END) as recent_activity
      FROM users WHERE status = 'active'
    `);

    const ua = userActivity.rows[0];
    console.log(`   👥 Usuários: ${ua.total_users} (${ua.recent_activity} com atividade recente)`);

    console.log('\n✅ TABELAS AJUSTADAS E DADOS INSERIDOS COM SUCESSO!');
    console.log('🎯 Sistema pronto para funcionar com dados realistas');

  } catch (error) {
    console.error('❌ Erro durante ajuste:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

ajustarTabelas();
