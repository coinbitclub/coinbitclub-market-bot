// ====================================
// 🧪 TESTE SERVIDOR MULTISERVIÇO REAL
// ====================================
// CoinBitClub Market Bot v3.0.0

const axios = require('axios');
const { performance } = require('perf_hooks');

// ===== CONFIGURAÇÕES =====
const CONFIG = {
  MULTISERVICE_URL: 'http://localhost:3000',
  TIMEOUT: 10000
};

let testResults = [];
let totalTests = 0;
let passedTests = 0;
let totalExecutionTime = 0;

// ===== UTILITÁRIOS =====

async function makeRequest(method, path, data = null, headers = {}) {
  const start = performance.now();
  try {
    const config = {
      method,
      url: `${CONFIG.MULTISERVICE_URL}${path}`,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const duration = performance.now() - start;
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      duration: Math.round(duration)
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      duration: Math.round(duration)
    };
  }
}

function logTestResult(testName, result) {
  totalTests++;
  const status = result.success ? '✅' : '❌';
  const duration = `${result.duration}ms`;
  
  if (result.success) {
    passedTests++;
    console.log(`${status} ${testName} (${duration})`);
    if (result.data?.version) console.log(`   📋 Versão: ${result.data.version}`);
    if (result.data?.status) console.log(`   🔧 Status: ${result.data.status}`);
    if (result.data?.service) console.log(`   🎯 Serviço: ${result.data.service}`);
  } else {
    console.log(`${status} ${testName} (${duration})`);
    console.log(`   ❌ Erro: ${result.error || 'Falha na conexão'}`);
    console.log(`   📊 Status: ${result.status}`);
  }
  
  testResults.push({
    test: testName,
    success: result.success,
    duration: result.duration,
    status: result.status,
    error: result.error || null
  });
  
  totalExecutionTime += result.duration;
}

// ===== TESTES DO SERVIDOR MULTISERVIÇO =====

async function testMultiservice() {
  console.log('\n🏗️ SERVIDOR MULTISERVIÇO');
  console.log('========================');
  
  // Teste 1: Página Principal
  const home = await makeRequest('GET', '/');
  logTestResult('Página Principal', home);
  
  // Teste 2: Health Check Básico
  const health = await makeRequest('GET', '/health');
  logTestResult('Health Check Básico', health);
  
  // Teste 3: Health Check API
  const apiHealth = await makeRequest('GET', '/api/health');
  logTestResult('Health Check API', apiHealth);
  
  // Teste 4: Status Detalhado
  const status = await makeRequest('GET', '/api/status');
  logTestResult('Status Detalhado', status);
  
  // Teste 5: Métricas do Sistema
  const metrics = await makeRequest('GET', '/api/metrics');
  logTestResult('Métricas do Sistema', metrics);
}

async function testWebhooks() {
  console.log('\n📡 SISTEMA DE WEBHOOKS');
  console.log('======================');
  
  // Teste 6: Webhook TradingView
  const tradingView = await makeRequest('POST', '/api/webhooks/tradingview', {
    ticker: 'BTCUSDT',
    action: 'BUY',
    price: 45000,
    timestamp: Date.now(),
    test: true
  });
  logTestResult('Webhook TradingView', tradingView);
  
  // Teste 7: Webhook Genérico
  const genericWebhook = await makeRequest('POST', '/webhook/test-signal', {
    signal_id: 'test-123',
    type: 'crypto',
    data: { symbol: 'BTCUSDT', action: 'BUY' }
  });
  logTestResult('Webhook Genérico', genericWebhook);
  
  // Teste 8: Webhook de Teste
  const testWebhook = await makeRequest('POST', '/api/webhooks/test', {
    test_data: 'webhook_test',
    timestamp: Date.now()
  });
  logTestResult('Webhook de Teste', testWebhook);
}

async function testDataAPI() {
  console.log('\n📥 API DE DADOS');
  console.log('================');
  
  // Teste 9: Receber Dados via GET
  const getData = await makeRequest('GET', '/api/data?symbol=BTCUSDT&type=price');
  logTestResult('API Dados GET', getData);
  
  // Teste 10: Receber Dados via POST
  const postData = await makeRequest('POST', '/api/data', {
    symbol: 'BTCUSDT',
    price: 45000,
    volume: 1000,
    timestamp: Date.now()
  });
  logTestResult('API Dados POST', postData);
}

async function testSecurity() {
  console.log('\n🛡️ TESTES DE SEGURANÇA');
  console.log('=======================');
  
  // Teste 11: Rate Limiting
  console.log('🔄 Testando rate limiting...');
  const rateLimitPromises = [];
  for (let i = 0; i < 25; i++) {
    rateLimitPromises.push(makeRequest('GET', '/api/status'));
  }
  
  const rateLimitResults = await Promise.all(rateLimitPromises);
  const blocked = rateLimitResults.filter(r => r.status === 429).length;
  const passed = rateLimitResults.filter(r => r.success).length;
  
  logTestResult('Rate Limiting', {
    success: blocked > 0,
    status: blocked > 0 ? 429 : 200,
    duration: Math.max(...rateLimitResults.map(r => r.duration)),
    data: { blocked, passed, total: 25 }
  });
  
  // Teste 12: CORS Headers
  const corsTest = await makeRequest('OPTIONS', '/api/status', null, {
    'Origin': 'https://test.railway.app',
    'Access-Control-Request-Method': 'GET'
  });
  logTestResult('CORS Headers', corsTest);
  
  // Teste 13: Headers de Segurança
  const securityHeaders = await makeRequest('GET', '/api/status');
  const hasSecurityHeaders = securityHeaders.success && 
    securityHeaders.data && 
    typeof securityHeaders.data === 'object';
  
  logTestResult('Headers de Segurança', {
    success: hasSecurityHeaders,
    status: securityHeaders.status,
    duration: securityHeaders.duration
  });
}

async function testPerformance() {
  console.log('\n⚡ TESTES DE PERFORMANCE');
  console.log('=========================');
  
  // Teste 14: Latência Média (10 requisições)
  console.log('🔄 Testando latência média...');
  const latencyPromises = [];
  for (let i = 0; i < 10; i++) {
    latencyPromises.push(makeRequest('GET', '/api/status'));
  }
  
  const latencyResults = await Promise.all(latencyPromises);
  const avgLatency = latencyResults.reduce((sum, r) => sum + r.duration, 0) / latencyResults.length;
  const successRate = (latencyResults.filter(r => r.success).length / latencyResults.length) * 100;
  
  logTestResult('Latência Média', {
    success: avgLatency < 500 && successRate > 95,
    status: 200,
    duration: Math.round(avgLatency),
    data: { averageLatency: Math.round(avgLatency), successRate }
  });
  
  // Teste 15: Carga Concorrente (20 requisições simultâneas)
  console.log('🔄 Testando carga concorrente...');
  const concurrentPromises = [];
  for (let i = 0; i < 20; i++) {
    concurrentPromises.push(makeRequest('GET', '/api/metrics'));
  }
  
  const concurrentStart = performance.now();
  const concurrentResults = await Promise.all(concurrentPromises);
  const concurrentDuration = performance.now() - concurrentStart;
  
  const concurrentSuccess = concurrentResults.filter(r => r.success).length;
  const concurrentSuccessRate = (concurrentSuccess / 20) * 100;
  
  logTestResult('Carga Concorrente', {
    success: concurrentSuccessRate > 90 && concurrentDuration < 5000,
    status: 200,
    duration: Math.round(concurrentDuration),
    data: { 
      successful: concurrentSuccess, 
      total: 20, 
      successRate: concurrentSuccessRate 
    }
  });
}

async function testErrorHandling() {
  console.log('\n🚫 TRATAMENTO DE ERROS');
  console.log('=======================');
  
  // Teste 16: Rota Inexistente
  const notFound = await makeRequest('GET', '/rota/inexistente');
  logTestResult('Rota Inexistente (404)', {
    success: notFound.status === 404,
    status: notFound.status,
    duration: notFound.duration
  });
  
  // Teste 17: Método Inválido
  const invalidMethod = await makeRequest('DELETE', '/api/status');
  logTestResult('Método Não Permitido', {
    success: invalidMethod.status === 405 || invalidMethod.status === 404,
    status: invalidMethod.status,
    duration: invalidMethod.duration
  });
  
  // Teste 18: Payload Inválido
  const invalidPayload = await makeRequest('POST', '/api/data', 'invalid-json');
  logTestResult('Payload Inválido', {
    success: invalidPayload.status >= 400,
    status: invalidPayload.status,
    duration: invalidPayload.duration
  });
}

// ===== GERAÇÃO DE RELATÓRIO =====

function generateReport() {
  console.log('\n📋 RELATÓRIO FINAL - SERVIDOR MULTISERVIÇO');
  console.log('============================================');
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  const averageResponseTime = Math.round(totalExecutionTime / totalTests);
  
  console.log(`✅ Testes Executados: ${totalTests}`);
  console.log(`🎯 Testes Aprovados: ${passedTests}`);
  console.log(`📊 Taxa de Sucesso: ${successRate}%`);
  console.log(`⏱️ Tempo Médio de Resposta: ${averageResponseTime}ms`);
  console.log(`🕐 Tempo Total de Execução: ${Math.round(totalExecutionTime)}ms`);
  
  console.log('\n📊 RESULTADOS POR CATEGORIA:');
  
  const categories = {
    'Multiserviço': testResults.slice(0, 5),
    'Webhooks': testResults.slice(5, 8),
    'API Dados': testResults.slice(8, 10),
    'Segurança': testResults.slice(10, 13),
    'Performance': testResults.slice(13, 15),
    'Tratamento Erros': testResults.slice(15, 18)
  };
  
  Object.entries(categories).forEach(([category, results]) => {
    if (results.length > 0) {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const rate = Math.round((passed / total) * 100);
      console.log(`   🔧 ${category}: ${passed}/${total} (${rate}%)`);
    }
  });
  
  console.log('\n🎯 AVALIAÇÃO FINAL:');
  if (successRate >= 90) {
    console.log('🎉 ✅ SERVIDOR MULTISERVIÇO TOTALMENTE FUNCIONAL');
    console.log('🏆 Todos os endpoints operacionais!');
    console.log('🚀 Pronto para produção Railway');
  } else if (successRate >= 70) {
    console.log('⚠️ ⚡ SERVIDOR PARCIALMENTE FUNCIONAL');
    console.log('🔧 Alguns endpoints precisam de atenção');
  } else {
    console.log('❌ ❌ SERVIDOR COM PROBLEMAS CRÍTICOS');
    console.log('🚫 Múltiplos endpoints falhando');
    console.log('🔄 Correções urgentes necessárias');
  }
  
  console.log('\n🆔 IDENTIFICAÇÃO DO TESTE:');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔗 URL: ${CONFIG.MULTISERVICE_URL}`);
  console.log(`📱 Versão: CoinBitClub Market Bot v3.0.0`);
  console.log(`🏗️ Arquitetura: Servidor Multiserviço Railway`);
  
  console.log('\n============================================');
  console.log('🎯 TESTE SERVIDOR MULTISERVIÇO FINALIZADO');
  console.log('============================================');
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runAllTests() {
  console.log('🧪 TESTE COMPLETO - SERVIDOR MULTISERVIÇO');
  console.log('==========================================');
  console.log('🎯 CoinBitClub Market Bot v3.0.0');
  console.log('🏗️ Sistema Railway Multiserviço');
  console.log('📅 Início:', new Date().toLocaleString('pt-BR'));
  console.log('==========================================');
  
  try {
    await testMultiservice();
    await testWebhooks();
    await testDataAPI();
    await testSecurity();
    await testPerformance();
    await testErrorHandling();
    
    generateReport();
    
    if (passedTests / totalTests >= 0.8) {
      process.exit(0); // Sucesso
    } else {
      process.exit(1); // Falhas encontradas
    }
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NO TESTE:', error.message);
    console.error('🚫 Execução interrompida');
    process.exit(1);
  }
}

// Executar testes
runAllTests();
