#!/usr/bin/env node
/**
 * 🧪 TESTE COMPLETO DE INTEGRAÇÃO FRONTEND-BACKEND
 * Validação TOTAL de todas as páginas e funcionalidades
 * Data: 28/07/2025
 * Fase 2 - Dia 12: Análise Final Completa
 */

const axios = require('axios');
const fs = require('fs').promises;

class CompleteIntegrationTester {
  constructor() {
    this.frontendURL = 'http://localhost:3001';
    this.backendURL = 'http://localhost:3000';
    this.adminToken = 'admin-emergency-token';
    this.userToken = 'test-valid-token';
    this.testResults = {
      pages: [],
      apis: [],
      integrations: [],
      errors: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  // 📝 Sistema de logging avançado
  log(category, testName, success, message, data = null, severity = 'INFO') {
    const result = {
      category,
      test: testName,
      success,
      message,
      data,
      severity,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime
    };
    
    this.testResults[category].push(result);
    
    const icon = success ? '✅' : '❌';
    const severityIcon = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : '📋';
    
    console.log(`${icon} ${severityIcon} [${category.toUpperCase()}] ${testName}: ${message}`);
    
    if (!success) {
      this.testResults.errors.push(result);
    }
    
    if (data && process.env.DEBUG === 'true') {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
  }

  // 🚀 Executar todos os testes de integração
  async runCompleteTests() {
    console.log('🧪 INICIANDO TESTES COMPLETOS DE INTEGRAÇÃO');
    console.log(`📱 Frontend: ${this.frontendURL}`);
    console.log(`🔗 Backend: ${this.backendURL}`);
    console.log('=' * 80);
    
    try {
      // 1. Testes de conectividade básica
      await this.testBasicConnectivity();
      
      // 2. Testes das páginas principais
      await this.testMainPages();
      
      // 3. Testes das páginas administrativas
      await this.testAdminPages();
      
      // 4. Testes das páginas de usuário
      await this.testUserPages();
      
      // 5. Testes das páginas de afiliados
      await this.testAffiliatePages();
      
      // 6. Testes de autenticação
      await this.testAuthenticationFlow();
      
      // 7. Testes das APIs backend
      await this.testBackendAPIs();
      
      // 8. Testes de integração frontend-backend
      await this.testFrontendBackendIntegration();
      
      // 9. Testes de funcionalidades específicas
      await this.testSpecificFeatures();
      
      // 10. Testes de estresse e performance
      await this.testStressAndPerformance();
      
      // Relatório final
      await this.generateCompleteReport();
      
    } catch (error) {
      console.error('❌ Erro fatal durante os testes:', error);
      this.log('errors', 'Fatal Error', false, error.message, null, 'CRITICAL');
    }
  }

  // 🔍 Teste 1: Conectividade Básica
  async testBasicConnectivity() {
    console.log('\n🔍 1. TESTANDO CONECTIVIDADE BÁSICA...');
    
    // Frontend
    try {
      const frontendResponse = await axios.get(this.frontendURL, { timeout: 5000 });
      if (frontendResponse.status === 200) {
        this.log('pages', 'Frontend Connectivity', true, `Frontend respondendo (${frontendResponse.status})`);
      } else {
        this.log('pages', 'Frontend Connectivity', false, `Status inesperado: ${frontendResponse.status}`, null, 'HIGH');
      }
    } catch (error) {
      this.log('pages', 'Frontend Connectivity', false, `Frontend não responde: ${error.message}`, null, 'CRITICAL');
    }
    
    // Backend
    try {
      const backendResponse = await axios.get(`${this.backendURL}/health`, { timeout: 5000 });
      if (backendResponse.status === 200 && backendResponse.data.status === 'OK') {
        this.log('apis', 'Backend Connectivity', true, `Backend respondendo - Uptime: ${backendResponse.data.uptime || 'N/A'}s`);
      } else {
        this.log('apis', 'Backend Connectivity', false, `Resposta inesperada: ${backendResponse.status}`, null, 'HIGH');
      }
    } catch (error) {
      this.log('apis', 'Backend Connectivity', false, `Backend não responde: ${error.message}`, null, 'CRITICAL');
    }
  }

  // 📄 Teste 2: Páginas Principais
  async testMainPages() {
    console.log('\n📄 2. TESTANDO PÁGINAS PRINCIPAIS...');
    
    const mainPages = [
      { path: '/', name: 'Homepage' },
      { path: '/login', name: 'Login Page' },
      { path: '/signup', name: 'Signup Page' },
      { path: '/dashboard', name: 'Main Dashboard' },
      { path: '/privacy', name: 'Privacy Policy' },
      { path: '/coupons', name: 'Coupons Page' }
    ];
    
    for (const page of mainPages) {
      try {
        const response = await axios.get(`${this.frontendURL}${page.path}`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500 // Accept 404, but not 500+
        });
        
        if (response.status === 200) {
          this.log('pages', page.name, true, `Página carregou com sucesso (${response.status})`);
        } else if (response.status === 404) {
          this.log('pages', page.name, false, `Página não encontrada (404)`, null, 'HIGH');
        } else {
          this.log('pages', page.name, false, `Status inesperado: ${response.status}`, null, 'HIGH');
        }
      } catch (error) {
        this.log('pages', page.name, false, `Erro ao carregar: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // 👨‍💼 Teste 3: Páginas Administrativas
  async testAdminPages() {
    console.log('\n👨‍💼 3. TESTANDO PÁGINAS ADMINISTRATIVAS...');
    
    const adminPages = [
      { path: '/admin/dashboard', name: 'Admin Dashboard' },
      { path: '/admin/dashboard-complete', name: 'Admin Dashboard Complete' },
      { path: '/admin/dashboard-executive', name: 'Admin Dashboard Executive' },
      { path: '/admin/dashboard-integrated', name: 'Admin Dashboard Integrated' },
      { path: '/admin/users', name: 'Admin Users Management' },
      { path: '/admin/users-new', name: 'Admin Users New' },
      { path: '/admin/affiliates', name: 'Admin Affiliates Management' },
      { path: '/admin/affiliates-new', name: 'Admin Affiliates New' },
      { path: '/admin/operations', name: 'Admin Operations' },
      { path: '/admin/operations-new', name: 'Admin Operations New' },
      { path: '/admin/accounting', name: 'Admin Accounting' },
      { path: '/admin/accounting-new', name: 'Admin Accounting New' },
      { path: '/admin/adjustments', name: 'Admin Adjustments' },
      { path: '/admin/adjustments-new', name: 'Admin Adjustments New' },
      { path: '/admin/alerts', name: 'Admin Alerts' },
      { path: '/admin/alerts-new', name: 'Admin Alerts New' },
      { path: '/admin/settings', name: 'Admin Settings' },
      { path: '/admin/credits-management', name: 'Admin Credits Management' },
      { path: '/admin/integration-report', name: 'Admin Integration Report' },
      { path: '/admin/test-dashboard', name: 'Admin Test Dashboard' }
    ];
    
    for (const page of adminPages) {
      try {
        const response = await axios.get(`${this.frontendURL}${page.path}`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          this.log('pages', page.name, true, `Página admin carregou (${response.status})`);
        } else if (response.status === 404) {
          this.log('pages', page.name, false, `Página admin não encontrada (404)`, null, 'HIGH');
        } else if (response.status === 401 || response.status === 403) {
          this.log('pages', page.name, true, `Página protegida corretamente (${response.status})`);
        } else {
          this.log('pages', page.name, false, `Status inesperado: ${response.status}`, null, 'HIGH');
        }
      } catch (error) {
        this.log('pages', page.name, false, `Erro ao carregar página admin: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // 👤 Teste 4: Páginas de Usuário
  async testUserPages() {
    console.log('\n👤 4. TESTANDO PÁGINAS DE USUÁRIO...');
    
    const userPages = [
      { path: '/user/dashboard', name: 'User Dashboard' },
      { path: '/user/dashboard-complete', name: 'User Dashboard Complete' },
      { path: '/user/dashboard-integrated', name: 'User Dashboard Integrated' },
      { path: '/user/operations', name: 'User Operations' },
      { path: '/user/operations-complete', name: 'User Operations Complete' },
      { path: '/user/settings', name: 'User Settings' },
      { path: '/user/settings-complete', name: 'User Settings Complete' },
      { path: '/user/plans', name: 'User Plans' },
      { path: '/user/plans_new', name: 'User Plans New' },
      { path: '/user/pricing', name: 'User Pricing' },
      { path: '/user/subscription', name: 'User Subscription' },
      { path: '/user/test-plans', name: 'User Test Plans' }
    ];
    
    for (const page of userPages) {
      try {
        const response = await axios.get(`${this.frontendURL}${page.path}`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          this.log('pages', page.name, true, `Página usuário carregou (${response.status})`);
        } else if (response.status === 404) {
          this.log('pages', page.name, false, `Página usuário não encontrada (404)`, null, 'HIGH');
        } else if (response.status === 401 || response.status === 403) {
          this.log('pages', page.name, true, `Página protegida corretamente (${response.status})`);
        } else {
          this.log('pages', page.name, false, `Status inesperado: ${response.status}`, null, 'HIGH');
        }
      } catch (error) {
        this.log('pages', page.name, false, `Erro ao carregar página usuário: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // 🤝 Teste 5: Páginas de Afiliados
  async testAffiliatePages() {
    console.log('\n🤝 5. TESTANDO PÁGINAS DE AFILIADOS...');
    
    const affiliatePages = [
      { path: '/affiliate/dashboard', name: 'Affiliate Dashboard' },
      { path: '/affiliate/dashboard-complete', name: 'Affiliate Dashboard Complete' },
      { path: '/affiliate/dashboard-integrated', name: 'Affiliate Dashboard Integrated' },
      { path: '/affiliate/commissions', name: 'Affiliate Commissions' },
      { path: '/affiliate/referrals-complete', name: 'Affiliate Referrals Complete' }
    ];
    
    for (const page of affiliatePages) {
      try {
        const response = await axios.get(`${this.frontendURL}${page.path}`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          this.log('pages', page.name, true, `Página afiliado carregou (${response.status})`);
        } else if (response.status === 404) {
          this.log('pages', page.name, false, `Página afiliado não encontrada (404)`, null, 'HIGH');
        } else if (response.status === 401 || response.status === 403) {
          this.log('pages', page.name, true, `Página protegida corretamente (${response.status})`);
        } else {
          this.log('pages', page.name, false, `Status inesperado: ${response.status}`, null, 'HIGH');
        }
      } catch (error) {
        this.log('pages', page.name, false, `Erro ao carregar página afiliado: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // 🔐 Teste 6: Fluxo de Autenticação
  async testAuthenticationFlow() {
    console.log('\n🔐 6. TESTANDO FLUXO DE AUTENTICAÇÃO...');
    
    // Teste de login
    try {
      const loginResponse = await axios.post(`${this.backendURL}/auth/login`, {
        email: 'test@coinbitclub.com',
        password: 'password123'
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        this.log('integrations', 'Login Flow', true, `Login funcionando - Token: ${loginResponse.data.token ? 'Presente' : 'Ausente'}`);
      } else {
        this.log('integrations', 'Login Flow', false, `Login com problemas: ${loginResponse.status}`, null, 'HIGH');
      }
    } catch (error) {
      this.log('integrations', 'Login Flow', false, `Erro no login: ${error.message}`, null, 'HIGH');
    }
    
    // Teste de registro
    try {
      const registerResponse = await axios.post(`${this.backendURL}/auth/register`, {
        email: 'newuser@coinbitclub.com',
        password: 'password123',
        whatsappNumber: '+5511999887766'
      });
      
      if (registerResponse.status === 200 && registerResponse.data.success) {
        this.log('integrations', 'Register Flow', true, `Registro funcionando`);
      } else {
        this.log('integrations', 'Register Flow', false, `Registro com problemas: ${registerResponse.status}`, null, 'HIGH');
      }
    } catch (error) {
      this.log('integrations', 'Register Flow', false, `Erro no registro: ${error.message}`, null, 'HIGH');
    }
    
    // Teste de reset de senha
    try {
      const resetResponse = await axios.post(`${this.backendURL}/auth/forgot-password`, {
        email: 'test@coinbitclub.com'
      });
      
      if (resetResponse.status === 200 && resetResponse.data.success) {
        this.log('integrations', 'Password Reset Flow', true, `Reset de senha funcionando`);
      } else {
        this.log('integrations', 'Password Reset Flow', false, `Reset com problemas: ${resetResponse.status}`, null, 'HIGH');
      }
    } catch (error) {
      this.log('integrations', 'Password Reset Flow', false, `Erro no reset: ${error.message}`, null, 'HIGH');
    }
  }

  // 🔗 Teste 7: APIs Backend
  async testBackendAPIs() {
    console.log('\n🔗 7. TESTANDO APIs BACKEND...');
    
    const apiEndpoints = [
      // APIs Admin
      { method: 'GET', path: '/api/dashboard/admin', name: 'Admin Dashboard API', requiresAuth: true },
      { method: 'GET', path: '/api/admin/users', name: 'Admin Users API', requiresAuth: true },
      { method: 'GET', path: '/api/admin/affiliates', name: 'Admin Affiliates API', requiresAuth: true },
      { method: 'GET', path: '/api/admin/financial-summary', name: 'Admin Financial API', requiresAuth: true },
      { method: 'GET', path: '/api/admin/whatsapp-stats', name: 'Admin WhatsApp API', requiresAuth: true },
      
      // APIs User
      { method: 'GET', path: '/api/dashboard/user', name: 'User Dashboard API', requiresAuth: true },
      { method: 'GET', path: '/api/user/profile', name: 'User Profile API', requiresAuth: true },
      { method: 'GET', path: '/api/financial/balance', name: 'User Balance API', requiresAuth: true },
      { method: 'GET', path: '/api/operations', name: 'User Operations API', requiresAuth: true },
      
      // APIs Affiliate
      { method: 'GET', path: '/api/dashboard/affiliate', name: 'Affiliate Dashboard API', requiresAuth: true },
      { method: 'GET', path: '/api/affiliate/dashboard', name: 'Affiliate Data API', requiresAuth: true },
      { method: 'GET', path: '/api/affiliate/commission-history', name: 'Affiliate Commissions API', requiresAuth: true },
      
      // APIs Public
      { method: 'GET', path: '/api/health', name: 'Health Check API', requiresAuth: false },
      { method: 'GET', path: '/api/status', name: 'Status API', requiresAuth: false },
      { method: 'GET', path: '/api/test/database', name: 'Database Test API', requiresAuth: false }
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const config = {
          timeout: 10000,
          validateStatus: (status) => status < 500
        };
        
        if (endpoint.requiresAuth) {
          config.headers = { 'Authorization': `Bearer ${this.adminToken}` };
        }
        
        const response = await axios[endpoint.method.toLowerCase()](`${this.backendURL}${endpoint.path}`, config);
        
        if (response.status === 200) {
          this.log('apis', endpoint.name, true, `API funcionando (${response.status})`);
        } else if (response.status === 401 && endpoint.requiresAuth) {
          this.log('apis', endpoint.name, true, `API protegida corretamente (401)`);
        } else {
          this.log('apis', endpoint.name, false, `Status inesperado: ${response.status}`, null, 'HIGH');
        }
      } catch (error) {
        this.log('apis', endpoint.name, false, `Erro na API: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // 🔄 Teste 8: Integração Frontend-Backend
  async testFrontendBackendIntegration() {
    console.log('\n🔄 8. TESTANDO INTEGRAÇÃO FRONTEND-BACKEND...');
    
    // Verificar se variáveis de ambiente estão configuradas
    try {
      // Simular chamada de integração
      const integrationTests = [
        { name: 'API Connection', test: () => this.testAPIConnection() },
        { name: 'Data Flow', test: () => this.testDataFlow() },
        { name: 'Error Handling', test: () => this.testErrorHandling() },
        { name: 'Authentication Integration', test: () => this.testAuthIntegration() }
      ];
      
      for (const integrationTest of integrationTests) {
        try {
          await integrationTest.test();
          this.log('integrations', integrationTest.name, true, `Integração funcionando`);
        } catch (error) {
          this.log('integrations', integrationTest.name, false, `Integração falhou: ${error.message}`, null, 'HIGH');
        }
      }
    } catch (error) {
      this.log('integrations', 'Frontend-Backend Integration', false, `Erro geral: ${error.message}`, null, 'CRITICAL');
    }
  }

  // Métodos auxiliares para testes de integração
  async testAPIConnection() {
    const response = await axios.get(`${this.backendURL}/api/status`);
    if (response.status !== 200) throw new Error('API não responde');
  }

  async testDataFlow() {
    const response = await axios.get(`${this.backendURL}/api/dashboard/user`, {
      headers: { 'Authorization': `Bearer ${this.userToken}` }
    });
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Dados não fluem corretamente');
    }
  }

  async testErrorHandling() {
    try {
      await axios.get(`${this.backendURL}/api/nonexistent-endpoint`);
      throw new Error('Deveria retornar erro 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return; // Erro esperado
      }
      throw error;
    }
  }

  async testAuthIntegration() {
    // Testar endpoint protegido sem token
    try {
      await axios.get(`${this.backendURL}/api/admin/users`);
      throw new Error('Deveria bloquear acesso sem token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return; // Comportamento esperado
      }
      throw error;
    }
  }

  // 🎯 Teste 9: Funcionalidades Específicas
  async testSpecificFeatures() {
    console.log('\n🎯 9. TESTANDO FUNCIONALIDADES ESPECÍFICAS...');
    
    const features = [
      { name: 'WhatsApp Integration', test: () => this.testWhatsAppFeature() },
      { name: 'Payment Processing', test: () => this.testPaymentFeature() },
      { name: 'Notifications System', test: () => this.testNotificationsFeature() },
      { name: 'Trading Signals', test: () => this.testTradingSignalsFeature() },
      { name: 'Credits System', test: () => this.testCreditsSystemFeature() }
    ];
    
    for (const feature of features) {
      try {
        await feature.test();
        this.log('integrations', feature.name, true, `Funcionalidade operacional`);
      } catch (error) {
        this.log('integrations', feature.name, false, `Funcionalidade falhou: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // Métodos auxiliares para funcionalidades específicas
  async testWhatsAppFeature() {
    const response = await axios.get(`${this.backendURL}/api/whatsapp/status`, {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });
    if (response.status !== 200) throw new Error('WhatsApp integration failed');
  }

  async testPaymentFeature() {
    const response = await axios.get(`${this.backendURL}/api/payments/methods`, {
      headers: { 'Authorization': `Bearer ${this.userToken}` }
    });
    if (response.status !== 200) throw new Error('Payment system failed');
  }

  async testNotificationsFeature() {
    const response = await axios.get(`${this.backendURL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${this.userToken}` }
    });
    if (response.status !== 200) throw new Error('Notifications system failed');
  }

  async testTradingSignalsFeature() {
    const response = await axios.get(`${this.backendURL}/api/trading/signals`, {
      headers: { 'Authorization': `Bearer ${this.userToken}` }
    });
    if (response.status !== 200) throw new Error('Trading signals failed');
  }

  async testCreditsSystemFeature() {
    const response = await axios.get(`${this.backendURL}/api/admin/test-credits/stats`, {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });
    if (response.status !== 200) throw new Error('Credits system failed');
  }

  // ⚡ Teste 10: Estresse e Performance
  async testStressAndPerformance() {
    console.log('\n⚡ 10. TESTANDO ESTRESSE E PERFORMANCE...');
    
    // Teste de carga nas APIs
    const loadTests = [
      { endpoint: '/api/health', concurrent: 50, name: 'Health Check Load' },
      { endpoint: '/api/status', concurrent: 30, name: 'Status API Load' },
      { endpoint: '/api/dashboard/user', concurrent: 20, name: 'Dashboard Load', requiresAuth: true }
    ];
    
    for (const loadTest of loadTests) {
      try {
        const startTime = Date.now();
        const promises = [];
        
        for (let i = 0; i < loadTest.concurrent; i++) {
          const config = { timeout: 15000 };
          if (loadTest.requiresAuth) {
            config.headers = { 'Authorization': `Bearer ${this.userToken}` };
          }
          
          promises.push(
            axios.get(`${this.backendURL}${loadTest.endpoint}`, config)
              .catch(error => ({ error: error.message }))
          );
        }
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const successCount = results.filter(r => !r.error).length;
        const duration = endTime - startTime;
        
        if (successCount >= loadTest.concurrent * 0.8) { // 80% success rate
          this.log('integrations', loadTest.name, true, 
            `Load test passed: ${successCount}/${loadTest.concurrent} requests in ${duration}ms`);
        } else {
          this.log('integrations', loadTest.name, false, 
            `Load test failed: ${successCount}/${loadTest.concurrent} requests`, null, 'HIGH');
        }
      } catch (error) {
        this.log('integrations', loadTest.name, false, `Load test error: ${error.message}`, null, 'HIGH');
      }
    }
  }

  // 📊 Gerar relatório completo
  async generateCompleteReport() {
    console.log('\n📊 GERANDO RELATÓRIO COMPLETO...');
    
    const totalTests = this.testResults.pages.length + this.testResults.apis.length + this.testResults.integrations.length;
    const passedTests = (this.testResults.pages.filter(t => t.success).length + 
                        this.testResults.apis.filter(t => t.success).length + 
                        this.testResults.integrations.filter(t => t.success).length);
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    this.testResults.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      duration: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      categories: {
        pages: {
          total: this.testResults.pages.length,
          passed: this.testResults.pages.filter(t => t.success).length,
          rate: this.testResults.pages.length > 0 ? 
            ((this.testResults.pages.filter(t => t.success).length / this.testResults.pages.length) * 100).toFixed(1) : 0
        },
        apis: {
          total: this.testResults.apis.length,
          passed: this.testResults.apis.filter(t => t.success).length,
          rate: this.testResults.apis.length > 0 ? 
            ((this.testResults.apis.filter(t => t.success).length / this.testResults.apis.length) * 100).toFixed(1) : 0
        },
        integrations: {
          total: this.testResults.integrations.length,
          passed: this.testResults.integrations.filter(t => t.success).length,
          rate: this.testResults.integrations.length > 0 ? 
            ((this.testResults.integrations.filter(t => t.success).length / this.testResults.integrations.length) * 100).toFixed(1) : 0
        }
      }
    };
    
    console.log('\n' + '=' * 80);
    console.log('📊 RELATÓRIO FINAL - INTEGRAÇÃO COMPLETA');
    console.log('=' * 80);
    console.log(`📈 RESUMO GERAL:`);
    console.log(`✅ Testes Aprovados: ${passedTests}`);
    console.log(`❌ Testes Reprovados: ${failedTests}`);
    console.log(`📊 Taxa de Sucesso: ${successRate}%`);
    console.log(`⏱️ Tempo Total: ${(this.testResults.summary.duration / 1000).toFixed(1)}s`);
    
    console.log(`\n📋 DETALHES POR CATEGORIA:`);
    console.log(`📄 Páginas: ${this.testResults.summary.categories.pages.passed}/${this.testResults.summary.categories.pages.total} (${this.testResults.summary.categories.pages.rate}%)`);
    console.log(`🔗 APIs: ${this.testResults.summary.categories.apis.passed}/${this.testResults.summary.categories.apis.total} (${this.testResults.summary.categories.apis.rate}%)`);
    console.log(`🔄 Integrações: ${this.testResults.summary.categories.integrations.passed}/${this.testResults.summary.categories.integrations.total} (${this.testResults.summary.categories.integrations.rate}%)`);
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n❌ ERROS CRÍTICOS ENCONTRADOS:`);
      this.testResults.errors.forEach(error => {
        const severity = error.severity === 'CRITICAL' ? '🚨' : error.severity === 'HIGH' ? '⚠️' : '📋';
        console.log(`   ${severity} ${error.test}: ${error.message}`);
      });
    }
    
    // Recomendações
    console.log(`\n💡 RECOMENDAÇÕES:`);
    if (successRate >= 95) {
      console.log('🎉 Excelente! Sistema pronto para produção.');
    } else if (successRate >= 85) {
      console.log('⚠️ Bom, mas recomenda-se corrigir erros críticos antes do deploy.');
    } else if (successRate >= 70) {
      console.log('🚨 Atenção! Muitos problemas encontrados. Revisão necessária.');
    } else {
      console.log('⛔ Sistema não recomendado para produção. Revisão completa necessária.');
    }
    
    // Salvar relatório
    try {
      await fs.writeFile('complete-integration-report.json', JSON.stringify(this.testResults, null, 2));
      console.log(`💾 Relatório completo salvo em: complete-integration-report.json`);
    } catch (error) {
      console.log(`❌ Erro ao salvar relatório: ${error.message}`);
    }
  }
}

// Executar testes
if (require.main === module) {
  const tester = new CompleteIntegrationTester();
  tester.runCompleteTests().catch(console.error);
}

module.exports = CompleteIntegrationTester;
