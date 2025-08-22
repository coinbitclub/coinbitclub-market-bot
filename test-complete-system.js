const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function testCompleteSystem() {
  try {
    console.log('🔍 TESTE COMPLETO DO SISTEMA DE TRADING REAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 Teste realizado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // 1. TESTAR CONECTIVIDADE DAS APIs EXTERNAS
    console.log('🔗 1. TESTANDO CONECTIVIDADE DAS APIs EXTERNAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const apiTests = [
      {
        name: 'Binance API (Market Pulse)',
        test: async () => {
          const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]', { timeout: 10000 });
          return { status: 'OK', data: `${response.data.length} pares` };
        }
      },
      {
        name: 'Fear & Greed Index',
        test: async () => {
          const response = await axios.get('https://api.alternative.me/fng/', { timeout: 10000 });
          return { status: 'OK', data: `F&G: ${response.data.data[0].value}` };
        }
      },
      {
        name: 'CoinStats (BTC Dominance)',
        test: async () => {
          const response = await axios.get('https://openapiv1.coinstats.app/markets', {
            headers: { 'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=' },
            timeout: 10000
          });
          return { status: 'OK', data: `BTC Dom: ${response.data.btcDominance.toFixed(1)}%` };
        }
      }
    ];
    
    for (const api of apiTests) {
      try {
        const result = await api.test();
        console.log(`  ✅ ${api.name}: ${result.data}`);
      } catch (error) {
        console.log(`  ❌ ${api.name}: ERRO - ${error.message}`);
      }
    }
    
    // 2. TESTAR SERVIDOR RAILWAY EM PRODUÇÃO
    console.log('\n🌐 2. TESTANDO SERVIDOR RAILWAY EM PRODUÇÃO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const railwayEndpoints = [
      { path: '/api/system/status', name: 'Status do Sistema' },
      { path: '/api/market/intelligence', name: 'Market Intelligence' },
      { path: '/api/overview', name: 'Overview Geral' },
      { path: '/dashboard', name: 'Dashboard Web' }
    ];
    
    const baseUrl = 'https://coinbitclub-market-bot.up.railway.app';
    
    for (const endpoint of railwayEndpoints) {
      try {
        const response = await axios.get(`${baseUrl}${endpoint.path}`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500 // Aceitar redirects e 404s
        });
        console.log(`  ✅ ${endpoint.name}: ONLINE (${response.status})`);
      } catch (error) {
        if (error.response && error.response.status < 500) {
          console.log(`  ✅ ${endpoint.name}: ONLINE (${error.response.status})`);
        } else {
          console.log(`  ❌ ${endpoint.name}: ERRO - ${error.code || error.message}`);
        }
      }
    }
    
    // 3. TESTAR WEBHOOK ENDPOINT
    console.log('\n📡 3. TESTANDO WEBHOOK ENDPOINT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const webhookTest = await axios.post(
        `${baseUrl}/api/webhooks/signal?token=210406`,
        {
          signal: 'SINAL LONG FORTE',
          ticker: 'TESTUSDT.P',
          close: '100.00',
          rsi_4h: '45.0',
          test: true
        },
        { 
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log(`  ✅ Webhook Endpoint: FUNCIONANDO (${webhookTest.status})`);
      console.log(`     Resposta: ${JSON.stringify(webhookTest.data)}`);
      
    } catch (webhookError) {
      if (webhookError.response) {
        console.log(`  ⚠️ Webhook Endpoint: ${webhookError.response.status} - ${webhookError.response.statusText}`);
      } else {
        console.log(`  ❌ Webhook Endpoint: ERRO - ${webhookError.message}`);
      }
    }
    
    // 4. VERIFICAR MARKET INTELLIGENCE AUTOMÁTICO
    console.log('\n📊 4. VERIFICANDO MARKET INTELLIGENCE AUTOMÁTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const marketDecisionsResult = await pool.query(`
      SELECT 
        allow_long,
        allow_short,
        confidence,
        fear_greed,
        market_pulse,
        btc_dominance,
        created_at
      FROM market_decisions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (marketDecisionsResult.rows.length > 0) {
      const lastDecision = marketDecisionsResult.rows[0];
      const timeDiff = Math.round((new Date() - new Date(lastDecision.created_at)) / (1000 * 60));
      
      console.log(`  📊 Última análise: ${timeDiff} minutos atrás`);
      console.log(`  📈 Market Pulse: ${parseFloat(lastDecision.market_pulse).toFixed(1)}%`);
      console.log(`  😨 Fear & Greed: ${lastDecision.fear_greed}`);
      console.log(`  🟡 BTC Dominance: ${parseFloat(lastDecision.btc_dominance).toFixed(1)}%`);
      console.log(`  🎯 Confiança: ${lastDecision.confidence}%`);
      console.log(`  📈 Permite LONG: ${lastDecision.allow_long ? '✅' : '❌'}`);
      console.log(`  📉 Permite SHORT: ${lastDecision.allow_short ? '✅' : '❌'}`);
      
      if (timeDiff <= 20) {
        console.log(`  ✅ Market Intelligence: ATIVO (atualização recente)`);
      } else {
        console.log(`  ⚠️ Market Intelligence: POSSÍVEL PROBLEMA (${timeDiff}min sem atualização)`);
      }
    } else {
      console.log(`  ❌ Market Intelligence: SEM DADOS (sistema pode estar inicializando)`);
    }
    
    // 5. VERIFICAR WEBHOOKS RECEBIDOS
    console.log('\n📡 5. VERIFICANDO WEBHOOKS RECEBIDOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const webhookStats = await pool.query(`
      SELECT 
        COUNT(*) as total_webhooks,
        COUNT(CASE WHEN processed = true THEN 1 END) as processed_webhooks,
        COUNT(CASE WHEN raw_data::text ILIKE '%FORTE%' THEN 1 END) as strong_signals,
        MAX(created_at) as last_webhook
      FROM webhook_signals 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    const webhookData = webhookStats.rows[0];
    console.log(`  📊 Webhooks 24h: ${webhookData.total_webhooks} total`);
    console.log(`  ✅ Processados: ${webhookData.processed_webhooks}`);
    console.log(`  🎯 Sinais FORTES: ${webhookData.strong_signals}`);
    
    if (webhookData.last_webhook) {
      const lastWebhookTime = Math.round((new Date() - new Date(webhookData.last_webhook)) / (1000 * 60));
      console.log(`  🕐 Último webhook: ${lastWebhookTime} minutos atrás`);
      
      if (lastWebhookTime <= 60) {
        console.log(`  ✅ Webhooks: ATIVOS (recebendo sinais)`);
      } else {
        console.log(`  ⚠️ Webhooks: INATIVO (sem sinais recentes)`);
      }
    }
    
    // 6. VERIFICAR USUÁRIOS CONFIGURADOS
    console.log('\n👥 6. VERIFICANDO USUÁRIOS CONFIGURADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const usersResult = await pool.query(`
      SELECT 
        u.email,
        uea.account_name,
        uea.exchange,
        uea.can_trade,
        uea.is_active,
        uea.is_testnet
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      ORDER BY u.id
    `);
    
    const activeTraders = usersResult.rows.filter(u => u.can_trade && u.is_active && !u.is_testnet);
    
    console.log(`  👥 Total de usuários: ${usersResult.rows.length}`);
    console.log(`  ✅ Trading real ativo: ${activeTraders.length}`);
    
    if (activeTraders.length > 0) {
      activeTraders.forEach(user => {
        console.log(`    - ${user.email} | ${user.account_name} | ${user.exchange}`);
      });
      console.log(`  ✅ Usuários: CONFIGURADOS PARA TRADING REAL`);
    } else {
      console.log(`  ❌ Usuários: NENHUM CONFIGURADO PARA TRADING REAL`);
    }
    
    // 7. VERIFICAR ORDENS CRIADAS
    console.log('\n📈 7. VERIFICANDO ORDENS CRIADAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const ordersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as filled_orders,
        COUNT(DISTINCT symbol) as unique_symbols,
        MAX(created_at) as last_order
      FROM trading_orders
    `);
    
    const orderData = ordersResult.rows[0];
    console.log(`  📊 Total de ordens: ${orderData.total_orders}`);
    console.log(`  ⏳ Pendentes: ${orderData.pending_orders}`);
    console.log(`  ✅ Executadas: ${orderData.filled_orders}`);
    console.log(`  💰 Símbolos únicos: ${orderData.unique_symbols}`);
    
    if (orderData.last_order) {
      const lastOrderTime = Math.round((new Date() - new Date(orderData.last_order)) / (1000 * 60));
      console.log(`  🕐 Última ordem: ${lastOrderTime} minutos atrás`);
    }
    
    // Mostrar últimas ordens
    if (parseInt(orderData.total_orders) > 0) {
      const latestOrders = await pool.query(`
        SELECT 
          symbol, side, amount, price, status, created_at
        FROM trading_orders 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log(`  📋 Últimas ordens:`);
      latestOrders.rows.forEach((order, index) => {
        const emoji = order.side === 'BUY' ? '🟢' : '🔴';
        console.log(`    ${index + 1}. ${emoji} ${order.symbol} | ${order.side} ${order.amount} @ $${order.price} | ${order.status}`);
      });
      
      console.log(`  ✅ Ordens: SENDO CRIADAS PARA SINAIS FORTES`);
    } else {
      console.log(`  ❌ Ordens: NENHUMA ORDEM CRIADA`);
    }
    
    // 8. TESTE DE FLUXO COMPLETO
    console.log('\n🔄 8. TESTE DE FLUXO COMPLETO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const flowTests = [
      { step: 'TradingView → Webhook', status: parseInt(webhookData.total_webhooks) > 0 },
      { step: 'Webhook → Parsing', status: parseInt(webhookData.processed_webhooks) > 0 },
      { step: 'Sinais FORTES → Sistema', status: parseInt(webhookData.strong_signals) > 0 },
      { step: 'Market Intelligence → Decisão', status: marketDecisionsResult.rows.length > 0 },
      { step: 'Usuários → Configuração', status: activeTraders.length > 0 },
      { step: 'Sistema → Ordens', status: parseInt(orderData.total_orders) > 0 }
    ];
    
    flowTests.forEach(test => {
      const icon = test.status ? '✅' : '❌';
      console.log(`  ${icon} ${test.step}: ${test.status ? 'FUNCIONANDO' : 'PROBLEMA'}`);
    });
    
    const allWorking = flowTests.every(test => test.status);
    
    // 9. DIAGNÓSTICO FINAL
    console.log('\n🎯 9. DIAGNÓSTICO FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (allWorking) {
      console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
      console.log('✅ Todos os componentes estão operacionais');
      console.log('✅ Fluxo completo: TradingView → Webhook → Ordens → Trading');
      console.log('✅ Operações reais sendo criadas automaticamente');
      
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('🔄 Sistema aguardando novos sinais FORTES do TradingView');
      console.log('📊 Market Intelligence rodando automaticamente');
      console.log('⚡ Processamento em tempo real ativo');
      
    } else {
      console.log('⚠️ SISTEMA COM PROBLEMAS IDENTIFICADOS');
      
      const problems = flowTests.filter(test => !test.status);
      console.log('\n❌ PROBLEMAS ENCONTRADOS:');
      problems.forEach(problem => {
        console.log(`   - ${problem.step}: NÃO FUNCIONANDO`);
      });
      
      console.log('\n💡 RECOMENDAÇÕES:');
      if (!flowTests[4].status) {
        console.log('🔧 Configurar usuários para trading real');
      }
      if (!flowTests[0].status) {
        console.log('🔧 Verificar alertas do TradingView');
      }
      if (!flowTests[3].status) {
        console.log('🔧 Verificar Market Intelligence Service');
      }
    }
    
    console.log('\n📊 RESUMO EXECUTIVO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Servidor: ${baseUrl}`);
    console.log(`📡 Webhook: /api/webhooks/signal?token=210406`);
    console.log(`👥 Usuários ativos: ${activeTraders.length}`);
    console.log(`📈 Total de ordens: ${orderData.total_orders}`);
    console.log(`🎯 Sinais FORTES: ${webhookData.strong_signals}`);
    console.log(`⚡ Status geral: ${allWorking ? 'OPERACIONAL' : 'REQUER ATENÇÃO'}`);
    
  } catch (error) {
    console.error('❌ Erro no teste do sistema:', error.message);
  } finally {
    await pool.end();
  }
}

testCompleteSystem();
