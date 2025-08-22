const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function createRealOrdersForStrongSignals() {
  try {
    console.log('🎯 CRIANDO OPERAÇÕES REAIS PARA SINAIS FORTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Buscar usuários ativos para trading
    console.log('👥 Buscando usuários ativos...');
    
    const usersResult = await pool.query(`
      SELECT DISTINCT 
        u.id as user_id, 
        u.email,
        uea.id as account_id,
        uea.exchange,
        uea.account_name
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.can_trade = true 
        AND uea.is_active = true 
        AND uea.is_testnet = false
      LIMIT 3
    `);
    
    console.log(`✅ ${usersResult.rows.length} usuários encontrados para trading real`);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ PROBLEMA: Nenhum usuário configurado para trading real!');
      
      // Vamos verificar todos os usuários
      const allUsersResult = await pool.query(`
        SELECT u.id, u.email, uea.account_name, uea.can_trade, uea.is_active, uea.is_testnet
        FROM users u
        LEFT JOIN user_exchange_accounts uea ON u.id = uea.user_id
        ORDER BY u.id
      `);
      
      console.log('\n📋 TODOS OS USUÁRIOS NO SISTEMA:');
      allUsersResult.rows.forEach(user => {
        console.log(`  ${user.email} | Trade: ${user.can_trade} | Ativo: ${user.is_active} | Testnet: ${user.is_testnet}`);
      });
      
      return;
    }
    
    // 2. Buscar sinais FORTES dos webhooks
    console.log('\n🎯 Analisando sinais FORTES recebidos...');
    
    const strongSignalsResult = await pool.query(`
      SELECT 
        webhook_id,
        raw_data->>'signal' as signal_type,
        raw_data->>'ticker' as ticker,
        (raw_data->>'close')::numeric as price,
        created_at
      FROM webhook_signals 
      WHERE raw_data::text ILIKE '%FORTE%'
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 ${strongSignalsResult.rows.length} sinais FORTES nas últimas 24h`);
    
    if (strongSignalsResult.rows.length === 0) {
      console.log('❌ Nenhum sinal FORTE recente encontrado');
      return;
    }
    
    // 3. Criar trading_signals para cada sinal FORTE
    console.log('\n🔄 Criando trading_signals...');
    
    for (const signal of strongSignalsResult.rows) {
      try {
        // Determinar o tipo de sinal
        const isLong = signal.signal_type && signal.signal_type.includes('LONG');
        const signalTypeEnum = isLong ? 'LONG' : 'SHORT';
        const symbol = signal.ticker.replace('.P', ''); // Remove sufixo perpetual
        
        console.log(`📍 Processando: ${signal.signal_type} | ${symbol}`);
        
        // Inserir trading_signal
        const tradingSignalResult = await pool.query(`
          INSERT INTO trading_signals (
            id,
            source,
            webhook_id,
            symbol,
            signal_type,
            leverage,
            entry_price,
            position_size_percent,
            status,
            received_at,
            raw_data
          ) VALUES (
            gen_random_uuid(),
            'TRADINGVIEW',
            $1,
            $2,
            $3,
            10, -- Leverage padrão
            $4,
            1.0, -- 1% do portfolio
            'PENDING',
            $5,
            $6
          )
          ON CONFLICT (webhook_id) DO NOTHING
          RETURNING id
        `, [
          signal.webhook_id,
          symbol,
          signalTypeEnum,
          signal.price,
          signal.created_at,
          JSON.stringify({
            original_signal: signal.signal_type,
            ticker: signal.ticker,
            price: signal.price
          })
        ]);
        
        if (tradingSignalResult.rows.length > 0) {
          const signalId = tradingSignalResult.rows[0].id;
          console.log(`  ✅ Trading signal criado: ${signalId}`);
          
          // 4. Criar ordens para cada usuário ativo
          for (const user of usersResult.rows) {
            try {
              const orderResult = await pool.query(`
                INSERT INTO trading_orders (
                  id,
                  user_id,
                  exchange_account_id,
                  signal_id,
                  symbol,
                  type,
                  side,
                  amount,
                  price,
                  status,
                  client_order_id,
                  created_at
                ) VALUES (
                  gen_random_uuid(),
                  $1,
                  $2,
                  $3,
                  $4,
                  'MARKET',
                  $5,
                  0.01, -- Quantidade mínima para teste
                  $6,
                  'PENDING',
                  $7,
                  NOW()
                )
                RETURNING id
              `, [
                user.user_id,
                user.account_id,
                signalId,
                symbol,
                isLong ? 'BUY' : 'SELL',
                signal.price,
                `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
              ]);
              
              const orderId = orderResult.rows[0].id;
              console.log(`    📈 Ordem criada para ${user.email}: ${orderId}`);
              
            } catch (orderError) {
              console.log(`    ❌ Erro ao criar ordem para ${user.email}: ${orderError.message}`);
            }
          }
          
        } else {
          console.log(`  ⏭️ Trading signal já existe para ${signal.webhook_id}`);
        }
        
      } catch (signalError) {
        console.log(`❌ Erro ao processar sinal ${signal.webhook_id}: ${signalError.message}`);
      }
    }
    
    // 5. Resumo final
    console.log('\n📊 RESUMO FINAL - OPERAÇÕES REAIS CRIADAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const finalStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT ts.id) as trading_signals,
        COUNT(DISTINCT tor.id) as trading_orders,
        COUNT(DISTINCT tor.symbol) as unique_symbols
      FROM trading_signals ts
      LEFT JOIN trading_orders tor ON ts.id = tor.signal_id
      WHERE ts.source = 'TRADINGVIEW'
        AND ts.created_at > NOW() - INTERVAL '1 hour'
    `);
    
    const stats = finalStats.rows[0];
    console.log(`🔄 Trading signals criados: ${stats.trading_signals}`);
    console.log(`📈 Ordens de trading criadas: ${stats.trading_orders}`);
    console.log(`💰 Símbolos únicos: ${stats.unique_symbols}`);
    
    // 6. Mostrar últimas ordens
    if (parseInt(stats.trading_orders) > 0) {
      console.log('\n🎉 ÚLTIMAS ORDENS CRIADAS (OPERAÇÕES REAIS):');
      
      const ordersResult = await pool.query(`
        SELECT 
          tor.symbol,
          tor.side,
          tor.amount,
          tor.price,
          tor.status,
          ts.signal_type,
          u.email,
          tor.created_at
        FROM trading_orders tor
        JOIN trading_signals ts ON ts.id = tor.signal_id
        JOIN users u ON u.id = tor.user_id
        WHERE ts.source = 'TRADINGVIEW'
        ORDER BY tor.created_at DESC
        LIMIT 10
      `);
      
      ordersResult.rows.forEach((order, index) => {
        const emoji = order.side === 'BUY' ? '🟢' : '🔴';
        console.log(`${index + 1}. ${emoji} ${order.symbol} | ${order.side} | ${order.amount} | $${order.price}`);
        console.log(`    Usuário: ${order.email} | Tipo: ${order.signal_type} | Status: ${order.status}`);
        console.log(`    Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
      });
      
      console.log('\n🎉 SUCESSO! OPERAÇÕES REAIS FORAM CRIADAS PARA SINAIS FORTES!');
      console.log('📋 Os sinais FORTES do TradingView agora geram ordens automáticas');
      console.log('🔄 Sistema funcionando: Webhook → Trading Signal → Ordem Real');
      
    } else {
      console.log('\n⚠️ Nenhuma ordem foi criada. Verificar configuração.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createRealOrdersForStrongSignals();
