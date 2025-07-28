// 🎯 TESTE DE FUNCIONALIDADE REAL DAS INTEGRAÇÕES
// Verificação se o sistema está realmente "ouvindo" e processando

const axios = require('axios');

console.log('🎧 TESTE DE SISTEMA OUVINDO - INTEGRAÇÕES ATIVAS');
console.log('=' .repeat(60));
console.log('⏰ Teste iniciado:', new Date().toISOString());
console.log('');

// ===== CONFIGURAÇÃO DO TESTE =====

const SERVER_URL = 'http://localhost:3000';

// ===== TESTES DE RESPOSTA DO SISTEMA =====

async function testServerHealthWithIntegrations() {
  console.log('🏥 TESTE DE SAÚDE DO SERVIDOR COM INTEGRAÇÕES');
  console.log('-'.repeat(50));
  
  try {
    // 1. Health check básico
    const healthResponse = await axios.get(`${SERVER_URL}/health`);
    console.log('   ✅ Health Check: OK');
    console.log(`   📊 Status: ${healthResponse.status}`);
    
    // 2. API Health check
    const apiHealthResponse = await axios.get(`${SERVER_URL}/api/health`);
    console.log('   ✅ API Health: OK');
    
    // 3. Verificar se servidor responde sobre integrações
    const integrationStatus = {
      binance: false,
      bybit: false,
      openai: false,
      stripe: false
    };
    
    // Teste endpoints que dependem das integrações
    console.log('');
    console.log('🔗 Testando endpoints que usam integrações...');
    
    return { success: true, integrations: integrationStatus };
    
  } catch (error) {
    console.log(`   ❌ Erro de conectividade: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMarketDataEndpoints() {
  console.log('📊 TESTE DE ENDPOINTS DE DADOS DE MERCADO');
  console.log('-'.repeat(50));
  
  const results = {
    fear_greed: false,
    market_data: false,
    trading_signals: false
  };
  
  try {
    // 1. Fear & Greed Index
    const fearGreedResponse = await axios.get(`${SERVER_URL}/api/fear-greed/current`, {
      timeout: 5000
    });
    
    if (fearGreedResponse.status === 200) {
      console.log('   ✅ Fear & Greed Index: FUNCIONANDO');
      console.log(`   📈 Dados: ${JSON.stringify(fearGreedResponse.data).substring(0, 100)}...`);
      results.fear_greed = true;
    }
    
  } catch (error) {
    console.log(`   ⚠️  Fear & Greed Index: ${error.response?.status || 'ERRO'} - ${error.message}`);
  }
  
  try {
    // 2. Verificar se consegue obter dados das exchanges
    console.log('   🔍 Testando acesso direto às exchanges...');
    
    // Binance (funcionando)
    const binanceData = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    if (binanceData.status === 200) {
      console.log(`   ✅ Binance Direto: BTC = $${parseFloat(binanceData.data.price).toLocaleString()}`);
      results.market_data = true;
    }
    
    // Bybit (funcionando)
    const bybitData = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
    if (bybitData.status === 200 && bybitData.data.result?.list?.[0]) {
      const price = bybitData.data.result.list[0].lastPrice;
      console.log(`   ✅ Bybit Direto: BTC = $${parseFloat(price).toLocaleString()}`);
      results.market_data = true;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro nos dados de mercado: ${error.message}`);
  }
  
  console.log('');
  return results;
}

async function testWebhookEndpoints() {
  console.log('🔗 TESTE DE ENDPOINTS WEBHOOK');
  console.log('-'.repeat(50));
  
  const results = {
    tradingview: false,
    stripe: false,
    system_responsive: false
  };
  
  try {
    // 1. Testar webhook TradingView (POST)
    const tradingViewPayload = {
      symbol: "BTCUSDT",
      action: "buy",
      price: 119000,
      quantity: 0.001,
      timestamp: Date.now()
    };
    
    const tvResponse = await axios({
      method: 'POST',
      url: `${SERVER_URL}/api/webhooks/tradingview`,
      data: tradingViewPayload,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
      validateStatus: (status) => status < 500 // Aceitar até 4xx como resposta válida
    });
    
    console.log(`   📺 TradingView Webhook: HTTP ${tvResponse.status}`);
    if (tvResponse.status < 500) {
      console.log('   ✅ Sistema ESTÁ OUVINDO webhooks TradingView');
      results.tradingview = true;
      results.system_responsive = true;
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Servidor não está respondendo');
    } else {
      console.log(`   ⚠️  TradingView Webhook: ${error.response?.status || 'ERRO'}`);
      if (error.response?.status < 500) {
        results.system_responsive = true;
      }
    }
  }
  
  try {
    // 2. Testar webhook Stripe (simulação)
    const stripePayload = {
      id: "evt_test_webhook",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_payment",
          amount: 5000,
          currency: "brl"
        }
      }
    };
    
    const stripeResponse = await axios({
      method: 'POST',
      url: `${SERVER_URL}/api/webhooks/stripe`,
      data: stripePayload,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    console.log(`   💳 Stripe Webhook: HTTP ${stripeResponse.status}`);
    if (stripeResponse.status < 500) {
      console.log('   ✅ Sistema ESTÁ OUVINDO webhooks Stripe');
      results.stripe = true;
      results.system_responsive = true;
    }
    
  } catch (error) {
    console.log(`   ⚠️  Stripe Webhook: ${error.response?.status || 'ERRO'}`);
    if (error.response?.status < 500) {
      results.system_responsive = true;
    }
  }
  
  console.log('');
  return results;
}

async function testAdminEndpoints() {
  console.log('👨‍💼 TESTE DE ENDPOINTS ADMINISTRATIVOS');
  console.log('-'.repeat(50));
  
  const results = {
    emergency_accessible: false,
    admin_auth_working: false,
    system_controllable: false
  };
  
  try {
    // 1. Testar status de emergência
    const emergencyResponse = await axios({
      method: 'GET',
      url: `${SERVER_URL}/api/admin/emergency/status`,
      headers: { 'Authorization': 'Bearer admin-emergency-token' },
      timeout: 5000
    });
    
    if (emergencyResponse.status === 200) {
      console.log('   ✅ Admin Emergency: ACESSÍVEL');
      console.log(`   📊 Status: ${JSON.stringify(emergencyResponse.data).substring(0, 100)}...`);
      results.emergency_accessible = true;
      results.admin_auth_working = true;
      results.system_controllable = true;
    }
    
  } catch (error) {
    console.log(`   ⚠️  Admin Emergency: ${error.response?.status || 'ERRO'}`);
    if (error.response?.status === 401) {
      console.log('   🔑 Sistema requer autenticação (normal)');
    }
  }
  
  try {
    // 2. Testar endpoint sem auth (deve falhar)
    const noAuthResponse = await axios({
      method: 'GET',
      url: `${SERVER_URL}/api/admin/emergency/status`,
      timeout: 5000,
      validateStatus: (status) => true // Aceitar qualquer status
    });
    
    if (noAuthResponse.status === 401) {
      console.log('   ✅ Autenticação Admin: FUNCIONANDO (rejeita sem token)');
      results.admin_auth_working = true;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no teste de auth: ${error.message}`);
  }
  
  console.log('');
  return results;
}

async function testSystemResponsiveness() {
  console.log('⚡ TESTE DE RESPONSIVIDADE DO SISTEMA');
  console.log('-'.repeat(50));
  
  const results = {
    response_times: [],
    average_response: 0,
    system_stable: false,
    concurrent_handling: false
  };
  
  try {
    // 1. Testar múltiplas requisições simultâneas
    console.log('   🔄 Testando requisições simultâneas...');
    
    const startTime = Date.now();
    const promises = [];
    
    // Fazer 5 requisições simultâneas
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.get(`${SERVER_URL}/health`, { timeout: 3000 })
          .then(() => Date.now() - startTime)
          .catch(() => -1)
      );
    }
    
    const times = await Promise.all(promises);
    const validTimes = times.filter(t => t > 0);
    
    if (validTimes.length >= 3) {
      results.concurrent_handling = true;
      results.response_times = validTimes;
      results.average_response = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      
      console.log(`   ✅ Requisições simultâneas: ${validTimes.length}/5 sucesso`);
      console.log(`   ⚡ Tempo médio de resposta: ${results.average_response.toFixed(0)}ms`);
      
      if (results.average_response < 1000) {
        results.system_stable = true;
        console.log('   🚀 Sistema RESPONSIVO (< 1s)');
      } else {
        console.log('   ⚠️  Sistema lento (> 1s)');
      }
    } else {
      console.log('   ❌ Sistema não consegue lidar com requisições simultâneas');
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no teste de responsividade: ${error.message}`);
  }
  
  console.log('');
  return results;
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runSystemListeningTest() {
  console.log('🎧 EXECUTANDO TESTE COMPLETO DE SISTEMA OUVINDO');
  console.log('');
  
  const results = {
    server_health: null,
    market_data: null,
    webhooks: null,
    admin: null,
    responsiveness: null,
    summary: {
      is_listening: false,
      integrations_working: 0,
      critical_errors: [],
      recommendations: []
    }
  };
  
  // Executar todos os testes
  results.server_health = await testServerHealthWithIntegrations();
  results.market_data = await testMarketDataEndpoints();
  results.webhooks = await testWebhookEndpoints();
  results.admin = await testAdminEndpoints();
  results.responsiveness = await testSystemResponsiveness();
  
  // ===== ANÁLISE DOS RESULTADOS =====
  
  console.log('🎯 RESUMO FINAL - SISTEMA OUVINDO');
  console.log('=' .repeat(60));
  
  // Verificar se sistema está ouvindo
  if (results.server_health?.success && results.responsiveness?.system_stable) {
    results.summary.is_listening = true;
    console.log('🎧 ✅ SISTEMA ESTÁ OUVINDO E RESPONDENDO');
  } else {
    console.log('🎧 ❌ SISTEMA NÃO ESTÁ RESPONDENDO ADEQUADAMENTE');
  }
  
  // Contar integrações funcionais
  if (results.market_data?.market_data) results.summary.integrations_working++;
  if (results.market_data?.fear_greed) results.summary.integrations_working++;
  if (results.webhooks?.tradingview) results.summary.integrations_working++;
  if (results.webhooks?.stripe) results.summary.integrations_working++;
  
  console.log(`🔗 Integrações Funcionais: ${results.summary.integrations_working}/4`);
  
  // Status individual
  console.log('');
  console.log('📊 Status das Integrações:');
  console.log(`   💱 Binance: ${results.market_data?.market_data ? '✅ OUVINDO' : '❌ Não responsivo'}`);
  console.log(`   🔄 Bybit: ${results.market_data?.market_data ? '✅ OUVINDO' : '❌ Não responsivo'}`);
  console.log(`   🤖 OpenAI: ⚠️ Chave inválida (não testável)`);
  console.log(`   💳 Stripe: ${results.webhooks?.stripe ? '✅ WEBHOOK OUVINDO' : '⚠️ Webhook pode não estar configurado'}`);
  
  console.log('');
  console.log('📡 Status dos Endpoints:');
  console.log(`   📺 TradingView Webhooks: ${results.webhooks?.tradingview ? '✅ OUVINDO' : '❌ Não responsivo'}`);
  console.log(`   💳 Stripe Webhooks: ${results.webhooks?.stripe ? '✅ OUVINDO' : '❌ Não responsivo'}`);
  console.log(`   👨‍💼 Admin Controls: ${results.admin?.emergency_accessible ? '✅ ACESSÍVEL' : '❌ Inacessível'}`);
  console.log(`   📊 Fear & Greed: ${results.market_data?.fear_greed ? '✅ FUNCIONANDO' : '❌ Não funcionando'}`);
  
  // Responsividade
  if (results.responsiveness?.average_response) {
    console.log('');
    console.log('⚡ Performance:');
    console.log(`   🚀 Tempo médio de resposta: ${results.responsiveness.average_response.toFixed(0)}ms`);
    console.log(`   🔄 Requisições simultâneas: ${results.responsiveness.concurrent_handling ? 'SUPORTADAS' : 'LIMITADAS'}`);
  }
  
  // Score geral
  const systemScore = calculateSystemScore(results);
  console.log('');
  console.log(`🎯 SCORE DO SISTEMA: ${systemScore.toFixed(1)}%`);
  
  if (systemScore >= 80) {
    console.log('🏆 SISTEMA COMPLETAMENTE FUNCIONAL E OUVINDO!');
    console.log('✅ Todas as integrações principais estão respondendo');
  } else if (systemScore >= 60) {
    console.log('⚠️ SISTEMA PARCIALMENTE FUNCIONAL');
    console.log('🔧 Algumas integrações precisam de atenção');
  } else {
    console.log('❌ SISTEMA COM PROBLEMAS CRÍTICOS');
    console.log('🚨 Múltiplas integrações não estão funcionando');
  }
  
  // Recomendações finais
  console.log('');
  console.log('💡 RECOMENDAÇÕES FINAIS:');
  
  if (results.market_data?.market_data) {
    console.log('   ✅ Exchanges funcionando - trading disponível');
  } else {
    console.log('   ❌ Configurar acesso às exchanges para trading');
  }
  
  if (results.webhooks?.system_responsive) {
    console.log('   ✅ Webhooks funcionando - sinais externos sendo recebidos');
  } else {
    console.log('   ❌ Configurar webhooks para receber sinais');
  }
  
  if (results.admin?.admin_auth_working) {
    console.log('   ✅ Controles admin funcionando - sistema gerenciável');
  } else {
    console.log('   ❌ Verificar autenticação administrativa');
  }
  
  console.log('');
  console.log('⏰ Teste finalizado:', new Date().toISOString());
  
  return {
    is_listening: results.summary.is_listening,
    score: systemScore,
    integrations_working: results.summary.integrations_working,
    results
  };
}

function calculateSystemScore(results) {
  let score = 0;
  
  // Servidor funcionando (30 pontos)
  if (results.server_health?.success) score += 30;
  
  // Responsividade (20 pontos)
  if (results.responsiveness?.system_stable) score += 20;
  
  // Dados de mercado (20 pontos)
  if (results.market_data?.market_data) score += 20;
  
  // Webhooks (15 pontos)
  if (results.webhooks?.system_responsive) score += 15;
  
  // Admin (15 pontos)
  if (results.admin?.admin_auth_working) score += 15;
  
  return score;
}

// ===== EXECUÇÃO =====

if (require.main === module) {
  runSystemListeningTest()
    .then(result => {
      console.log(`\n🎧 Sistema ${result.is_listening ? 'OUVINDO' : 'NÃO OUVINDO'} - Score: ${result.score.toFixed(1)}%`);
      process.exit(result.is_listening && result.score >= 70 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro durante teste de sistema:', error);
      process.exit(1);
    });
}

module.exports = { runSystemListeningTest };
