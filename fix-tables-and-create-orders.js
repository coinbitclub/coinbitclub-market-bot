const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkAndFixTables() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS DE TRADING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Verificar se tabelas existem
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('trading_signals', 'trading_orders')
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:');
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 2. Verificar estrutura da trading_signals se existir
    if (tablesResult.rows.some(t => t.table_name === 'trading_signals')) {
      console.log('\n📊 ESTRUTURA DA TABELA trading_signals:');
      const signalsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'trading_signals'
        ORDER BY ordinal_position
      `);
      
      signalsStructure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('\n❌ Tabela trading_signals NÃO EXISTE');
      console.log('🔧 Criando tabela trading_signals...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trading_signals (
          id SERIAL PRIMARY KEY,
          webhook_id VARCHAR(255),
          signal_type VARCHAR(50),
          symbol VARCHAR(20),
          trade_action VARCHAR(20), -- Mudando de 'action' para 'trade_action'
          price DECIMAL(20,8),
          confidence INTEGER,
          market_conditions JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabela trading_signals criada');
    }
    
    // 3. Verificar estrutura da trading_orders se existir
    if (tablesResult.rows.some(t => t.table_name === 'trading_orders')) {
      console.log('\n📊 ESTRUTURA DA TABELA trading_orders:');
      const ordersStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'trading_orders'
        ORDER BY ordinal_position
      `);
      
      ordersStructure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('\n❌ Tabela trading_orders NÃO EXISTE');
      console.log('🔧 Criando tabela trading_orders...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trading_orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          trading_signal_id INTEGER,
          symbol VARCHAR(20),
          side VARCHAR(10), -- BUY/SELL
          order_type VARCHAR(20), -- MARKET/LIMIT
          quantity DECIMAL(20,8),
          price DECIMAL(20,8),
          status VARCHAR(20), -- PENDING/FILLED/CANCELLED
          exchange VARCHAR(20),
          order_id VARCHAR(100), -- ID da exchange
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          filled_at TIMESTAMP,
          FOREIGN KEY (trading_signal_id) REFERENCES trading_signals(id)
        )
      `);
      
      console.log('✅ Tabela trading_orders criada');
    }
    
    // 4. Agora criar trading_signals para sinais FORTES com coluna correta
    console.log('\n🎯 CRIANDO TRADING_SIGNALS PARA SINAIS FORTES...');
    
    const createTradingSignalsResult = await pool.query(`
      INSERT INTO trading_signals (
        webhook_id,
        signal_type,
        symbol,
        trade_action,
        price,
        confidence,
        market_conditions,
        created_at
      )
      SELECT 
        ws.webhook_id,
        'STRONG_SIGNAL',
        REPLACE(ws.raw_data->>'ticker', '.P', ''),
        CASE 
          WHEN ws.raw_data->>'signal' ILIKE '%LONG FORTE%' THEN 'BUY_LONG'
          WHEN ws.raw_data->>'signal' ILIKE '%SHORT FORTE%' THEN 'SELL_SHORT'
          ELSE 'UNKNOWN'
        END,
        (ws.raw_data->>'close')::numeric,
        90, -- Alta confiança para sinais FORTES
        jsonb_build_object(
          'rsi_4h', ws.raw_data->>'rsi_4h',
          'rsi_15', ws.raw_data->>'rsi_15',
          'momentum', ws.raw_data->>'momentum_15',
          'golden_cross', ws.raw_data->>'golden_cross_30'
        ),
        ws.created_at
      FROM webhook_signals ws
      WHERE ws.raw_data::text ILIKE '%FORTE%'
        AND ws.processed = true
        AND NOT EXISTS (
          SELECT 1 FROM trading_signals ts 
          WHERE ts.webhook_id = ws.webhook_id
        )
    `);
    
    console.log(`✅ ${createTradingSignalsResult.rowCount} trading_signals criados para sinais FORTES`);
    
    // 5. Verificar usuários para trading
    console.log('\n👥 VERIFICANDO USUÁRIOS...');
    
    const usersResult = await pool.query(`
      SELECT DISTINCT 
        u.id, u.email
      FROM users u
      LEFT JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.can_trade = true 
        AND uea.is_active = true 
        AND uea.is_testnet = false
      LIMIT 1
    `);
    
    if (usersResult.rows.length > 0) {
      const user = usersResult.rows[0];
      console.log(`✅ Usuário encontrado para trading: ${user.email}`);
      
      // 6. Criar ordens para os sinais FORTES
      console.log('\n📈 CRIANDO ORDENS PARA SINAIS FORTES...');
      
      const createOrdersResult = await pool.query(`
        INSERT INTO trading_orders (
          user_id,
          trading_signal_id,
          symbol,
          side,
          order_type,
          quantity,
          price,
          status,
          exchange,
          created_at
        )
        SELECT 
          $1,
          ts.id,
          ts.symbol,
          CASE 
            WHEN ts.trade_action = 'BUY_LONG' THEN 'BUY'
            WHEN ts.trade_action = 'SELL_SHORT' THEN 'SELL'
            ELSE 'BUY'
          END,
          'MARKET',
          0.01, -- Quantidade mínima para teste
          ts.price,
          'PENDING',
          'BINANCE',
          NOW()
        FROM trading_signals ts
        WHERE ts.signal_type = 'STRONG_SIGNAL'
          AND ts.trade_action IN ('BUY_LONG', 'SELL_SHORT')
          AND NOT EXISTS (
            SELECT 1 FROM trading_orders to2 
            WHERE to2.trading_signal_id = ts.id
          )
      `, [user.id]);
      
      console.log(`✅ ${createOrdersResult.rowCount} ordens criadas para sinais FORTES`);
      
    } else {
      console.log('❌ Nenhum usuário configurado para trading real');
    }
    
    // 7. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM webhook_signals WHERE raw_data::text ILIKE '%FORTE%') as webhooks_fortes,
        (SELECT COUNT(*) FROM trading_signals WHERE signal_type = 'STRONG_SIGNAL') as trading_signals_fortes,
        (SELECT COUNT(*) FROM trading_orders) as total_orders
    `);
    
    const stats = finalStats.rows[0];
    console.log(`🎯 Webhooks FORTES recebidos: ${stats.webhooks_fortes}`);
    console.log(`🔄 Trading signals criados: ${stats.trading_signals_fortes}`);
    console.log(`📈 Total de ordens: ${stats.total_orders}`);
    
    // 8. Mostrar últimas ordens criadas
    if (parseInt(stats.total_orders) > 0) {
      console.log('\n🎉 ÚLTIMAS ORDENS CRIADAS:');
      const ordersResult = await pool.query(`
        SELECT 
          to2.symbol,
          to2.side,
          to2.quantity,
          to2.price,
          to2.status,
          ts.trade_action,
          to2.created_at
        FROM trading_orders to2
        JOIN trading_signals ts ON ts.id = to2.trading_signal_id
        ORDER BY to2.created_at DESC
        LIMIT 5
      `);
      
      ordersResult.rows.forEach((order, index) => {
        console.log(`${index + 1}. ${order.symbol} | ${order.side} | ${order.quantity} | $${order.price} | ${order.status}`);
        console.log(`   Ação: ${order.trade_action} | ${new Date(order.created_at).toLocaleString('pt-BR')}`);
      });
      
      console.log('\n🎉 SUCESSO! OPERAÇÕES REAIS FORAM CRIADAS PARA SINAIS FORTES!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndFixTables();
