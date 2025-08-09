/**
 * 🔍 AUDITORIA AUTOMÁTICA COMPLETA - COINBITCLUB MARKETBOT
 * Sistema de homologação abrangente com validação completa
 * Versão: 3.0.0 - 28/07/2025
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SystemAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: 'PENDING',
      tests_passed: 0,
      tests_failed: 0,
      critical_issues: [],
      warnings: [],
      success_rate: 0,
      detailed_results: {}
    };
    
    this.config = {
      backend_url: 'http://localhost:3000',
      frontend_url: 'http://localhost:3002',
      timeout: 10000,
      test_credentials: {
        email: 'faleconosco@coinbitclub.vip',
        password: 'password',
        admin_email: 'admin@coinbitclub.vip',
        admin_password: 'admin123'
      }
    };
  }

  async runCompleteAudit() {
    console.log('🔍 INICIANDO AUDITORIA COMPLETA DO SISTEMA...\n');
    
    try {
      // FASE 1: Conectividade Básica
      console.log('📡 FASE 1: TESTE DE CONECTIVIDADE');
      await this.testConnectivity();
      
      // FASE 2: Autenticação e Autorização
      console.log('\n🔐 FASE 2: SISTEMA DE AUTENTICAÇÃO');
      await this.testAuthentication();
      
      // FASE 3: Endpoints Críticos
      console.log('\n🎯 FASE 3: ENDPOINTS CRÍTICOS');
      await this.testCriticalEndpoints();
      
      // FASE 4: Integração Frontend/Backend
      console.log('\n🔗 FASE 4: INTEGRAÇÃO FRONTEND/BACKEND');
      await this.testFrontendIntegration();
      
      // FASE 5: Funcionalidades de Trading
      console.log('\n📈 FASE 5: SISTEMA DE TRADING');
      await this.testTradingSystem();
      
      // FASE 6: Segurança e Performance
      console.log('\n🛡️ FASE 6: SEGURANÇA E PERFORMANCE');
      await this.testSecurityAndPerformance();
      
      // FASE 7: IA e Monitoramento
      console.log('\n🤖 FASE 7: IA E MONITORAMENTO');
      await this.testAIMonitoring();
      
      // FASE 8: Painel Administrativo
      console.log('\n👤 FASE 8: PAINEL ADMINISTRATIVO');
      await this.testAdminPanel();
      
      // Calcular resultados finais
      this.calculateFinalResults();
      
      // Gerar relatório
      await this.generateReport();
      
      console.log('\n✅ AUDITORIA COMPLETA FINALIZADA!');
      console.log(`📊 Taxa de Sucesso: ${this.results.success_rate}%`);
      console.log(`✅ Testes Aprovados: ${this.results.tests_passed}`);
      console.log(`❌ Testes Falharam: ${this.results.tests_failed}`);
      
      return this.results;
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NA AUDITORIA:', error);
      this.results.overall_status = 'CRITICAL_ERROR';
      this.results.critical_issues.push(`Erro fatal: ${error.message}`);
      return this.results;
    }
  }

  async testConnectivity() {
    const tests = [
      { name: 'Backend API Gateway', url: `${this.config.backend_url}/api/auth/thulio-sms-status` },
      { name: 'Frontend Application', url: `${this.config.frontend_url}` },
      { name: 'Health Check', url: `${this.config.backend_url}/health` },
      { name: 'API Documentation', url: `${this.config.backend_url}/docs` }
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await axios.get(test.url, { timeout: this.config.timeout });
        const responseTime = Date.now() - startTime;
        
        if (response.status === 200) {
          console.log(`✅ ${test.name}: OK (${responseTime}ms)`);
          this.results.tests_passed++;
          this.results.detailed_results[test.name] = {
            status: 'PASS',
            response_time: responseTime,
            details: 'Conectado com sucesso'
          };
        } else {
          throw new Error(`Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: FALHA (${error.message})`);
        this.results.tests_failed++;
        this.results.critical_issues.push(`${test.name}: ${error.message}`);
        this.results.detailed_results[test.name] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }
  }

  async testAuthentication() {
    const authTests = [
      {
        name: 'Login Usuário Normal',
        endpoint: '/api/auth/login',
        payload: {
          email: this.config.test_credentials.email,
          password: this.config.test_credentials.password
        }
      },
      {
        name: 'Login Administrador',
        endpoint: '/api/auth/login',
        payload: {
          email: this.config.test_credentials.admin_email,
          password: this.config.test_credentials.admin_password
        }
      },
      {
        name: 'Solicitação OTP',
        endpoint: '/api/auth/request-otp',
        payload: {
          email: this.config.test_credentials.email
        }
      },
      {
        name: 'Verificação OTP',
        endpoint: '/api/auth/verify-otp',
        payload: {
          email: this.config.test_credentials.email,
          otp: '123456'
        }
      }
    ];

    for (const test of authTests) {
      try {
        const startTime = Date.now();
        const response = await axios.post(
          `${this.config.backend_url}${test.endpoint}`,
          test.payload,
          { timeout: this.config.timeout }
        );
        const responseTime = Date.now() - startTime;
        
        if (response.status === 200 && response.data.success !== false) {
          console.log(`✅ ${test.name}: OK (${responseTime}ms)`);
          this.results.tests_passed++;
          this.results.detailed_results[test.name] = {
            status: 'PASS',
            response_time: responseTime,
            token_received: !!response.data.token,
            user_data: !!response.data.user
          };
        } else {
          throw new Error(response.data.message || 'Falha na autenticação');
        }
      } catch (error) {
        console.log(`❌ ${test.name}: FALHA (${error.message})`);
        this.results.tests_failed++;
        this.results.critical_issues.push(`Autenticação ${test.name}: ${error.message}`);
        this.results.detailed_results[test.name] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }
  }

  async testCriticalEndpoints() {
    // Primeiro fazer login para obter token
    let authToken = null;
    try {
      const loginResponse = await axios.post(`${this.config.backend_url}/api/auth/login`, {
        email: this.config.test_credentials.email,
        password: this.config.test_credentials.password
      });
      authToken = loginResponse.data.token;
    } catch (error) {
      console.log('⚠️ Não foi possível obter token de autenticação');
    }

    const endpoints = [
      { name: 'Dashboard Usuário', method: 'GET', url: '/api/user/dashboard', requiresAuth: true },
      { name: 'Operações Usuário', method: 'GET', url: '/api/user/operations', requiresAuth: true },
      { name: 'Planos Disponíveis', method: 'GET', url: '/api/user/plans', requiresAuth: true },
      { name: 'Configurações Usuário', method: 'GET', url: '/api/user/settings', requiresAuth: true },
      { name: 'Dashboard Afiliado', method: 'GET', url: '/api/affiliate/dashboard', requiresAuth: true },
      { name: 'Webhook TradingView', method: 'POST', url: '/api/webhook/tradingview', requiresAuth: false },
      { name: 'Status Sistema', method: 'GET', url: '/api/system/status', requiresAuth: false }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = { timeout: this.config.timeout };
        if (endpoint.requiresAuth && authToken) {
          config.headers = { Authorization: `Bearer ${authToken}` };
        }

        const startTime = Date.now();
        let response;
        
        if (endpoint.method === 'GET') {
          response = await axios.get(`${this.config.backend_url}${endpoint.url}`, config);
        } else {
          response = await axios.post(`${this.config.backend_url}${endpoint.url}`, {}, config);
        }
        
        const responseTime = Date.now() - startTime;
        
        if (response.status === 200) {
          console.log(`✅ ${endpoint.name}: OK (${responseTime}ms)`);
          this.results.tests_passed++;
          this.results.detailed_results[endpoint.name] = {
            status: 'PASS',
            response_time: responseTime,
            authenticated: endpoint.requiresAuth
          };
        } else {
          throw new Error(`Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: FALHA (${error.message})`);
        this.results.tests_failed++;
        
        // Não considerar como crítico se for erro de "ainda não implementado"
        if (error.message.includes('ainda não implementad') || error.response?.status === 501) {
          this.results.warnings.push(`${endpoint.name}: Não implementado`);
        } else {
          this.results.critical_issues.push(`${endpoint.name}: ${error.message}`);
        }
        
        this.results.detailed_results[endpoint.name] = {
          status: 'FAIL',
          error: error.message,
          critical: !error.message.includes('ainda não implementad')
        };
      }
    }
  }

  async testFrontendIntegration() {
    const frontendTests = [
      { name: 'Página de Login', path: '/auth/login' },
      { name: 'Página de Cadastro', path: '/auth/register' },
      { name: 'Dashboard Principal', path: '/dashboard' },
      { name: 'Página Admin', path: '/admin/dashboard' },
      { name: 'Página de Teste', path: '/simple-test' }
    ];

    for (const test of frontendTests) {
      try {
        const startTime = Date.now();
        const response = await axios.get(
          `${this.config.frontend_url}${test.path}`,
          { timeout: this.config.timeout }
        );
        const responseTime = Date.now() - startTime;
        
        if (response.status === 200) {
          console.log(`✅ ${test.name}: OK (${responseTime}ms)`);
          this.results.tests_passed++;
          this.results.detailed_results[test.name] = {
            status: 'PASS',
            response_time: responseTime,
            content_length: response.data.length
          };
        } else {
          throw new Error(`Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: FALHA (${error.message})`);
        this.results.tests_failed++;
        this.results.critical_issues.push(`Frontend ${test.name}: ${error.message}`);
        this.results.detailed_results[test.name] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }
  }

  async testTradingSystem() {
    console.log('🔄 Testando sistema de trading...');
    
    // Simular webhook TradingView
    try {
      const webhookPayload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 65000,
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(
        `${this.config.backend_url}/api/webhook/tradingview`,
        webhookPayload,
        { timeout: this.config.timeout }
      );
      
      if (response.status === 200) {
        console.log('✅ Webhook TradingView: OK');
        this.results.tests_passed++;
      } else {
        throw new Error('Webhook não processado');
      }
    } catch (error) {
      console.log(`❌ Webhook TradingView: FALHA (${error.message})`);
      this.results.tests_failed++;
      this.results.critical_issues.push(`Trading System: ${error.message}`);
    }
  }

  async testSecurityAndPerformance() {
    console.log('🛡️ Testando segurança e performance...');
    
    // Teste de rate limiting
    try {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(axios.get(`${this.config.backend_url}/api/auth/thulio-sms-status`));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        console.log('✅ Rate Limiting: ATIVO');
        this.results.tests_passed++;
      } else {
        console.log('⚠️ Rate Limiting: NÃO DETECTADO');
        this.results.warnings.push('Rate limiting pode não estar configurado');
      }
    } catch (error) {
      console.log('❌ Teste de Rate Limiting falhou');
      this.results.tests_failed++;
    }
  }

  async testAIMonitoring() {
    console.log('🤖 Testando IA de monitoramento...');
    
    try {
      const response = await axios.get(`${this.config.backend_url}/api/ai/admin/readings`);
      
      if (response.status === 200) {
        console.log('✅ IA Monitoramento: OK');
        this.results.tests_passed++;
      } else {
        throw new Error('IA não acessível');
      }
    } catch (error) {
      console.log(`❌ IA Monitoramento: FALHA (${error.message})`);
      this.results.tests_failed++;
      this.results.warnings.push(`IA Monitoring: ${error.message}`);
    }
  }

  async testAdminPanel() {
    console.log('👤 Testando painel administrativo...');
    
    // Login como admin
    try {
      const loginResponse = await axios.post(`${this.config.backend_url}/api/auth/login`, {
        email: this.config.test_credentials.admin_email,
        password: this.config.test_credentials.admin_password
      });
      
      const adminToken = loginResponse.data.token;
      
      // Testar endpoints admin
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/system/health',
        '/api/admin/financial/dashboard'
      ];
      
      for (const endpoint of adminEndpoints) {
        try {
          const response = await axios.get(`${this.config.backend_url}${endpoint}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          
          if (response.status === 200) {
            console.log(`✅ Admin ${endpoint}: OK`);
            this.results.tests_passed++;
          } else {
            throw new Error(`Status ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Admin ${endpoint}: FALHA`);
          this.results.tests_failed++;
          this.results.warnings.push(`Admin endpoint ${endpoint}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Login admin falhou - não é possível testar painel');
      this.results.critical_issues.push('Admin login não funcional');
    }
  }

  calculateFinalResults() {
    const totalTests = this.results.tests_passed + this.results.tests_failed;
    this.results.success_rate = totalTests > 0 ? Math.round((this.results.tests_passed / totalTests) * 100) : 0;
    
    if (this.results.success_rate >= 90 && this.results.critical_issues.length === 0) {
      this.results.overall_status = 'APPROVED';
    } else if (this.results.success_rate >= 70) {
      this.results.overall_status = 'CONDITIONAL_APPROVAL';
    } else {
      this.results.overall_status = 'REJECTED';
    }
  }

  async generateReport() {
    const report = {
      title: '🔍 RELATÓRIO DE HOMOLOGAÇÃO COMPLETA - COINBITCLUB MARKETBOT',
      timestamp: this.results.timestamp,
      overall_status: this.results.overall_status,
      summary: {
        tests_total: this.results.tests_passed + this.results.tests_failed,
        tests_passed: this.results.tests_passed,
        tests_failed: this.results.tests_failed,
        success_rate: this.results.success_rate,
        critical_issues_count: this.results.critical_issues.length,
        warnings_count: this.results.warnings.length
      },
      critical_issues: this.results.critical_issues,
      warnings: this.results.warnings,
      detailed_results: this.results.detailed_results,
      recommendations: this.generateRecommendations(),
      certification: this.generateCertification()
    };

    const reportPath = path.join(__dirname, 'RELATORIO_HOMOLOGACAO_COMPLETA.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.critical_issues.length > 0) {
      recommendations.push('🚨 CRÍTICO: Resolver todos os problemas críticos antes do deploy em produção');
    }
    
    if (this.results.success_rate < 90) {
      recommendations.push('⚠️ Taxa de sucesso abaixo de 90% - revisar implementação');
    }
    
    if (this.results.warnings.length > 5) {
      recommendations.push('📝 Muitos warnings - considerar correções adicionais');
    }
    
    return recommendations;
  }

  generateCertification() {
    if (this.results.overall_status === 'APPROVED') {
      return {
        status: '✅ SISTEMA APROVADO PARA PRODUÇÃO',
        certificate_id: `CBC-${Date.now()}`,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auditor: 'IA de Homologação Automática v3.0'
      };
    } else {
      return {
        status: '❌ SISTEMA NÃO APROVADO',
        issues_to_resolve: this.results.critical_issues.length,
        next_audit: 'Após correção dos problemas críticos'
      };
    }
  }
}

// Executar auditoria se chamado diretamente
if (require.main === module) {
  const auditor = new SystemAuditor();
  auditor.runCompleteAudit().then(results => {
    console.log('\n🎯 AUDITORIA FINALIZADA');
    console.log('Status:', results.overall_status);
    process.exit(results.overall_status === 'APPROVED' ? 0 : 1);
  }).catch(error => {
    console.error('💥 Erro fatal na auditoria:', error);
    process.exit(1);
  });
}

module.exports = SystemAuditor;
