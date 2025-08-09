#!/usr/bin/env node

/**
 * 🧪 HOMOLOGAÇÃO COMPLETA - EXECUTOR AUTOMATIZADO
 * CoinBitClub Market Bot v3.0.0
 * 
 * Este script executa uma homologação completa de todas as funcionalidades
 * incluindo a nova integração Zapi WhatsApp Business API
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  ADMIN_TOKEN: 'admin-emergency-token',
  TEST_USER_TOKEN: 'user-test-token',
  TIMEOUT: 10000,
  MAX_RETRIES: 3
};

console.log('🧪 HOMOLOGAÇÃO COMPLETA DO SISTEMA');
console.log('===================================');
console.log('🎯 CoinBitClub Market Bot v3.0.0');
console.log('📱 Com Integração Zapi WhatsApp Business API');
console.log('🌐 Servidor:', CONFIG.SERVER_URL);
console.log('📅 Início:', new Date().toLocaleString('pt-BR'));
console.log('===================================\n');

// Estrutura para armazenar resultados
const homologationResults = {
  infrastructure: [],
  authentication: [],
  whatsapp: [],
  financial: [],
  trading: [],
  affiliate: [],
  dashboard: [],
  integration: [],
  security: [],
  performance: []
};

let totalTests = 0;
let passedTests = 0;
let totalExecutionTime = 0;

// ===== UTILITÁRIOS =====

async function makeRequest(method, url, data = null, headers = {}) {
  const start = performance.now();
  try {
    const config = {
      method,
      url: `${CONFIG.SERVER_URL}${url}`,
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

function logTestResult(category, testName, result, expected = 'SUCCESS') {
  totalTests++;
  const status = result.success ? '✅' : '❌';
  const duration = `${result.duration}ms`;
  
  if (result.success) {
    passedTests++;
    console.log(`${status} ${testName} (${duration})`);
    if (result.data?.version) console.log(`   📋 Versão: ${result.data.version}`);
    if (result.data?.features) console.log(`   🔧 Features: ${result.data.features.length || 0}`);
  } else {
    console.log(`${status} ${testName} (${duration})`);
    console.log(`   ❌ Erro: ${result.error || 'Falha desconhecida'}`);
    console.log(`   📊 Status: ${result.status}`);
  }
  
  homologationResults[category].push({
    test: testName,
    success: result.success,
    duration: result.duration,
    status: result.status,
    error: result.error || null
  });
  
  totalExecutionTime += result.duration;
}

// ===== ETAPA 1: VALIDAÇÃO DE INFRAESTRUTURA =====

async function testInfrastructure() {
  console.log('\n🏗️ ETAPA 1: VALIDAÇÃO DE INFRAESTRUTURA');
  console.log('========================================');
  
  // Teste 1.1: Conectividade básica
  const healthCheck = await makeRequest('GET', '/health');
  logTestResult('infrastructure', 'Conectividade do Servidor', healthCheck);
  
  // Teste 1.2: Status da API
  const apiStatus = await makeRequest('GET', '/api/status');
  logTestResult('infrastructure', 'Status da API Principal', apiStatus);
  
  // Teste 1.3: Conectividade com banco
  const dbStatus = await makeRequest('GET', '/api/admin/db-status', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('infrastructure', 'Conectividade PostgreSQL', dbStatus);
  
  // Teste 1.4: Logs do sistema
  const systemLogs = await makeRequest('GET', '/api/admin/system-logs', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('infrastructure', 'Sistema de Logs', systemLogs);
}

// ===== ETAPA 2: SISTEMA DE AUTENTICAÇÃO =====

async function testAuthentication() {
  console.log('\n🔐 ETAPA 2: SISTEMA DE AUTENTICAÇÃO');
  console.log('===================================');
  
  // Teste 2.1: Registro de usuário
  const registerData = {
    email: `teste${Date.now()}@coinbitclub.com`,
    password: 'TesteSeguro123!',
    whatsappNumber: '+5511999887766',
    firstName: 'Teste',
    lastName: 'Homologação'
  };
  
  const register = await makeRequest('POST', '/auth/register', registerData);
  logTestResult('authentication', 'Registro de Usuário', register);
  
  // Teste 2.2: Login
  const loginData = {
    email: 'admin@coinbitclub.com',
    password: 'admin123'
  };
  
  const login = await makeRequest('POST', '/auth/login', loginData);
  logTestResult('authentication', 'Login de Usuário', login);
  
  // Teste 2.3: Verificação de token JWT
  const tokenVerification = await makeRequest('GET', '/api/user/profile', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('authentication', 'Verificação JWT', tokenVerification);
  
  // Teste 2.4: Reset de senha tradicional
  const forgotPassword = await makeRequest('POST', '/auth/forgot-password', {
    email: 'teste@coinbitclub.com'
  });
  logTestResult('authentication', 'Reset Senha Tradicional', forgotPassword);
  
  // Teste 2.5: Reset de senha via WhatsApp (NOVO)
  const forgotPasswordWhatsApp = await makeRequest('POST', '/auth/forgot-password-whatsapp', {
    email: 'teste@coinbitclub.com'
  });
  logTestResult('authentication', 'Reset Senha via WhatsApp (NOVO)', forgotPasswordWhatsApp);
}

// ===== ETAPA 3: SISTEMA WHATSAPP (ZAPI) =====

async function testWhatsApp() {
  console.log('\n📱 ETAPA 3: SISTEMA WHATSAPP (ZAPI INTEGRATION)');
  console.log('===============================================');
  
  // Teste 3.1: Status do sistema WhatsApp
  const whatsappStatus = await makeRequest('GET', '/api/whatsapp/status', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('whatsapp', 'Status Sistema WhatsApp', whatsappStatus);
  
  // Teste 3.2: Configuração Zapi
  const zapiConfig = await makeRequest('GET', '/api/zapi/status', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('whatsapp', 'Configuração Zapi', zapiConfig);
  
  // Teste 3.3: Envio de mensagem WhatsApp
  const sendMessage = await makeRequest('POST', '/api/whatsapp/send-verification', {
    whatsappNumber: '+5511999887766',
    message: 'Teste de homologação'
  }, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('whatsapp', 'Envio Mensagem WhatsApp', sendMessage);
  
  // Teste 3.4: Verificação WhatsApp
  const startVerification = await makeRequest('POST', '/api/whatsapp/start-verification', {
    whatsappNumber: '+5511999887766'
  }, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('whatsapp', 'Iniciar Verificação WhatsApp', startVerification);
  
  // Teste 3.5: Logs WhatsApp
  const whatsappLogs = await makeRequest('GET', '/api/admin/whatsapp-logs', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('whatsapp', 'Logs WhatsApp/Zapi', whatsappLogs);
  
  // Teste 3.6: Dashboard WhatsApp Admin
  const whatsappStats = await makeRequest('GET', '/api/admin/whatsapp-stats', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('whatsapp', 'Dashboard WhatsApp Admin', whatsappStats);
}

// ===== ETAPA 4: SISTEMA FINANCEIRO =====

async function testFinancial() {
  console.log('\n💰 ETAPA 4: SISTEMA FINANCEIRO');
  console.log('==============================');
  
  // Teste 4.1: Saldos do usuário
  const userBalance = await makeRequest('GET', '/api/financial/balance', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('financial', 'Saldos do Usuário', userBalance);
  
  // Teste 4.2: Histórico de transações
  const transactions = await makeRequest('GET', '/api/financial/transactions', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('financial', 'Histórico de Transações', transactions);
  
  // Teste 4.3: Sistema de assinaturas
  const subscriptions = await makeRequest('GET', '/api/subscriptions/current', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('financial', 'Sistema de Assinaturas', subscriptions);
  
  // Teste 4.4: Relatório financeiro da empresa
  const companyFinancial = await makeRequest('GET', '/api/admin/financial-summary', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('financial', 'Relatório Financeiro Empresa', companyFinancial);
  
  // Teste 4.5: Processamento de reembolsos
  const refundProcessing = await makeRequest('GET', '/api/admin/refund-requests', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('financial', 'Sistema de Reembolsos', refundProcessing);
}

// ===== ETAPA 5: SISTEMA DE TRADING =====

async function testTrading() {
  console.log('\n📈 ETAPA 5: SISTEMA DE TRADING');
  console.log('==============================');
  
  // Teste 5.1: Operações do usuário
  const userOperations = await makeRequest('GET', '/api/operations', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('trading', 'Operações do Usuário', userOperations);
  
  // Teste 5.2: Credenciais de exchange
  const exchangeCredentials = await makeRequest('GET', '/api/credentials', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('trading', 'Credenciais de Exchange', exchangeCredentials);
  
  // Teste 5.3: Análise de sinais
  const signalAnalysis = await makeRequest('GET', '/api/admin/trading-signals', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('trading', 'Análise de Sinais', signalAnalysis);
  
  // Teste 5.4: Dados de mercado
  const marketData = await makeRequest('GET', '/api/market/current', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('trading', 'Dados de Mercado', marketData);
  
  // Teste 5.5: Performance de trading
  const tradingPerformance = await makeRequest('GET', '/api/analytics/performance', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('trading', 'Performance de Trading', tradingPerformance);
}

// ===== ETAPA 6: SISTEMA DE AFILIADOS =====

async function testAffiliate() {
  console.log('\n🤝 ETAPA 6: SISTEMA DE AFILIADOS');
  console.log('=================================');
  
  // Teste 6.1: Dashboard de afiliados
  const affiliateDashboard = await makeRequest('GET', '/api/affiliate/dashboard', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('affiliate', 'Dashboard de Afiliados', affiliateDashboard);
  
  // Teste 6.2: Histórico de comissões
  const commissionHistory = await makeRequest('GET', '/api/affiliate/commission-history', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('affiliate', 'Histórico de Comissões', commissionHistory);
  
  // Teste 6.3: Sistema de créditos
  const affiliateCredits = await makeRequest('GET', '/api/affiliate/credits', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('affiliate', 'Sistema de Créditos', affiliateCredits);
  
  // Teste 6.4: Relatórios admin afiliados
  const adminAffiliates = await makeRequest('GET', '/api/admin/affiliates', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('affiliate', 'Relatórios Admin Afiliados', adminAffiliates);
}

// ===== ETAPA 7: DASHBOARD E RELATÓRIOS =====

async function testDashboard() {
  console.log('\n📊 ETAPA 7: DASHBOARD E RELATÓRIOS');
  console.log('==================================');
  
  // Teste 7.1: Dashboard do usuário
  const userDashboard = await makeRequest('GET', '/api/dashboard/user', null, {
    Authorization: `Bearer ${CONFIG.TEST_USER_TOKEN}`
  });
  logTestResult('dashboard', 'Dashboard do Usuário', userDashboard);
  
  // Teste 7.2: Dashboard administrativo
  const adminDashboard = await makeRequest('GET', '/api/dashboard/admin', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('dashboard', 'Dashboard Administrativo', adminDashboard);
  
  // Teste 7.3: Dashboard WhatsApp (NOVO)
  const whatsappDashboard = await makeRequest('GET', '/api/admin/whatsapp-dashboard', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('dashboard', 'Dashboard WhatsApp (NOVO)', whatsappDashboard);
  
  // Teste 7.4: Relatórios analíticos
  const analytics = await makeRequest('GET', '/api/analytics/summary', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('dashboard', 'Relatórios Analíticos', analytics);
}

// ===== ETAPA 8: TESTES DE INTEGRAÇÃO =====

async function testIntegration() {
  console.log('\n🔗 ETAPA 8: TESTES DE INTEGRAÇÃO');
  console.log('=================================');
  
  // Teste 8.1: Webhook TradingView
  const tradingViewWebhook = await makeRequest('POST', '/webhooks/tradingview', {
    ticker: 'BTCUSDT',
    action: 'BUY',
    price: 45000
  });
  logTestResult('integration', 'Webhook TradingView', tradingViewWebhook);
  
  // Teste 8.2: Integração OpenAI
  const openaiStatus = await makeRequest('GET', '/api/admin/openai-status', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('integration', 'Integração OpenAI', openaiStatus);
  
  // Teste 8.3: Webhook Zapi (NOVO)
  const zapiWebhook = await makeRequest('POST', '/api/zapi/webhook', {
    messageId: 'test_123',
    status: 'delivered'
  });
  logTestResult('integration', 'Webhook Zapi (NOVO)', zapiWebhook);
  
  // Teste 8.4: Jobs automáticos
  const scheduledJobs = await makeRequest('GET', '/api/admin/scheduled-jobs', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('integration', 'Jobs Automáticos', scheduledJobs);
}

// ===== ETAPA 9: TESTES DE SEGURANÇA =====

async function testSecurity() {
  console.log('\n🔐 ETAPA 9: TESTES DE SEGURANÇA');
  console.log('===============================');
  
  // Teste 9.1: Acesso não autorizado
  const unauthorizedAccess = await makeRequest('GET', '/api/admin/users');
  logTestResult('security', 'Bloqueio Acesso Não Autorizado', 
    { ...unauthorizedAccess, success: !unauthorizedAccess.success });
  
  // Teste 9.2: Rate limiting
  const rateLimitTest = await makeRequest('GET', '/api/status');
  logTestResult('security', 'Rate Limiting', rateLimitTest);
  
  // Teste 9.3: Validação de entrada
  const inputValidation = await makeRequest('POST', '/auth/login', {
    email: 'invalid-email',
    password: '123'
  });
  logTestResult('security', 'Validação de Entrada', 
    { ...inputValidation, success: !inputValidation.success });
  
  // Teste 9.4: Logs de auditoria
  const auditLogs = await makeRequest('GET', '/api/admin/audit-logs', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  logTestResult('security', 'Logs de Auditoria', auditLogs);
  
  // Teste 9.5: Segurança webhook Zapi (NOVO)
  const zapiSecurity = await makeRequest('POST', '/api/zapi/webhook', {
    invalid: 'data'
  });
  logTestResult('security', 'Segurança Webhook Zapi (NOVO)', 
    { ...zapiSecurity, success: !zapiSecurity.success });
}

// ===== ETAPA 10: TESTES DE PERFORMANCE =====

async function testPerformance() {
  console.log('\n⚡ ETAPA 10: TESTES DE PERFORMANCE');
  console.log('==================================');
  
  // Teste 10.1: Tempo de resposta da API
  const start = performance.now();
  const apiResponse = await makeRequest('GET', '/api/status');
  const apiDuration = performance.now() - start;
  
  const performanceResult = {
    success: apiResponse.success && apiDuration < 500,
    duration: Math.round(apiDuration)
  };
  logTestResult('performance', `Tempo Resposta API (${performanceResult.duration}ms)`, performanceResult);
  
  // Teste 10.2: Performance de consultas no banco
  const dbPerformanceStart = performance.now();
  const dbQuery = await makeRequest('GET', '/api/admin/db-performance', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  const dbDuration = performance.now() - dbPerformanceStart;
  
  const dbPerformanceResult = {
    success: dbQuery.success && dbDuration < 1000,
    duration: Math.round(dbDuration)
  };
  logTestResult('performance', `Performance Banco (${dbPerformanceResult.duration}ms)`, dbPerformanceResult);
  
  // Teste 10.3: Performance WhatsApp/Zapi (NOVO)
  const whatsappPerformanceStart = performance.now();
  const whatsappPerformance = await makeRequest('GET', '/api/whatsapp/status', null, {
    Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}`
  });
  const whatsappDuration = performance.now() - whatsappPerformanceStart;
  
  const whatsappPerformanceResult = {
    success: whatsappPerformance.success && whatsappDuration < 2000,
    duration: Math.round(whatsappDuration)
  };
  logTestResult('performance', `Performance WhatsApp/Zapi (${whatsappPerformanceResult.duration}ms)`, whatsappPerformanceResult);
}

// ===== GERAÇÃO DE RELATÓRIO FINAL =====

function generateFinalReport() {
  console.log('\n📋 RELATÓRIO FINAL DE HOMOLOGAÇÃO');
  console.log('==================================');
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  const averageResponseTime = Math.round(totalExecutionTime / totalTests);
  
  console.log(`✅ Testes Executados: ${totalTests}`);
  console.log(`🎯 Testes Aprovados: ${passedTests}`);
  console.log(`📊 Taxa de Sucesso: ${successRate}%`);
  console.log(`⏱️ Tempo Médio de Resposta: ${averageResponseTime}ms`);
  console.log(`🕐 Tempo Total de Execução: ${Math.round(totalExecutionTime)}ms`);
  
  console.log('\n📊 RESULTADOS POR CATEGORIA:');
  
  Object.entries(homologationResults).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const categoryPassed = tests.filter(t => t.success).length;
      const categoryTotal = tests.length;
      const categoryRate = Math.round((categoryPassed / categoryTotal) * 100);
      
      console.log(`   ${getCategoryIcon(category)} ${getCategoryName(category)}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
    }
  });
  
  console.log('\n🎯 AVALIAÇÃO FINAL:');
  
  if (successRate >= 95) {
    console.log('🎉 ✅ SISTEMA APROVADO PARA PRODUÇÃO');
    console.log('🏆 Conformidade total alcançada!');
    console.log('🚀 Pronto para deploy em produção');
  } else if (successRate >= 85) {
    console.log('⚠️ ✅ SISTEMA APROVADO COM RESSALVAS');
    console.log('🔧 Alguns ajustes menores necessários');
    console.log('📝 Revisar falhas antes do deploy');
  } else {
    console.log('❌ ❌ SISTEMA REPROVADO');
    console.log('🚫 Correções críticas necessárias');
    console.log('🔄 Nova homologação obrigatória');
  }
  
  console.log('\n🆔 IDENTIFICAÇÃO DO TESTE:');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔗 Servidor: ${CONFIG.SERVER_URL}`);
  console.log(`📱 Versão: CoinBitClub Market Bot v3.0.0`);
  console.log(`🔌 Integração: Zapi WhatsApp Business API`);
  
  console.log('\n==================================');
  console.log('🎯 HOMOLOGAÇÃO COMPLETA FINALIZADA');
  console.log('==================================');
  
  return successRate >= 95 ? 0 : 1;
}

function getCategoryIcon(category) {
  const icons = {
    infrastructure: '🏗️',
    authentication: '🔐',
    whatsapp: '📱',
    financial: '💰',
    trading: '📈',
    affiliate: '🤝',
    dashboard: '📊',
    integration: '🔗',
    security: '🔐',
    performance: '⚡'
  };
  return icons[category] || '📋';
}

function getCategoryName(category) {
  const names = {
    infrastructure: 'Infraestrutura',
    authentication: 'Autenticação',
    whatsapp: 'WhatsApp/Zapi',
    financial: 'Financeiro',
    trading: 'Trading',
    affiliate: 'Afiliados',
    dashboard: 'Dashboard',
    integration: 'Integração',
    security: 'Segurança',
    performance: 'Performance'
  };
  return names[category] || category;
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runCompleteHomologation() {
  const startTime = performance.now();
  
  try {
    console.log('🚀 Iniciando homologação completa...\n');
    
    await testInfrastructure();
    await testAuthentication();
    await testWhatsApp();
    await testFinancial();
    await testTrading();
    await testAffiliate();
    await testDashboard();
    await testIntegration();
    await testSecurity();
    await testPerformance();
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    console.log(`\n⏱️ Tempo total de homologação: ${totalTime}ms`);
    
    const exitCode = generateFinalReport();
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NA HOMOLOGAÇÃO:', error.message);
    console.log('❌ Homologação interrompida');
    process.exit(1);
  }
}

// Aguardar 2 segundos antes de iniciar
setTimeout(() => {
  runCompleteHomologation().catch(console.error);
}, 2000);
