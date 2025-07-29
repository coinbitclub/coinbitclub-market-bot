#!/usr/bin/env node

/**
 * 🧪 TESTE COMPLETO DE INTEGRAÇÃO FRONTEND-BACKEND
 * Verificação minuciosa de todos os dashboards e áreas
 * Data: 28/07/2025
 * Versão: 3.0.0
 */

const axios = require('axios');
const fs = require('fs').promises;

class FrontendBackendTester {
  constructor() {
    this.frontendURL = 'http://localhost:3001';
    this.backendURL = 'http://localhost:3000';
    this.adminToken = 'admin-emergency-token';
    this.testResults = [];
    this.startTime = Date.now();
  }

  // 📝 Sistema de logging avançado
  log(testName, success, message, data = null) {
    const result = {
      test: testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime
    };
    
    this.testResults.push(result);
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${message}`);
    
    if (data && process.env.DEBUG === 'true') {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
  }

  // 🚀 Executar todos os testes de integração
  async runAllTests() {
    /**
 * 🧪 TESTE COMPLETO DE INTEGRAÇÃO E ESTRESSE
 * Teste de todos os serviços, integração backend-frontend e exchanges
 * Atualizado com testes específicos para 2 operações por usuário
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

console.log('🧪 TESTE COMPLETO DE INTEGRAÇÃO E ESTRESSE');
console.log('🔄 ATUALIZADO - 2 OPERAÇÕES POR USUÁRIO');
console.log('==========================================');
    console.log(`🌐 Frontend: ${this.frontendURL}`);
    console.log(`📡 Backend: ${this.backendURL}`);
    console.log(`🔑 Token Admin: ${this.adminToken}`);
    console.log('=' * 80);
    
    try {
      // 1. Testes de conectividade básica
      await this.testBackendConnectivity();
      await this.testFrontendConnectivity();
      
      // 2. Testes de autenticação e APIs
      await this.testAuthenticationAPIs();
      
      // 3. Testes dos dashboards administrativos
      await this.testAdminDashboards();
      
      // 4. Testes dos dashboards de usuários
      await this.testUserDashboards();
      
      // 5. Testes dos dashboards de afiliados
      await this.testAffiliateDashboards();
      
      // 6. Testes de integração completa
      await this.testFullIntegration();
      
      // 7. Testes de estresse
      await this.testStressScenarios();
      
      // Relatório final
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro fatal durante os testes:', error);
      this.log('Fatal Error', false, error.message);
    }
  }

  // 🔗 Teste 1: Conectividade Backend
  async testBackendConnectivity() {
    console.log('\n🔗 1. TESTANDO CONECTIVIDADE BACKEND...');
    
    try {
      const response = await axios.get(`${this.backendURL}/health`, { timeout: 5000 });
      
      if (response.status === 200 && response.data.status === 'OK') {
        this.log('Backend Health', true, `Backend ativo - Uptime: ${response.data.uptime}s`);
      } else {
        this.log('Backend Health', false, `Resposta inesperada: ${response.status}`);
      }
    } catch (error) {
      this.log('Backend Health', false, `Backend não responde: ${error.message}`);
    }
  }

  // 🌐 Teste 2: Conectividade Frontend
  async testFrontendConnectivity() {
    console.log('\n🌐 2. TESTANDO CONECTIVIDADE FRONTEND...');
    
    try {
      const response = await axios.get(this.frontendURL, { timeout: 10000 });
      
      if (response.status === 200) {
        this.log('Frontend Health', true, 'Frontend Next.js respondendo normalmente');
      } else {
        this.log('Frontend Health', false, `Resposta inesperada: ${response.status}`);
      }
    } catch (error) {
      this.log('Frontend Health', false, `Frontend não responde: ${error.message}`);
    }
  }

  // 🔐 Teste 3: APIs de Autenticação
  async testAuthenticationAPIs() {
    console.log('\n🔐 3. TESTANDO APIs DE AUTENTICAÇÃO...');
    
    // Teste registro
    try {
      const registerResponse = await axios.post(`${this.backendURL}/auth/register`, {
        email: 'test@frontend.com',
        password: 'test123456',
        whatsappNumber: '+5511999999999'
      });
      
      if (registerResponse.status === 200 && registerResponse.data.success) {
        this.log('Auth Register', true, 'Registro funcionando corretamente');
      } else {
        this.log('Auth Register', false, 'Registro com problemas');
      }
    } catch (error) {
      this.log('Auth Register', false, `Erro no registro: ${error.message}`);
    }

    // Teste login
    try {
      const loginResponse = await axios.post(`${this.backendURL}/auth/login`, {
        email: 'test@frontend.com',
        password: 'test123456'
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        this.log('Auth Login', true, 'Login funcionando corretamente');
      } else {
        this.log('Auth Login', false, 'Login com problemas');
      }
    } catch (error) {
      this.log('Auth Login', false, `Erro no login: ${error.message}`);
    }
  }

  // 👨‍💼 Teste 4: Dashboards Administrativos
  async testAdminDashboards() {
    console.log('\n👨‍💼 4. TESTANDO DASHBOARDS ADMINISTRATIVOS...');
    
    const adminEndpoints = [
      { name: 'Admin Dashboard Data', url: '/api/dashboard/admin' },
      { name: 'Admin Users List', url: '/api/admin/users' },
      { name: 'Admin Financial Summary', url: '/api/admin/financial-summary' },
      { name: 'Admin WhatsApp Stats', url: '/api/admin/whatsapp-stats' },
      { name: 'Admin System Logs', url: '/api/admin/system-logs' },
      { name: 'Admin DB Status', url: '/api/admin/db-status' },
      { name: 'Admin Affiliates', url: '/api/admin/affiliates' },
      { name: 'Admin Trading Signals', url: '/api/admin/trading-signals' }
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await axios.get(`${this.backendURL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });
        
        if (response.status === 200 && response.data) {
          this.log(endpoint.name, true, 'Dados carregados com sucesso');
        } else {
          this.log(endpoint.name, false, 'Resposta inválida');
        }
      } catch (error) {
        this.log(endpoint.name, false, `Erro: ${error.message}`);
      }
    }
  }

  // 👤 Teste 5: Dashboards de Usuários
  async testUserDashboards() {
    console.log('\n👤 5. TESTANDO DASHBOARDS DE USUÁRIOS...');
    
    const userEndpoints = [
      { name: 'User Dashboard Data', url: '/api/dashboard/user' },
      { name: 'User Profile', url: '/api/user/profile' },
      { name: 'User Balance', url: '/api/financial/balance' },
      { name: 'User Transactions', url: '/api/financial/transactions' },
      { name: 'User Operations', url: '/api/operations' },
      { name: 'User Subscription', url: '/api/subscriptions/current' },
      { name: 'User Credentials', url: '/api/credentials' },
      { name: 'User Analytics', url: '/api/analytics/performance' }
    ];

    for (const endpoint of userEndpoints) {
      try {
        const response = await axios.get(`${this.backendURL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });
        
        if (response.status === 200 && response.data) {
          this.log(endpoint.name, true, 'Dados carregados com sucesso');
        } else {
          this.log(endpoint.name, false, 'Resposta inválida');
        }
      } catch (error) {
        this.log(endpoint.name, false, `Erro: ${error.message}`);
      }
    }
  }

  // 🤝 Teste 6: Dashboards de Afiliados
  async testAffiliateDashboards() {
    console.log('\n🤝 6. TESTANDO DASHBOARDS DE AFILIADOS...');
    
    const affiliateEndpoints = [
      { name: 'Affiliate Dashboard Data', url: '/api/dashboard/affiliate' },
      { name: 'Affiliate Commission History', url: '/api/affiliate/commission-history' },
      { name: 'Affiliate Credits', url: '/api/affiliate/credits' },
      { name: 'Affiliate Dashboard Main', url: '/api/affiliate/dashboard' }
    ];

    for (const endpoint of affiliateEndpoints) {
      try {
        const response = await axios.get(`${this.backendURL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });
        
        if (response.status === 200 && response.data) {
          this.log(endpoint.name, true, 'Dados carregados com sucesso');
        } else {
          this.log(endpoint.name, false, 'Resposta inválida');
        }
      } catch (error) {
        this.log(endpoint.name, false, `Erro: ${error.message}`);
      }
    }
  }

  // 🔄 Teste 7: Integração Completa
  async testFullIntegration() {
    console.log('\n🔄 7. TESTANDO INTEGRAÇÃO COMPLETA...');
    
    // Teste fluxo completo: Login -> Dashboard -> Operações
    try {
      // 1. Login
      const loginResponse = await axios.post(`${this.backendURL}/auth/login`, {
        email: 'admin@coinbitclub.com',
        password: 'admin123'
      });
      
      // 2. Buscar dashboard
      const dashboardResponse = await axios.get(`${this.backendURL}/api/dashboard/admin`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      // 3. Buscar operações
      const operationsResponse = await axios.get(`${this.backendURL}/api/operations`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (dashboardResponse.status === 200 && operationsResponse.status === 200) {
        this.log('Full Integration Flow', true, 'Fluxo completo funcionando');
      } else {
        this.log('Full Integration Flow', false, 'Problemas na integração');
      }
    } catch (error) {
      this.log('Full Integration Flow', false, `Erro na integração: ${error.message}`);
    }
  }

  // ⚡ Teste 8: Cenários de Estresse
  async testStressScenarios() {
    console.log('\n⚡ 8. TESTANDO CENÁRIOS DE ESTRESSE...');
    
    // Teste múltiplas requisições simultâneas
    try {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.get(`${this.backendURL}/api/dashboard/admin`, {
            headers: { 'Authorization': `Bearer ${this.adminToken}` }
          })
        );
      }
      
      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.status === 200).length;
      
      if (successCount >= 8) {
        this.log('Stress Test', true, `${successCount}/10 requisições simultâneas bem-sucedidas`);
      } else {
        this.log('Stress Test', false, `Apenas ${successCount}/10 requisições bem-sucedidas`);
      }
    } catch (error) {
      this.log('Stress Test', false, `Erro no teste de estresse: ${error.message}`);
    }
  }

  // 📊 Relatório final
  async generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES DE INTEGRAÇÃO');
    console.log('=' * 80);
    
    const totalTests = this.testResults.length;
    const successTests = this.testResults.filter(t => t.success).length;
    const failedTests = this.testResults.filter(t => !t.success).length;
    const successRate = ((successTests / totalTests) * 100).toFixed(1);
    
    console.log(`📈 RESUMO GERAL:`);
    console.log(`✅ Testes Aprovados: ${successTests}`);
    console.log(`❌ Testes Falharam: ${failedTests}`);
    console.log(`📊 Taxa de Sucesso: ${successRate}%`);
    console.log(`⏱️ Tempo Total: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
    
    console.log(`\n📋 ANÁLISE POR CATEGORIA:`);
    
    const categories = {
      'Conectividade': ['Backend Health', 'Frontend Health'],
      'Autenticação': ['Auth Register', 'Auth Login'],
      'Admin Dashboards': this.testResults.filter(t => t.test.includes('Admin')).map(t => t.test),
      'User Dashboards': this.testResults.filter(t => t.test.includes('User')).map(t => t.test),
      'Affiliate Dashboards': this.testResults.filter(t => t.test.includes('Affiliate')).map(t => t.test),
      'Integração': ['Full Integration Flow'],
      'Performance': ['Stress Test']
    };
    
    for (const [category, tests] of Object.entries(categories)) {
      const categoryTests = this.testResults.filter(t => tests.includes(t.test));
      const categorySuccess = categoryTests.filter(t => t.success).length;
      const categoryTotal = categoryTests.length;
      const categoryRate = categoryTotal > 0 ? ((categorySuccess / categoryTotal) * 100).toFixed(0) : 0;
      
      const status = categoryRate >= 80 ? '✅' : categoryRate >= 50 ? '⚠️' : '❌';
      console.log(`${status} ${category}: ${categorySuccess}/${categoryTotal} (${categoryRate}%)`);
    }
    
    if (failedTests > 0) {
      console.log(`\n❌ TESTES QUE FALHARAM:`);
      this.testResults.filter(t => !t.success).forEach(test => {
        console.log(`   • ${test.test}: ${test.message}`);
      });
    }
    
    console.log(`\n💡 RECOMENDAÇÕES:`);
    if (successRate >= 95) {
      console.log('🎉 Excelente! Sistema está funcionando perfeitamente.');
      console.log('✅ Todos os dashboards estão devidamente integrados.');
      console.log('✅ Pronto para produção.');
    } else if (successRate >= 80) {
      console.log('⚠️ Bom, mas há alguns problemas menores para resolver.');
      console.log('🔧 Revisar testes que falharam antes do deploy.');
    } else {
      console.log('🚨 Atenção! Muitos problemas encontrados.');
      console.log('⛔ NÃO recomendado para produção até correções.');
    }
    
    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        success: successTests,
        failed: failedTests,
        successRate: successRate + '%'
      },
      results: this.testResults,
      categories,
      duration: ((Date.now() - this.startTime) / 1000).toFixed(1) + 's'
    };
    
    await fs.writeFile('integration-test-report.json', JSON.stringify(report, null, 2));
    console.log(`💾 Relatório detalhado salvo em: integration-test-report.json`);
  }
}

// Executar testes
if (require.main === module) {
  const tester = new FrontendBackendTester();
  tester.runAllTests();
}

module.exports = FrontendBackendTester;
