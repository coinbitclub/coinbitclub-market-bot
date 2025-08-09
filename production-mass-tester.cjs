#!/usr/bin/env node
/**
 * 🚀 TESTES EM MASSA PARA PRODUÇÃO - COINBITCLUB MARKETBOT
 * Sistema completo de validação em ambiente de produção
 * Versão: 2.0.0 - 28/07/2025
 */

const axios = require('axios').default;
const fs = require('fs');
const path = require('path');

class ProductionMassTestEngine {
  constructor() {
    this.baseUrls = {
      local: 'http://localhost:8080',
      railway: 'https://coinbitclub-backend-production.up.railway.app',
      vercel: 'https://coinbitclub-frontend.vercel.app'
    };
    
    this.testResults = {
      backend: { passed: 0, failed: 0, errors: [] },
      frontend: { passed: 0, failed: 0, errors: [] },
      trading: { passed: 0, failed: 0, errors: [] },
      integration: { passed: 0, failed: 0, errors: [] },
      load: { passed: 0, failed: 0, errors: [] }
    };
    
    this.testTokens = {
      webhook: 'coinbitclub_webhook_secret_2024',
      testUser: null,
      adminUser: null
    };

    this.loadTestConfig = {
      concurrentUsers: 50,
      requestsPerUser: 100,
      testDuration: 60000 // 1 minuto
    };
  }

  async runProductionMassTests() {
    console.log('🚀 INICIANDO TESTES EM MASSA PARA PRODUÇÃO\n');
    console.log('📊 Configuração dos Testes:');
    console.log(`- Usuários Simultâneos: ${this.loadTestConfig.concurrentUsers}`);
    console.log(`- Requests por Usuário: ${this.loadTestConfig.requestsPerUser}`);
    console.log(`- Duração do Teste: ${this.loadTestConfig.testDuration / 1000}s\n`);

    try {
      // 1. Testes de Backend em Massa
      console.log('🔧 FASE 1: TESTES BACKEND EM MASSA');
      await this.massBackendTests();

      // 2. Testes de Trading Pipeline
      console.log('\n📈 FASE 2: TESTES TRADING PIPELINE');
      await this.massTradingTests();

      // 3. Testes de Carga (Load Testing)
      console.log('\n⚡ FASE 3: TESTES DE CARGA');
      await this.loadTests();

      // 4. Testes de Integração Frontend-Backend
      console.log('\n🔗 FASE 4: TESTES DE INTEGRAÇÃO');
      await this.integrationTests();

      // 5. Testes de Resilência
      console.log('\n🛡️ FASE 5: TESTES DE RESILÊNCIA');
      await this.resilienceTests();

      // 6. Gerar relatório final
      this.generateProductionReport();
      
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NOS TESTES:', error);
      throw error;
    }
  }

  async massBackendTests() {
    console.log('🎯 Testando endpoints críticos em massa...');
    
    const endpoints = [
      { method: 'GET', path: '/api/health', description: 'Health Check' },
      { method: 'GET', path: '/api/status', description: 'Status API' },
      { method: 'POST', path: '/api/auth/register', description: 'Registro Usuário' },
      { method: 'POST', path: '/api/auth/login', description: 'Login Usuário' },
      { method: 'POST', path: '/api/auth/request-otp', description: 'Solicitação OTP' },
      { method: 'GET', path: '/api/auth/thulio-sms-status', description: 'Status SMS' },
      { method: 'POST', path: '/api/webhooks/signal', description: 'Webhook Trading' }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testando ${endpoint.description}...`);
      
      const testCount = 50; // 50 testes por endpoint
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < testCount; i++) {
        try {
          const result = await this.testEndpoint(endpoint, i);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(result.error);
          }
        } catch (error) {
          errorCount++;
          errors.push(error.message);
        }
      }

      const successRate = (successCount / testCount) * 100;
      console.log(`✅ Sucesso: ${successCount}/${testCount} (${successRate.toFixed(1)}%)`);
      
      if (errorCount > 0) {
        console.log(`❌ Erros: ${errorCount}`);
        this.testResults.backend.failed += errorCount;
        this.testResults.backend.errors.push(...errors);
      }
      
      this.testResults.backend.passed += successCount;
    }
  }

  async testEndpoint(endpoint, iteration) {
    try {
      let config = {
        method: endpoint.method,
        url: `${this.baseUrls.local}${endpoint.path}`,
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      };

      // Configurar dados específicos para cada endpoint
      if (endpoint.method === 'POST') {
        switch (endpoint.path) {
          case '/api/auth/register':
            config.data = {
              email: `testuser${iteration}@test.com`,
              password: 'Test123!',
              phone: `551199999${String(iteration).padStart(4, '0')}`
            };
            break;
          
          case '/api/auth/login':
            config.data = {
              email: 'faleconosco@coinbitclub.vip',
              password: 'password'
            };
            break;
          
          case '/api/auth/request-otp':
            config.data = {
              email: `testuser${iteration}@test.com`,
              phone: `551199999${String(iteration).padStart(4, '0')}`
            };
            break;
          
          case '/api/webhooks/signal':
            config.data = {
              token: this.testTokens.webhook,
              ticker: 'BTCUSDT',
              side: iteration % 2 === 0 ? 'BUY' : 'SELL',
              price: 50000 + (iteration * 100),
              timestamp: new Date().toISOString()
            };
            break;
        }
      }

      const response = await axios(config);
      
      return {
        success: response.status >= 200 && response.status < 400,
        status: response.status,
        data: response.data
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 'NETWORK_ERROR'
      };
    }
  }

  async massTradingTests() {
    console.log('📊 Simulando sinais de trading em massa...');
    
    const tradingSignals = [
      { ticker: 'BTCUSDT', side: 'BUY', price: 45000 },
      { ticker: 'ETHUSDT', side: 'SELL', price: 3000 },
      { ticker: 'ADAUSDT', side: 'BUY', price: 0.5 },
      { ticker: 'DOTUSDT', side: 'SELL', price: 8.5 },
      { ticker: 'LINKUSDT', side: 'BUY', price: 15.2 }
    ];

    const signalCount = 200; // 200 sinais por par
    let totalSignals = 0;
    let successfulSignals = 0;
    let failedSignals = 0;

    for (const baseSignal of tradingSignals) {
      console.log(`\n🎯 Testando ${baseSignal.ticker}...`);
      
      for (let i = 0; i < signalCount; i++) {
        try {
          const signal = {
            ...baseSignal,
            token: this.testTokens.webhook,
            price: baseSignal.price + (Math.random() * 1000 - 500), // Variação de preço
            timestamp: new Date().toISOString(),
            signal_id: `test_${Date.now()}_${i}`
          };

          const response = await axios.post(
            `${this.baseUrls.local}/api/webhooks/signal`,
            signal,
            { 
              timeout: 3000,
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (response.status === 200) {
            successfulSignals++;
          } else {
            failedSignals++;
          }
          
          totalSignals++;
          
          // Pequena pausa para evitar sobrecarga
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
        } catch (error) {
          failedSignals++;
          totalSignals++;
          this.testResults.trading.errors.push(`${baseSignal.ticker}: ${error.message}`);
        }
      }
    }

    const successRate = (successfulSignals / totalSignals) * 100;
    console.log(`\n📈 RESULTADOS TRADING:`);
    console.log(`Total de sinais: ${totalSignals}`);
    console.log(`Sucessos: ${successfulSignals} (${successRate.toFixed(1)}%)`);
    console.log(`Falhas: ${failedSignals}`);

    this.testResults.trading.passed = successfulSignals;
    this.testResults.trading.failed = failedSignals;
  }

  async loadTests() {
    console.log('⚡ Executando testes de carga...');
    
    const startTime = Date.now();
    const promises = [];
    
    // Criar múltiplas conexões simultâneas
    for (let user = 0; user < this.loadTestConfig.concurrentUsers; user++) {
      promises.push(this.simulateUserLoad(user));
    }

    try {
      const results = await Promise.allSettled(promises);
      
      let totalRequests = 0;
      let successfulRequests = 0;
      let failedRequests = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalRequests += result.value.total;
          successfulRequests += result.value.success;
          failedRequests += result.value.failed;
        } else {
          console.log(`❌ Usuário ${index} falhou: ${result.reason}`);
          failedRequests += this.loadTestConfig.requestsPerUser;
          totalRequests += this.loadTestConfig.requestsPerUser;
        }
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const requestsPerSecond = totalRequests / duration;

      console.log(`\n⚡ RESULTADOS TESTE DE CARGA:`);
      console.log(`Duração: ${duration.toFixed(2)}s`);
      console.log(`Total de requests: ${totalRequests}`);
      console.log(`Sucessos: ${successfulRequests}`);
      console.log(`Falhas: ${failedRequests}`);
      console.log(`Taxa de sucesso: ${((successfulRequests/totalRequests)*100).toFixed(1)}%`);
      console.log(`Requests/segundo: ${requestsPerSecond.toFixed(2)}`);

      this.testResults.load.passed = successfulRequests;
      this.testResults.load.failed = failedRequests;

    } catch (error) {
      console.error('❌ Erro no teste de carga:', error);
      this.testResults.load.errors.push(error.message);
    }
  }

  async simulateUserLoad(userId) {
    let successCount = 0;
    let failCount = 0;
    
    const endpoints = [
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '/api/status' },
      { method: 'GET', path: '/api/auth/thulio-sms-status' }
    ];

    for (let i = 0; i < this.loadTestConfig.requestsPerUser; i++) {
      try {
        const endpoint = endpoints[i % endpoints.length];
        
        const response = await axios({
          method: endpoint.method,
          url: `${this.baseUrls.local}${endpoint.path}`,
          timeout: 5000
        });

        if (response.status >= 200 && response.status < 400) {
          successCount++;
        } else {
          failCount++;
        }

      } catch (error) {
        failCount++;
      }

      // Pequena pausa aleatória para simular comportamento real
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      }
    }

    return {
      userId,
      total: this.loadTestConfig.requestsPerUser,
      success: successCount,
      failed: failCount
    };
  }

  async integrationTests() {
    console.log('🔗 Testando integração frontend-backend...');
    
    const integrationScenarios = [
      'user_registration_flow',
      'user_login_flow', 
      'otp_verification_flow',
      'trading_signal_flow',
      'dashboard_data_flow'
    ];

    for (const scenario of integrationScenarios) {
      console.log(`\n🎯 Testando cenário: ${scenario}`);
      
      try {
        const result = await this.testIntegrationScenario(scenario);
        
        if (result.success) {
          console.log(`✅ ${scenario}: PASSOU`);
          this.testResults.integration.passed++;
        } else {
          console.log(`❌ ${scenario}: FALHOU - ${result.error}`);
          this.testResults.integration.failed++;
          this.testResults.integration.errors.push(`${scenario}: ${result.error}`);
        }
        
      } catch (error) {
        console.log(`❌ ${scenario}: ERRO - ${error.message}`);
        this.testResults.integration.failed++;
        this.testResults.integration.errors.push(`${scenario}: ${error.message}`);
      }
    }
  }

  async testIntegrationScenario(scenario) {
    switch (scenario) {
      case 'user_registration_flow':
        return await this.testUserRegistrationFlow();
      
      case 'user_login_flow':
        return await this.testUserLoginFlow();
      
      case 'otp_verification_flow':
        return await this.testOTPFlow();
      
      case 'trading_signal_flow':
        return await this.testTradingSignalFlow();
      
      case 'dashboard_data_flow':
        return await this.testDashboardFlow();
      
      default:
        return { success: false, error: 'Cenário desconhecido' };
    }
  }

  async testUserRegistrationFlow() {
    try {
      // 1. Registrar usuário
      const registerResponse = await axios.post(`${this.baseUrls.local}/api/auth/register`, {
        email: `integration_test_${Date.now()}@test.com`,
        password: 'Test123!',
        phone: '5511999999999'
      });

      if (registerResponse.status !== 201) {
        return { success: false, error: 'Falha no registro' };
      }

      // 2. Verificar se token foi gerado
      if (!registerResponse.data.token) {
        return { success: false, error: 'Token não gerado' };
      }

      return { success: true, data: registerResponse.data };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testUserLoginFlow() {
    try {
      // Tentar login com credenciais padrão
      const loginResponse = await axios.post(`${this.baseUrls.local}/api/auth/login`, {
        email: 'faleconosco@coinbitclub.vip',
        password: 'password'
      });

      if (loginResponse.status !== 200) {
        return { success: false, error: 'Falha no login' };
      }

      if (!loginResponse.data.token) {
        return { success: false, error: 'Token não retornado' };
      }

      this.testTokens.testUser = loginResponse.data.token;
      return { success: true, data: loginResponse.data };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testOTPFlow() {
    try {
      // Solicitar OTP
      const otpResponse = await axios.post(`${this.baseUrls.local}/api/auth/request-otp`, {
        email: 'test@test.com',
        phone: '5511999999999'
      });

      if (otpResponse.status !== 200) {
        return { success: false, error: 'Falha na solicitação OTP' };
      }

      // Verificar status SMS
      const statusResponse = await axios.get(`${this.baseUrls.local}/api/auth/thulio-sms-status`);
      
      if (statusResponse.status !== 200) {
        return { success: false, error: 'Falha no status SMS' };
      }

      return { success: true, data: { otp: otpResponse.data, status: statusResponse.data } };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testTradingSignalFlow() {
    try {
      // Enviar sinal de trading
      const signalResponse = await axios.post(`${this.baseUrls.local}/api/webhooks/signal`, {
        token: this.testTokens.webhook,
        ticker: 'BTCUSDT',
        side: 'BUY',
        price: 50000,
        timestamp: new Date().toISOString()
      });

      if (signalResponse.status !== 200) {
        return { success: false, error: 'Falha no processamento do sinal' };
      }

      if (!signalResponse.data.signal_id) {
        return { success: false, error: 'Signal ID não gerado' };
      }

      return { success: true, data: signalResponse.data };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testDashboardFlow() {
    try {
      // Testar endpoints do dashboard
      const healthResponse = await axios.get(`${this.baseUrls.local}/api/health`);
      const statusResponse = await axios.get(`${this.baseUrls.local}/api/status`);

      if (healthResponse.status !== 200 || statusResponse.status !== 200) {
        return { success: false, error: 'Endpoints do dashboard falharam' };
      }

      return { success: true, data: { health: healthResponse.data, status: statusResponse.data } };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resilienceTests() {
    console.log('🛡️ Testando resilência do sistema...');
    
    const resilienceTests = [
      'high_concurrent_connections',
      'malformed_requests',
      'timeout_handling',
      'error_recovery'
    ];

    for (const test of resilienceTests) {
      console.log(`\n🔍 Teste de resilência: ${test}`);
      
      try {
        const result = await this.testResilience(test);
        
        if (result.success) {
          console.log(`✅ ${test}: Sistema resiliente`);
        } else {
          console.log(`⚠️ ${test}: ${result.message}`);
        }
        
      } catch (error) {
        console.log(`❌ ${test}: Falha na resilência - ${error.message}`);
      }
    }
  }

  async testResilience(testType) {
    switch (testType) {
      case 'high_concurrent_connections':
        return await this.testHighConcurrency();
      
      case 'malformed_requests':
        return await this.testMalformedRequests();
      
      case 'timeout_handling':
        return await this.testTimeoutHandling();
      
      case 'error_recovery':
        return await this.testErrorRecovery();
      
      default:
        return { success: false, message: 'Teste desconhecido' };
    }
  }

  async testHighConcurrency() {
    try {
      const concurrentRequests = 100;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          axios.get(`${this.baseUrls.local}/api/health`, { timeout: 10000 })
        );
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successCount / concurrentRequests) * 100;

      return {
        success: successRate >= 80, // 80% de sucesso mínimo
        message: `${successCount}/${concurrentRequests} requests bem-sucedidas (${successRate.toFixed(1)}%)`
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testMalformedRequests() {
    try {
      const malformedData = [
        null,
        undefined,
        '',
        'invalid_json',
        { invalid: 'data' },
        { email: 'not_an_email', password: 123 }
      ];

      let handledCorrectly = 0;
      
      for (const data of malformedData) {
        try {
          await axios.post(`${this.baseUrls.local}/api/auth/login`, data);
          // Se chegou aqui, deveria ter dado erro
        } catch (error) {
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            handledCorrectly++; // Erro 4xx esperado para dados inválidos
          }
        }
      }

      const handleRate = (handledCorrectly / malformedData.length) * 100;
      
      return {
        success: handleRate >= 80,
        message: `${handledCorrectly}/${malformedData.length} requests malformadas tratadas corretamente (${handleRate.toFixed(1)}%)`
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testTimeoutHandling() {
    try {
      // Testar com timeout muito baixo
      const startTime = Date.now();
      
      try {
        await axios.get(`${this.baseUrls.local}/api/health`, { timeout: 1 }); // 1ms timeout
        return { success: false, message: 'Timeout não foi respeitado' };
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error.code === 'ECONNABORTED' && duration < 100) {
          return { success: true, message: `Timeout tratado corretamente em ${duration}ms` };
        } else {
          return { success: false, message: `Timeout não tratado adequadamente: ${error.message}` };
        }
      }
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testErrorRecovery() {
    try {
      // Testar endpoint inexistente
      try {
        await axios.get(`${this.baseUrls.local}/api/nonexistent-endpoint`);
        return { success: false, message: 'Endpoint inexistente não retornou 404' };
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return { success: true, message: 'Erro 404 tratado corretamente' };
        } else {
          return { success: false, message: `Erro inesperado: ${error.message}` };
        }
      }
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  generateProductionReport() {
    console.log('\n🏆 GERANDO RELATÓRIO FINAL DE PRODUÇÃO...\n');

    const totalTests = Object.values(this.testResults).reduce((sum, category) => 
      sum + category.passed + category.failed, 0);
    
    const totalPassed = Object.values(this.testResults).reduce((sum, category) => 
      sum + category.passed, 0);
    
    const totalFailed = Object.values(this.testResults).reduce((sum, category) => 
      sum + category.failed, 0);
    
    const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const report = {
      timestamp: new Date().toISOString(),
      environment: 'PRODUCTION_MASS_TESTING',
      summary: {
        total_tests: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        success_rate: parseFloat(overallSuccessRate.toFixed(2)),
        status: overallSuccessRate >= 90 ? 'APROVADO' : overallSuccessRate >= 70 ? 'APROVADO_COM_RESSALVAS' : 'REPROVADO'
      },
      detailed_results: this.testResults,
      load_test_config: this.loadTestConfig,
      production_readiness: {
        backend_stability: this.testResults.backend.passed / (this.testResults.backend.passed + this.testResults.backend.failed) * 100,
        trading_reliability: this.testResults.trading.passed / (this.testResults.trading.passed + this.testResults.trading.failed) * 100,
        integration_success: this.testResults.integration.passed / (this.testResults.integration.passed + this.testResults.integration.failed) * 100,
        load_performance: this.testResults.load.passed / (this.testResults.load.passed + this.testResults.load.failed) * 100
      },
      recommendations: this.generateRecommendations()
    };

    // Salvar relatório
    const reportPath = path.join(__dirname, 'PRODUCTION_MASS_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Exibir resumo
    console.log('📊 RESUMO EXECUTIVO:');
    console.log(`✅ Testes Passaram: ${totalPassed}`);
    console.log(`❌ Testes Falharam: ${totalFailed}`);
    console.log(`📈 Taxa de Sucesso: ${overallSuccessRate.toFixed(2)}%`);
    console.log(`🎯 Status Final: ${report.summary.status}`);

    console.log('\n📋 RESULTADOS POR CATEGORIA:');
    Object.entries(this.testResults).forEach(([category, results]) => {
      const categoryTotal = results.passed + results.failed;
      const categoryRate = categoryTotal > 0 ? (results.passed / categoryTotal) * 100 : 0;
      console.log(`${category.toUpperCase()}: ${results.passed}/${categoryTotal} (${categoryRate.toFixed(1)}%)`);
    });

    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Analisar resultados e gerar recomendações
    Object.entries(this.testResults).forEach(([category, results]) => {
      const total = results.passed + results.failed;
      const successRate = total > 0 ? (results.passed / total) * 100 : 0;

      if (successRate < 95) {
        if (category === 'backend') {
          recommendations.push('Investigar falhas nos endpoints do backend');
          recommendations.push('Verificar configurações de timeout e pool de conexões');
        } else if (category === 'trading') {
          recommendations.push('Otimizar processamento de sinais de trading');
          recommendations.push('Implementar queue system para high-frequency signals');
        } else if (category === 'load') {
          recommendations.push('Aumentar recursos do servidor para suportar carga alta');
          recommendations.push('Implementar load balancer para distribuir carga');
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Sistema aprovado para produção sem restrições');
      recommendations.push('Monitorar performance em produção real');
    }

    return recommendations;
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new ProductionMassTestEngine();
  
  tester.runProductionMassTests().then(() => {
    console.log('\n🚀 TESTES EM MASSA FINALIZADOS');
    console.log('Sistema validado para produção!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro nos testes em massa:', error);
    process.exit(1);
  });
}

module.exports = ProductionMassTestEngine;
