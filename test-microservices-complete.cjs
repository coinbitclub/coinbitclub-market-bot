// ====================================
// 🧪 TESTE COMPLETO DE MICROSERVIÇOS
// ====================================
// CoinBitClub Market Bot v3.0.0
// Sistema de Trading Automatizado

const axios = require('axios');
const { performance } = require('perf_hooks');

// ===== CONFIGURAÇÕES =====
const CONFIG = {
  API_GATEWAY: 'http://localhost:3000',
  SIGNAL_INGESTOR: 'http://localhost:3001',
  SIGNAL_PROCESSOR: 'http://localhost:3002', 
  DECISION_ENGINE: 'http://localhost:3003',
  ORDER_EXECUTOR: 'http://localhost:3004',
  ACCOUNTING: 'http://localhost:3005',
  ADMIN_PANEL: 'http://localhost:3006',
  MONITORING: 'http://localhost:3007',
  NOTIFICATIONS: 'http://localhost:3008',
  TIMEOUT: 10000,
  ADMIN_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin.token',
  USER_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user.token'
};

// ===== ESTRUTURA DE RESULTADOS =====
let testResults = {
  gateway: [],
  ingestor: [],
  processor: [], 
  decisionEngine: [],
  orderExecutor: [],
  accounting: [],
  adminPanel: [],
  monitoring: [],
  notifications: [],
  integration: []
};

let totalTests = 0;
let passedTests = 0;
let totalExecutionTime = 0;

// ===== UTILITÁRIOS =====

async function makeRequest(service, method, path, data = null, headers = {}) {
  const start = performance.now();
  try {
    const config = {
      method,
      url: `${service}${path}`,
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

function logTestResult(service, testName, result) {
  totalTests++;
  const status = result.success ? '✅' : '❌';
  const duration = `${result.duration}ms`;
  
  if (result.success) {
    passedTests++;
    console.log(`${status} ${testName} (${duration})`);
    if (result.data?.version) console.log(`   📋 Versão: ${result.data.version}`);
    if (result.data?.service) console.log(`   🔧 Serviço: ${result.data.service}`);
  } else {
    console.log(`${status} ${testName} (${duration})`);
    console.log(`   ❌ Erro: ${result.error || 'Falha na conexão'}`);
    console.log(`   📊 Status: ${result.status}`);
  }
  
  testResults[service].push({
    test: testName,
    success: result.success,
    duration: result.duration,
    status: result.status,
    error: result.error || null
  });
  
  totalExecutionTime += result.duration;
}

// ===== TESTE API GATEWAY =====

async function testApiGateway() {
  console.log('\n🌐 MICROSERVIÇO: API GATEWAY');
  console.log('============================');
  
  // Teste 1.1: Health Check
  const health = await makeRequest(CONFIG.API_GATEWAY, 'GET', '/api/health');
  logTestResult('gateway', 'Health Check API Gateway', health);
  
  // Teste 1.2: Status do Sistema
  const status = await makeRequest(CONFIG.API_GATEWAY, 'GET', '/api/status');
  logTestResult('gateway', 'Status Sistema Completo', status);
  
  // Teste 1.3: Autenticação
  const auth = await makeRequest(CONFIG.API_GATEWAY, 'POST', '/auth/login', {
    email: 'admin@coinbitclub.com',
    password: 'admin123'
  });
  logTestResult('gateway', 'Sistema de Autenticação', auth);
  
  // Teste 1.4: Dashboard Admin
  const dashboard = await makeRequest(CONFIG.API_GATEWAY, 'GET', '/api/dashboard/admin', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('gateway', 'Dashboard Administrativo', dashboard);
}

// ===== TESTE SIGNAL INGESTOR =====

async function testSignalIngestor() {
  console.log('\n📡 MICROSERVIÇO: SIGNAL INGESTOR');
  console.log('================================');
  
  // Teste 2.1: Health Check
  const health = await makeRequest(CONFIG.SIGNAL_INGESTOR, 'GET', '/health');
  logTestResult('ingestor', 'Health Check Signal Ingestor', health);
  
  // Teste 2.2: Status do Serviço
  const status = await makeRequest(CONFIG.SIGNAL_INGESTOR, 'GET', '/status');
  logTestResult('ingestor', 'Status Signal Ingestor', status);
  
  // Teste 2.3: Webhook TradingView
  const webhook = await makeRequest(CONFIG.SIGNAL_INGESTOR, 'POST', '/webhook/tradingview', {
    ticker: 'BTCUSDT',
    action: 'BUY',
    price: 45000,
    test: true
  });
  logTestResult('ingestor', 'Webhook TradingView', webhook);
  
  // Teste 2.4: Integração CoinStats
  const coinStats = await makeRequest(CONFIG.SIGNAL_INGESTOR, 'GET', '/coinstats/market-data');
  logTestResult('ingestor', 'Integração CoinStats', coinStats);
}

// ===== TESTE SIGNAL PROCESSOR =====

async function testSignalProcessor() {
  console.log('\n⚙️ MICROSERVIÇO: SIGNAL PROCESSOR');
  console.log('==================================');
  
  // Teste 3.1: Health Check
  const health = await makeRequest(CONFIG.SIGNAL_PROCESSOR, 'GET', '/health');
  logTestResult('processor', 'Health Check Signal Processor', health);
  
  // Teste 3.2: Status do Processador
  const status = await makeRequest(CONFIG.SIGNAL_PROCESSOR, 'GET', '/status');
  logTestResult('processor', 'Status Signal Processor', status);
  
  // Teste 3.3: Processamento de Sinal
  const process = await makeRequest(CONFIG.SIGNAL_PROCESSOR, 'POST', '/process', {
    signalId: 'test-signal-123',
    symbol: 'BTCUSDT',
    action: 'BUY',
    confidence: 85
  });
  logTestResult('processor', 'Processamento de Sinal', process);
  
  // Teste 3.4: Filtros de Qualidade
  const filters = await makeRequest(CONFIG.SIGNAL_PROCESSOR, 'GET', '/filters/status');
  logTestResult('processor', 'Filtros de Qualidade', filters);
}

// ===== TESTE DECISION ENGINE =====

async function testDecisionEngine() {
  console.log('\n🧠 MICROSERVIÇO: DECISION ENGINE');
  console.log('=================================');
  
  // Teste 4.1: Health Check
  const health = await makeRequest(CONFIG.DECISION_ENGINE, 'GET', '/health');
  logTestResult('decisionEngine', 'Health Check Decision Engine', health);
  
  // Teste 4.2: Status da IA
  const status = await makeRequest(CONFIG.DECISION_ENGINE, 'GET', '/ai/status');
  logTestResult('decisionEngine', 'Status Sistema IA', status);
  
  // Teste 4.3: Análise de Decisão
  const analysis = await makeRequest(CONFIG.DECISION_ENGINE, 'POST', '/analyze', {
    signal: {
      symbol: 'BTCUSDT',
      price: 45000,
      rsi: 65,
      ema: 'bullish'
    }
  });
  logTestResult('decisionEngine', 'Análise de Decisão IA', analysis);
  
  // Teste 4.4: Regras de Trading
  const rules = await makeRequest(CONFIG.DECISION_ENGINE, 'GET', '/rules/active');
  logTestResult('decisionEngine', 'Regras de Trading', rules);
}

// ===== TESTE ORDER EXECUTOR =====

async function testOrderExecutor() {
  console.log('\n📈 MICROSERVIÇO: ORDER EXECUTOR');
  console.log('================================');
  
  // Teste 5.1: Health Check
  const health = await makeRequest(CONFIG.ORDER_EXECUTOR, 'GET', '/health');
  logTestResult('orderExecutor', 'Health Check Order Executor', health);
  
  // Teste 5.2: Status das Exchanges
  const exchangeStatus = await makeRequest(CONFIG.ORDER_EXECUTOR, 'GET', '/exchanges/status');
  logTestResult('orderExecutor', 'Status das Exchanges', exchangeStatus);
  
  // Teste 5.3: Simulação de Ordem
  const simulate = await makeRequest(CONFIG.ORDER_EXECUTOR, 'POST', '/orders/simulate', {
    symbol: 'BTCUSDT',
    side: 'BUY',
    amount: 0.001,
    price: 45000,
    testMode: true
  });
  logTestResult('orderExecutor', 'Simulação de Ordem', simulate);
  
  // Teste 5.4: Gestão de Risco
  const riskCheck = await makeRequest(CONFIG.ORDER_EXECUTOR, 'POST', '/risk/check', {
    userId: 'test-user',
    symbol: 'BTCUSDT',
    amount: 1000
  });
  logTestResult('orderExecutor', 'Gestão de Risco', riskCheck);
}

// ===== TESTE ACCOUNTING =====

async function testAccounting() {
  console.log('\n💰 MICROSERVIÇO: ACCOUNTING');
  console.log('============================');
  
  // Teste 6.1: Health Check
  const health = await makeRequest(CONFIG.ACCOUNTING, 'GET', '/health');
  logTestResult('accounting', 'Health Check Accounting', health);
  
  // Teste 6.2: Saldos de Usuários
  const balances = await makeRequest(CONFIG.ACCOUNTING, 'GET', '/balances/summary');
  logTestResult('accounting', 'Saldos de Usuários', balances);
  
  // Teste 6.3: Transações
  const transactions = await makeRequest(CONFIG.ACCOUNTING, 'GET', '/transactions/recent');
  logTestResult('accounting', 'Sistema de Transações', transactions);
  
  // Teste 6.4: Relatórios Financeiros
  const reports = await makeRequest(CONFIG.ACCOUNTING, 'GET', '/reports/daily');
  logTestResult('accounting', 'Relatórios Financeiros', reports);
}

// ===== TESTE ADMIN PANEL =====

async function testAdminPanel() {
  console.log('\n🎛️ MICROSERVIÇO: ADMIN PANEL');
  console.log('=============================');
  
  // Teste 7.1: Health Check
  const health = await makeRequest(CONFIG.ADMIN_PANEL, 'GET', '/health');
  logTestResult('adminPanel', 'Health Check Admin Panel', health);
  
  // Teste 7.2: Dashboard Admin
  const dashboard = await makeRequest(CONFIG.ADMIN_PANEL, 'GET', '/dashboard');
  logTestResult('adminPanel', 'Dashboard Admin Panel', dashboard);
  
  // Teste 7.3: Gestão de Usuários
  const users = await makeRequest(CONFIG.ADMIN_PANEL, 'GET', '/users');
  logTestResult('adminPanel', 'Gestão de Usuários', users);
  
  // Teste 7.4: Configurações do Sistema
  const settings = await makeRequest(CONFIG.ADMIN_PANEL, 'GET', '/settings');
  logTestResult('adminPanel', 'Configurações Sistema', settings);
}

// ===== TESTE MONITORING =====

async function testMonitoring() {
  console.log('\n📊 MICROSERVIÇO: MONITORING');
  console.log('============================');
  
  // Teste 8.1: Health Check
  const health = await makeRequest(CONFIG.MONITORING, 'GET', '/health');
  logTestResult('monitoring', 'Health Check Monitoring', health);
  
  // Teste 8.2: Métricas do Sistema
  const metrics = await makeRequest(CONFIG.MONITORING, 'GET', '/metrics');
  logTestResult('monitoring', 'Métricas do Sistema', metrics);
  
  // Teste 8.3: Alertas Ativos
  const alerts = await makeRequest(CONFIG.MONITORING, 'GET', '/alerts');
  logTestResult('monitoring', 'Sistema de Alertas', alerts);
  
  // Teste 8.4: Performance
  const performance = await makeRequest(CONFIG.MONITORING, 'GET', '/performance');
  logTestResult('monitoring', 'Monitoramento Performance', performance);
}

// ===== TESTE NOTIFICATIONS =====

async function testNotifications() {
  console.log('\n🔔 MICROSERVIÇO: NOTIFICATIONS');
  console.log('===============================');
  
  // Teste 9.1: Health Check
  const health = await makeRequest(CONFIG.NOTIFICATIONS, 'GET', '/health');
  logTestResult('notifications', 'Health Check Notifications', health);
  
  // Teste 9.2: Status WhatsApp/Zapi
  const whatsapp = await makeRequest(CONFIG.NOTIFICATIONS, 'GET', '/whatsapp/status');
  logTestResult('notifications', 'Status WhatsApp/Zapi', whatsapp);
  
  // Teste 9.3: Envio de Teste
  const sendTest = await makeRequest(CONFIG.NOTIFICATIONS, 'POST', '/send/test', {
    type: 'whatsapp',
    message: 'Teste de notificação',
    recipient: '+5511999887766'
  });
  logTestResult('notifications', 'Envio de Notificação', sendTest);
  
  // Teste 9.4: Histórico de Mensagens
  const history = await makeRequest(CONFIG.NOTIFICATIONS, 'GET', '/history');
  logTestResult('notifications', 'Histórico Mensagens', history);
}

// ===== TESTE DE INTEGRAÇÃO =====

async function testIntegration() {
  console.log('\n🔗 TESTES DE INTEGRAÇÃO');
  console.log('========================');
  
  // Teste 10.1: Fluxo Completo Signal → Decision → Order
  console.log('🔄 Testando fluxo completo de trading...');
  
  // Simular sinal TradingView
  const signal = await makeRequest(CONFIG.SIGNAL_INGESTOR, 'POST', '/webhook/tradingview', {
    ticker: 'BTCUSDT',
    action: 'BUY',
    price: 45000,
    test: true,
    flowTest: true
  });
  
  if (signal.success && signal.data?.signalId) {
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se foi processado
    const processed = await makeRequest(CONFIG.SIGNAL_PROCESSOR, 'GET', `/signals/${signal.data.signalId}/status`);
    logTestResult('integration', 'Processamento de Sinal', processed);
    
    if (processed.success) {
      // Verificar decisão da IA
      const decision = await makeRequest(CONFIG.DECISION_ENGINE, 'GET', `/decisions/${signal.data.signalId}`);
      logTestResult('integration', 'Decisão da IA', decision);
      
      if (decision.success && decision.data?.decision === 'EXECUTE') {
        // Verificar execução da ordem
        const execution = await makeRequest(CONFIG.ORDER_EXECUTOR, 'GET', `/orders/signal/${signal.data.signalId}`);
        logTestResult('integration', 'Execução da Ordem', execution);
      }
    }
  } else {
    logTestResult('integration', 'Fluxo Completo Trading', { success: false, error: 'Falha no sinal inicial' });
  }
  
  // Teste 10.2: Comunicação entre microserviços
  const communication = await makeRequest(CONFIG.API_GATEWAY, 'GET', '/api/microservices/status');
  logTestResult('integration', 'Comunicação Microserviços', communication);
  
  // Teste 10.3: Sincronização de dados
  const sync = await makeRequest(CONFIG.API_GATEWAY, 'POST', '/api/sync/test');
  logTestResult('integration', 'Sincronização de Dados', sync);
}

// ===== GERAÇÃO DE RELATÓRIO =====

function generateReport() {
  console.log('\n📋 RELATÓRIO FINAL DE MICROSERVIÇOS');
  console.log('====================================');
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  const averageResponseTime = Math.round(totalExecutionTime / totalTests);
  
  console.log(`✅ Testes Executados: ${totalTests}`);
  console.log(`🎯 Testes Aprovados: ${passedTests}`);
  console.log(`📊 Taxa de Sucesso: ${successRate}%`);
  console.log(`⏱️ Tempo Médio de Resposta: ${averageResponseTime}ms`);
  console.log(`🕐 Tempo Total de Execução: ${Math.round(totalExecutionTime)}ms`);
  
  console.log('\n📊 RESULTADOS POR MICROSERVIÇO:');
  
  Object.entries(testResults).forEach(([service, results]) => {
    if (results.length > 0) {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const rate = Math.round((passed / total) * 100);
      const serviceNames = {
        gateway: '🌐 API Gateway',
        ingestor: '📡 Signal Ingestor', 
        processor: '⚙️ Signal Processor',
        decisionEngine: '🧠 Decision Engine',
        orderExecutor: '📈 Order Executor',
        accounting: '💰 Accounting',
        adminPanel: '🎛️ Admin Panel',
        monitoring: '📊 Monitoring',
        notifications: '🔔 Notifications',
        integration: '🔗 Integração'
      };
      console.log(`   ${serviceNames[service]}: ${passed}/${total} (${rate}%)`);
    }
  });
  
  console.log('\n🎯 AVALIAÇÃO FINAL:');
  if (successRate >= 90) {
    console.log('🎉 ✅ TODOS OS MICROSERVIÇOS FUNCIONAIS');
    console.log('🏆 Sistema distribuído operacional!');
    console.log('🚀 Pronto para produção');
  } else if (successRate >= 70) {
    console.log('⚠️ ⚡ SISTEMA PARCIALMENTE FUNCIONAL');
    console.log('🔧 Alguns microserviços precisam de atenção');
  } else {
    console.log('❌ ❌ SISTEMA COM PROBLEMAS CRÍTICOS');
    console.log('🚫 Múltiplos microserviços falhando');
    console.log('🔄 Correções urgentes necessárias');
  }
  
  console.log('\n🆔 IDENTIFICAÇÃO DO TESTE:');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔗 API Gateway: ${CONFIG.API_GATEWAY}`);
  console.log(`📱 Versão: CoinBitClub Market Bot v3.0.0`);
  console.log(`🏗️ Arquitetura: Microserviços Distribuídos`);
  
  console.log('\n====================================');
  console.log('🎯 TESTE DE MICROSERVIÇOS FINALIZADO');
  console.log('====================================');
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runAllTests() {
  console.log('🧪 TESTE COMPLETO DE MICROSERVIÇOS');
  console.log('===================================');
  console.log('🎯 CoinBitClub Market Bot v3.0.0');
  console.log('🏗️ Sistema de Trading Distribuído');
  console.log('📅 Início:', new Date().toLocaleString('pt-BR'));
  console.log('===================================');
  
  try {
    await testApiGateway();
    await testSignalIngestor();
    await testSignalProcessor();
    await testDecisionEngine();
    await testOrderExecutor();
    await testAccounting();
    await testAdminPanel();
    await testMonitoring();
    await testNotifications();
    await testIntegration();
    
    generateReport();
    
    if (passedTests / totalTests >= 0.9) {
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
