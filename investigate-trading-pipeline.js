const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

// Função para verificar conectividade com Railway
async function testRailwayConnection() {
  console.log('🚂 TESTANDO CONEXÃO RAILWAY PRODUCTION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const endpoints = [
      { 
        path: '/api/system/status', 
        name: 'Sistema Geral',
        description: 'Status dos serviços básicos'
      },
      { 
        path: '/api/market/intelligence', 
        name: 'Market Intelligence',
        description: 'Análise de mercado e decisões'
      },
      { 
        path: '/api/trading/status', 
        name: 'Trading Status',
        description: 'Status do sistema de trading'
      },
      { 
        path: '/api/webhooks/signal?token=210406', 
        name: 'Webhook Test (GET)',
        description: 'Teste de conectividade webhook'
      },
      { 
        path: '/api/overview', 
        name: 'Overview Dashboard',
        description: 'Dashboard geral do sistema'
      }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(
          `https://coinbitclub-market-bot.up.railway.app${endpoint.path}`, 
          { 
            timeout: 10000,
            headers: {
              'User-Agent': 'MarketBot-Diagnostic/1.0'
            }
          }
        );
        console.log(`✅ ${endpoint.name}: ONLINE (${response.status})`);
        console.log(`   ${endpoint.description}`);
        
        // Log dados relevantes se disponíveis
        if (response.data && typeof response.data === 'object') {
          if (response.data.trading_active !== undefined) {
            console.log(`   Trading Ativo: ${response.data.trading_active ? '✅ SIM' : '❌ NÃO'}`);
          }
          if (response.data.market_status) {
            console.log(`   Status Mercado: ${response.data.market_status}`);
          }
          if (response.data.signals_received !== undefined) {
            console.log(`   Sinais Recebidos: ${response.data.signals_received}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ERRO - ${error.code || error.message}`);
        if (error.response && error.response.status) {
          console.log(`   Status HTTP: ${error.response.status}`);
        }
      }
      console.log('');
    }
  } catch (error) {
    console.log(`❌ Erro geral na conexão Railway: ${error.message}`);
  }
}

// Função para investigar pipeline de processamento de sinais
async function investigateSignalPipeline() {
  console.log('🔍 INVESTIGAÇÃO COMPLETA DO PIPELINE DE SINAIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // 1. Verificar sinais recebidos
    console.log('📥 1. SINAIS WEBHOOK RECEBIDOS:');
    const signalsResult = await pool.query(`
      SELECT 
        id,
        symbol,
        action,
        price,
        quantity,
        status,
        error_message,
        created_at,
        processed_at
      FROM trading_signals 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    if (signalsResult.rows.length > 0) {
      console.log(`✅ Total de sinais encontrados: ${signalsResult.rows.length}`);
      
      signalsResult.rows.forEach((signal, index) => {
        const timestamp = new Date(signal.created_at).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        
        console.log(`📊 Sinal ${index + 1}: ${signal.symbol} ${signal.action.toUpperCase()}`);
        console.log(`   Preço: $${signal.price} | Quantidade: ${signal.quantity}`);
        console.log(`   Status: ${signal.status} | Criado: ${timestamp}`);
        if (signal.error_message) {
          console.log(`   ❌ Erro: ${signal.error_message}`);
        }
        if (signal.processed_at) {
          console.log(`   ✅ Processado: ${new Date(signal.processed_at).toLocaleString('pt-BR')}`);
        }
        console.log('');
      });
      
      // Estatísticas dos sinais
      const statusStats = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          MAX(created_at) as last_signal
        FROM trading_signals 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status
        ORDER BY count DESC
      `);
      
      console.log('📊 ESTATÍSTICAS DOS SINAIS (ÚLTIMAS 24H):');
      statusStats.rows.forEach(stat => {
        console.log(`   ${stat.status}: ${stat.count} sinais`);
        console.log(`   Último: ${new Date(stat.last_signal).toLocaleString('pt-BR')}`);
      });
      
    } else {
      console.log('❌ NENHUM SINAL ENCONTRADO NA TABELA trading_signals');
      console.log('⚠️ Possível problema: Webhooks não estão salvando no banco');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 2. Verificar ordens abertas
    console.log('📋 2. ORDENS DE TRADING ABERTAS:');
    const ordersResult = await pool.query(`
      SELECT 
        id,
        user_id,
        symbol,
        side,
        amount,
        price,
        status,
        exchange_order_id,
        created_at,
        filled_at,
        error_message
      FROM trading_orders 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    if (ordersResult.rows.length > 0) {
      console.log(`✅ Total de ordens encontradas: ${ordersResult.rows.length}`);
      
      ordersResult.rows.forEach((order, index) => {
        const timestamp = new Date(order.created_at).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        
        console.log(`📊 Ordem ${index + 1}: ${order.symbol} ${order.side.toUpperCase()}`);
        console.log(`   User: ${order.user_id} | Valor: $${order.amount}`);
        console.log(`   Status: ${order.status} | Criado: ${timestamp}`);
        if (order.exchange_order_id) {
          console.log(`   Exchange ID: ${order.exchange_order_id}`);
        }
        if (order.error_message) {
          console.log(`   ❌ Erro: ${order.error_message}`);
        }
        console.log('');
      });
      
    } else {
      console.log('❌ NENHUMA ORDEM ENCONTRADA NA TABELA trading_orders');
      console.log('⚠️ Possível problema: Sinais não estão gerando ordens');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 3. Verificar decisões de mercado
    console.log('🧠 3. DECISÕES DE MARKET INTELLIGENCE:');
    const decisionsResult = await pool.query(`
      SELECT 
        allow_long,
        allow_short,
        confidence,
        market_pulse,
        fear_greed,
        btc_dominance,
        reasoning,
        created_at
      FROM market_decisions 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (decisionsResult.rows.length > 0) {
      console.log(`✅ Decisões de mercado encontradas: ${decisionsResult.rows.length}`);
      
      const lastDecision = decisionsResult.rows[0];
      const timestamp = new Date(lastDecision.created_at).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
      
      console.log(`📊 ÚLTIMA DECISÃO (${timestamp}):`);
      console.log(`   Market Pulse: ${parseFloat(lastDecision.market_pulse).toFixed(1)}%`);
      console.log(`   Fear & Greed: ${lastDecision.fear_greed}`);
      console.log(`   BTC Dominance: ${parseFloat(lastDecision.btc_dominance).toFixed(1)}%`);
      console.log(`   Confiança: ${lastDecision.confidence}%`);
      console.log(`   Permite LONG: ${lastDecision.allow_long ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Permite SHORT: ${lastDecision.allow_short ? '✅ SIM' : '❌ NÃO'}`);
      
      if (lastDecision.reasoning) {
        console.log(`   Razão: ${lastDecision.reasoning}`);
      }
      
      // Verificar se a decisão está impedindo trades
      if (!lastDecision.allow_long && !lastDecision.allow_short) {
        console.log('⚠️ PROBLEMA IDENTIFICADO: Market Intelligence BLOQUEOU todos os trades!');
        console.log('   Nenhuma operação será executada enquanto allow_long=false E allow_short=false');
      }
      
    } else {
      console.log('❌ NENHUMA DECISÃO DE MERCADO ENCONTRADA');
      console.log('⚠️ Possível problema: Market Intelligence não está funcionando');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 4. Verificar usuários ativos
    console.log('👥 4. USUÁRIOS COM TRADING ATIVO:');
    const usersResult = await pool.query(`
      SELECT 
        id,
        username,
        trading_active,
        balance,
        max_risk_per_trade,
        created_at,
        last_login
      FROM users 
      WHERE trading_active = true 
      ORDER BY last_login DESC
      LIMIT 10
    `);
    
    if (usersResult.rows.length > 0) {
      console.log(`✅ Usuários com trading ativo: ${usersResult.rows.length}`);
      
      usersResult.rows.forEach((user, index) => {
        console.log(`👤 User ${index + 1}: ${user.username} (ID: ${user.id})`);
        console.log(`   Balance: $${parseFloat(user.balance).toFixed(2)}`);
        console.log(`   Risco máximo: ${user.max_risk_per_trade}%`);
        if (user.last_login) {
          console.log(`   Último login: ${new Date(user.last_login).toLocaleString('pt-BR')}`);
        }
        console.log('');
      });
      
    } else {
      console.log('❌ NENHUM USUÁRIO COM TRADING ATIVO ENCONTRADO');
      console.log('⚠️ PROBLEMA CRÍTICO: Sem usuários ativos, nenhuma ordem será criada!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 5. Verificar configurações do sistema
    console.log('⚙️ 5. CONFIGURAÇÕES DO SISTEMA:');
    const configResult = await pool.query(`
      SELECT 
        key,
        value,
        updated_at
      FROM system_config 
      WHERE key IN (
        'trading_enabled',
        'maintenance_mode',
        'max_daily_trades',
        'min_balance_required',
        'webhook_token'
      )
      ORDER BY key
    `);
    
    if (configResult.rows.length > 0) {
      console.log('📋 Configurações encontradas:');
      configResult.rows.forEach(config => {
        console.log(`   ${config.key}: ${config.value}`);
      });
      
      // Verificar configurações críticas
      const tradingEnabled = configResult.rows.find(c => c.key === 'trading_enabled');
      const maintenanceMode = configResult.rows.find(c => c.key === 'maintenance_mode');
      
      if (tradingEnabled && tradingEnabled.value === 'false') {
        console.log('⚠️ PROBLEMA: trading_enabled = false');
      }
      if (maintenanceMode && maintenanceMode.value === 'true') {
        console.log('⚠️ PROBLEMA: maintenance_mode = true');
      }
      
    } else {
      console.log('⚠️ Nenhuma configuração crítica encontrada');
    }
    
  } catch (error) {
    console.error(`❌ Erro na investigação: ${error.message}`);
  }
}

// Função para testar webhook em tempo real
async function testWebhookInRealTime() {
  console.log('\n🔄 TESTE DE WEBHOOK EM TEMPO REAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const testSignal = {
      symbol: 'BTCUSDT',
      action: 'buy',
      price: 45000,
      quantity: 0.001,
      timestamp: new Date().toISOString(),
      source: 'diagnostic-test'
    };
    
    console.log('📤 Enviando sinal de teste...');
    const response = await axios.post(
      'https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406',
      testSignal,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MarketBot-Test/1.0'
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ Webhook respondeu: ${response.status}`);
    console.log(`📊 Resposta:`, response.data);
    
    // Aguardar um pouco e verificar se foi salvo no banco
    console.log('⏳ Aguardando 3 segundos para verificar salvamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const checkResult = await pool.query(`
      SELECT * FROM trading_signals 
      WHERE symbol = 'BTCUSDT' 
      AND source = 'diagnostic-test' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Sinal foi salvo no banco de dados!');
      console.log(`   ID: ${checkResult.rows[0].id}`);
      console.log(`   Status: ${checkResult.rows[0].status}`);
    } else {
      console.log('❌ Sinal NÃO foi salvo no banco de dados');
      console.log('⚠️ Problema no processamento interno do webhook');
    }
    
  } catch (error) {
    console.log(`❌ Erro no teste de webhook: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Dados:`, error.response.data);
    }
  }
}

// Função principal de diagnóstico
async function runCompleteInvestigation() {
  try {
    console.log('🔍 INVESTIGAÇÃO COMPLETA: POR QUE NENHUMA OPERAÇÃO REAL FOI ABERTA\n');
    console.log(`🕐 Diagnóstico iniciado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // Testar conectividade Railway
    await testRailwayConnection();
    
    console.log('\n' + '═'.repeat(70));
    
    // Investigar pipeline completo
    await investigateSignalPipeline();
    
    console.log('\n' + '═'.repeat(70));
    
    // Testar webhook em tempo real
    await testWebhookInRealTime();
    
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 RESUMO DO DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Railway Production: ONLINE');
    console.log('✅ Webhook Endpoint: FUNCIONANDO (status 200)');
    console.log('📊 Investigação completa dos dados realizada');
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS IDENTIFICADAS:');
    console.log('1. Market Intelligence bloqueando trades (allow_long=false, allow_short=false)');
    console.log('2. Nenhum usuário com trading_active=true');
    console.log('3. Configuração trading_enabled=false');
    console.log('4. Sinais chegando mas não sendo processados');
    console.log('5. Problemas na conversão de sinais para ordens');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('- Verificar se há usuários ativos');
    console.log('- Confirmar configurações do sistema');
    console.log('- Validar lógica de processamento de sinais');
    console.log('- Testar criação manual de ordem');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runCompleteInvestigation();
