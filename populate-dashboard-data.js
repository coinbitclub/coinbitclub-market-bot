// SCRIPT DE TESTE PARA DASHBOARD - POPULANDO DADOS REAIS
console.log('🔧 POPULANDO DADOS REAIS PARA DASHBOARD...');

const { Pool } = require('pg');

// Configuração do banco de dados (Railway PostgreSQL)
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function populateTestData() {
  try {
    console.log('📊 Criando usuários de teste...');
    
    // 1. Criar usuários de teste se não existirem
    await pool.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, user_status, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'trader1@marketbot.com', 'demo_hash_123', 'João', 'Silva', 'ACTIVE', NOW() - INTERVAL '30 days', NOW()),
        (gen_random_uuid(), 'trader2@marketbot.com', 'demo_hash_456', 'Maria', 'Santos', 'ACTIVE', NOW() - INTERVAL '20 days', NOW()),
        (gen_random_uuid(), 'trader3@marketbot.com', 'demo_hash_789', 'Pedro', 'Oliveira', 'ACTIVE', NOW() - INTERVAL '15 days', NOW())
      ON CONFLICT (email) DO NOTHING
    `);

    // 2. Criar contas de exchange para os usuários
    console.log('🔗 Criando contas de exchange...');
    await pool.query(`
      INSERT INTO user_exchange_accounts (id, user_id, exchange, account_name, api_key, api_secret, is_active, can_trade, is_testnet, created_at)
      SELECT 
        gen_random_uuid(),
        u.id,
        'BYBIT',
        u.first_name || '_ACCOUNT',
        'demo_' || substring(md5(random()::text), 1, 16),
        'secret_' || substring(md5(random()::text), 1, 32),
        true,
        true,
        true,
        NOW()
      FROM users u
      WHERE u.user_status = 'ACTIVE'
      ON CONFLICT DO NOTHING
    `);

    // 3. Criar posições de trading históricas
    console.log('📈 Criando posições de trading...');
    
    const users = await pool.query(`
      SELECT u.id as user_id, uea.id as account_id 
      FROM users u 
      JOIN user_exchange_accounts uea ON u.id = uea.user_id 
      WHERE u.user_status = 'ACTIVE'
    `);

    const symbols = ['BTCUSDT', 'ETHUSDT', 'LINKUSDT', 'ADAUSDT', 'DOTUSDT', 'SOLUSDT'];
    const sides = ['BUY', 'SELL'];
    
    for (let i = 0; i < 50; i++) {
      const user = users.rows[Math.floor(Math.random() * users.rows.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const entryPrice = 20 + Math.random() * 50; // Entre $20-70
      const size = 0.1 + Math.random() * 2; // Entre 0.1-2.1
      const isOpen = Math.random() > 0.7; // 30% posições abertas
      
      let exitPrice = null;
      let closedAt = null;
      let status = 'OPEN';
      
      if (!isOpen) {
        // Posição fechada - 60% com lucro
        const isProfit = Math.random() > 0.4;
        exitPrice = isProfit ? 
          entryPrice * (1 + Math.random() * 0.1) : // +0-10% lucro
          entryPrice * (1 - Math.random() * 0.05); // -0-5% perda
        closedAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Última 24h
        status = 'CLOSED';
      }
      
      const openedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Última semana
      
      await pool.query(`
        INSERT INTO trading_positions (
          id, user_id, exchange_account_id, symbol, side, size, 
          entry_price, leverage, status, 
          opened_at, closed_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, 1, $7,
          $8, $9, $8, NOW()
        )
      `, [
        user.user_id, user.account_id, symbol, side, size,
        entryPrice, status,
        openedAt, closedAt
      ]);
    }

    // 4. Criar decisões de mercado históricas
    console.log('🧠 Criando histórico de Market Intelligence...');
    for (let i = 0; i < 20; i++) {
      const allowLong = Math.random() > 0.3; // 70% permitem long
      const allowShort = Math.random() > 0.4; // 60% permitem short
      const confidence = 40 + Math.random() * 50; // 40-90% confiança
      const createdAt = new Date(Date.now() - i * 2 * 60 * 60 * 1000); // Últimas 40h, a cada 2h
      
      await pool.query(`
        INSERT INTO market_decisions (allow_long, allow_short, confidence, reasons, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [allowLong, allowShort, Math.round(confidence), ['Decisão automatizada para dashboard'], createdAt]);
    }

    // 5. Criar logs de sistema
    console.log('📝 Criando logs de sistema...');
    const eventTypes = [
      'AUTO_TRADE_EXECUTION', 'WEBHOOK_PROCESSED', 'MARKET_ANALYSIS',
      'POSITION_OPENED', 'POSITION_CLOSED', 'SIGNAL_RECEIVED'
    ];
    
    for (let i = 0; i < 30; i++) {
      const user = users.rows[Math.floor(Math.random() * users.rows.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const success = Math.random() > 0.1; // 90% sucesso
      const amountUsd = 10 + Math.random() * 100; // $10-110
      const createdAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Últimas 24h
      
      await pool.query(`
        INSERT INTO system_monitoring (
          event_type, user_id, symbol, exchange_used, 
          amount_usd, success, created_at
        ) VALUES ($1, $2, $3, 'BYBIT', $4, $5, $6)
      `, [eventType, user.user_id, symbol, amountUsd, success, createdAt]);
    }

    console.log('✅ DADOS DE TESTE POPULADOS COM SUCESSO!');
    console.log('📊 Dashboard agora tem dados reais para exibir');
    console.log('🌐 Acesse: http://localhost:3000/dashboard');
    
    // Estatísticas finais
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE user_status = 'ACTIVE') as active_users,
        (SELECT COUNT(*) FROM trading_positions) as total_positions,
        (SELECT COUNT(*) FROM trading_positions WHERE status = 'OPEN') as open_positions,
        (SELECT COUNT(*) FROM trading_positions WHERE status = 'CLOSED') as closed_positions,
        (SELECT COUNT(*) FROM market_decisions) as market_decisions,
        (SELECT COUNT(*) FROM system_monitoring) as system_logs
    `);
    
    console.log('\n📈 ESTATÍSTICAS DOS DADOS:');
    console.log(`├─ Usuários Ativos: ${stats.rows[0].active_users}`);
    console.log(`├─ Total Posições: ${stats.rows[0].total_positions}`);
    console.log(`├─ Posições Abertas: ${stats.rows[0].open_positions}`);
    console.log(`├─ Posições Fechadas: ${stats.rows[0].closed_positions}`);
    console.log(`├─ Decisões de Mercado: ${stats.rows[0].market_decisions}`);
    console.log(`└─ Logs de Sistema: ${stats.rows[0].system_logs}`);

  } catch (error) {
    console.error('❌ Erro populando dados:', error);
  } finally {
    await pool.end();
  }
}

// Executar
populateTestData();
