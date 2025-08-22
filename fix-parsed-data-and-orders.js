const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function fixParsedDataAndProcessing() {
  try {
    console.log('🔧 CORRIGINDO PROCESSAMENTO DE SINAIS FORTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Atualizar todos os webhooks com parsed_data NULL
    console.log('🔄 Atualizando parsed_data para sinais FORTES...');
    
    const updateResult = await pool.query(`
      UPDATE webhook_signals 
      SET parsed_data = jsonb_build_object(
        'signal', raw_data->>'signal',
        'ticker', raw_data->>'ticker',
        'action', raw_data->>'signal',
        'price', raw_data->>'close',
        'rsi_4h', raw_data->>'rsi_4h',
        'rsi_15', raw_data->>'rsi_15',
        'momentum', raw_data->>'momentum_15',
        'ema9_30', raw_data->>'ema9_30',
        'atr_pct_30', raw_data->>'atr_pct_30',
        'golden_cross', raw_data->>'golden_cross_30',
        'processed_at', NOW()
      )
      WHERE parsed_data IS NULL 
        AND raw_data::text ILIKE '%FORTE%'
    `);
    
    console.log(`✅ ${updateResult.rowCount} sinais FORTES atualizados com parsed_data`);
    
    // 2. Verificar sinais FORTES agora
    const strongSignalsResult = await pool.query(`
      SELECT 
        webhook_id,
        raw_data->>'signal' as signal_type,
        raw_data->>'ticker' as ticker,
        parsed_data,
        processed,
        created_at
      FROM webhook_signals 
      WHERE raw_data::text ILIKE '%FORTE%'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📊 SINAIS FORTES APÓS CORREÇÃO:');
    strongSignalsResult.rows.forEach((signal, index) => {
      console.log(`${index + 1}. ${signal.signal_type} | ${signal.ticker}`);
      console.log(`   Parsed: ${signal.parsed_data ? '✅' : '❌'}`);
      console.log(`   Processado: ${signal.processed ? '✅' : '❌'}`);
      console.log(`   Data: ${new Date(signal.created_at).toLocaleString('pt-BR')}`);
    });
    
    // 3. Criar trading_signals para sinais FORTES que ainda não foram processados
    console.log('\n🎯 CRIANDO TRADING_SIGNALS PARA SINAIS FORTES...');
    
    const createTradingSignalsResult = await pool.query(`
      INSERT INTO trading_signals (
        webhook_id,
        signal_type,
        symbol,
        action,
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
    
    console.log(`✅ ${createTradingSignalsResult.rowCount} trading_signals criados`);
    
    // 4. Verificar usuários ativos
    console.log('\n👥 VERIFICANDO USUÁRIOS PARA TRADING...');
    
    const usersResult = await pool.query(`
      SELECT DISTINCT 
        u.id, u.email, 
        uea.account_name,
        uea.exchange,
        uea.is_testnet,
        uea.can_trade,
        uea.is_active
      FROM users u
      LEFT JOIN user_exchange_accounts uea ON u.id = uea.user_id
      ORDER BY u.id
    `);
    
    console.log(`👥 Total de usuários: ${usersResult.rows.length}`);
    
    const activeTraders = usersResult.rows.filter(u => 
      u.can_trade && u.is_active && !u.is_testnet
    );
    
    console.log(`✅ Usuários com trading real ativo: ${activeTraders.length}`);
    
    if (activeTraders.length > 0) {
      activeTraders.forEach(user => {
        console.log(`  - ${user.email} | ${user.account_name} | ${user.exchange}`);
      });
    } else {
      console.log('❌ PROBLEMA: Nenhum usuário configurado para trading real!');
      console.log('💡 SOLUÇÃO: Configure pelo menos um usuário com:');
      console.log('   - can_trade = true');
      console.log('   - is_active = true'); 
      console.log('   - is_testnet = false');
    }
    
    // 5. Simular criação de ordens para sinais FORTES (apenas como teste)
    if (activeTraders.length > 0) {
      console.log('\n📈 SIMULANDO CRIAÇÃO DE ORDENS...');
      
      const simulateOrdersResult = await pool.query(`
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
            WHEN ts.action = 'BUY_LONG' THEN 'BUY'
            WHEN ts.action = 'SELL_SHORT' THEN 'SELL'
            ELSE 'BUY'
          END,
          'MARKET',
          0.01, -- Quantidade mínima para teste
          ts.price,
          'PENDING', -- Status inicial
          'BINANCE', -- Exchange padrão
          NOW()
        FROM trading_signals ts
        WHERE ts.signal_type = 'STRONG_SIGNAL'
          AND ts.action IN ('BUY_LONG', 'SELL_SHORT')
          AND NOT EXISTS (
            SELECT 1 FROM trading_orders to2 
            WHERE to2.trading_signal_id = ts.id
          )
        LIMIT 5 -- Limitar a 5 ordens de teste
      `, [activeTraders[0].id]); // Usar primeiro usuário ativo
      
      console.log(`✅ ${simulateOrdersResult.rowCount} ordens de teste criadas`);
    }
    
    // 6. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM webhook_signals WHERE raw_data::text ILIKE '%FORTE%') as webhooks_fortes,
        (SELECT COUNT(*) FROM webhook_signals WHERE parsed_data IS NOT NULL AND raw_data::text ILIKE '%FORTE%') as parsed_fortes,
        (SELECT COUNT(*) FROM trading_signals WHERE signal_type = 'STRONG_SIGNAL') as trading_signals_fortes,
        (SELECT COUNT(*) FROM trading_orders) as total_orders
    `);
    
    const stats = finalStats.rows[0];
    console.log(`🎯 Webhooks FORTES: ${stats.webhooks_fortes}`);
    console.log(`✅ Com parsed_data: ${stats.parsed_fortes}`);
    console.log(`🔄 Trading signals: ${stats.trading_signals_fortes}`);
    console.log(`📈 Total de ordens: ${stats.total_orders}`);
    
    if (parseInt(stats.total_orders) > 0) {
      console.log('\n🎉 SUCESSO! Ordens estão sendo criadas para sinais FORTES!');
    } else {
      console.log('\n⚠️ Ainda nenhuma ordem criada. Verificar configuração de usuários.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixParsedDataAndProcessing();
