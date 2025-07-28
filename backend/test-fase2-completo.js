/**
 * 🧪 TESTE COMPLETO DAS APIs - SISTEMA DE CRÉDITO TESTE
 * Fase 2: Validação e Testes Completos
 * Data: 27/07/2025
 * Versão: 2.0.0
 */

const axios = require('axios');
const fs = require('fs').promises;

class AdminCreditAPITester {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
    this.adminToken = 'admin-emergency-token';
    this.testResults = [];
    this.startTime = Date.now();
    this.testUser = null; // Será preenchido durante os testes
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

  // 🚀 Executar todos os testes em sequência
  async runAllTests() {
    console.log('🧪 INICIANDO TESTES COMPLETOS - FASE 2');
    console.log(`📡 URL Base: ${this.baseURL}`);
    console.log(`🔑 Token Admin: ${this.adminToken}`);
    console.log('=' * 60);
    
    try {
      // Testes básicos de conectividade
      await this.testServerHealth();
      await this.testEndpointsList();
      
      // Testes das APIs de crédito
      await this.testStatsEndpoint();
      await this.testUserSearchEndpoint();
      await this.testListCreditsEndpoint();
      await this.testGrantCreditValidations();
      await this.testEligibilityEndpoint();
      
      // Testes de segurança
      await this.testUnauthorizedAccess();
      await this.testRateLimiting();
      
      // Testes de performance
      await this.testPerformance();
      
      // Relatório final
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro fatal durante os testes:', error);
      this.log('Fatal Error', false, error.message);
    }
  }

  // 🔍 Teste 1: Health Check do servidor
  async testServerHealth() {
    console.log('\n🔍 1. TESTANDO CONECTIVIDADE DO SERVIDOR...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      
      if (response.status === 200 && response.data.status === 'OK') {
        this.log('Server Health', true, `Servidor respondendo normalmente - ${response.data.uptime || 'N/A'}`);
      } else {
        this.log('Server Health', false, `Resposta inesperada: ${response.status}`);
      }
    } catch (error) {
      this.log('Server Health', false, `Servidor não responde: ${error.message}`);
    }
  }

  // 📋 Teste 2: Lista de endpoints
  async testEndpointsList() {
    console.log('\n📋 2. VERIFICANDO LISTA DE ENDPOINTS...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/test/endpoints`);
      
      const hasTestCreditsAdmin = response.data.available_endpoints?.test_credits_admin;
      const hasTestCreditsUser = response.data.available_endpoints?.test_credits_user;
      
      if (hasTestCreditsAdmin && hasTestCreditsUser) {
        this.log('Endpoints List', true, 
          `✅ Endpoints de crédito encontrados - Admin: ${hasTestCreditsAdmin.length}, User: ${hasTestCreditsUser.length}`);
      } else {
        this.log('Endpoints List', false, 'Endpoints de crédito não encontrados na lista');
      }
    } catch (error) {
      this.log('Endpoints List', false, error.message);
    }
  }

  // 📊 Teste 3: Estatísticas
  async testStatsEndpoint() {
    console.log('\n📊 3. TESTANDO ENDPOINT DE ESTATÍSTICAS...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/admin/test-credits/stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        const stats = response.data.stats;
        this.log('Stats Endpoint', true, 
          `Total: ${stats.total_credits_granted?.count || 0} créditos, Taxa uso: ${stats.usage_stats?.usage_rate || 0}%`);
      } else {
        this.log('Stats Endpoint', false, `Resposta inválida: ${response.status}`);
      }
    } catch (error) {
      this.log('Stats Endpoint', false, `Erro: ${error.response?.data?.error || error.message}`);
    }
  }

  // 👥 Teste 4: Busca de usuários
  async testUserSearchEndpoint() {
    console.log('\n👥 4. TESTANDO BUSCA DE USUÁRIOS...');
    
    try {
      // Teste com query muito curta (deve retornar vazio)
      let response = await axios.get(`${this.baseURL}/api/admin/users/search?q=a`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.data.users && response.data.users.length === 0) {
        this.log('User Search Short', true, 'Query curta retornou lista vazia (correto)');
      } else {
        this.log('User Search Short', false, 'Query curta deveria retornar lista vazia');
      }
      
      // Teste com query válida
      response = await axios.get(`${this.baseURL}/api/admin/users/search?q=test&limit=5`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.status === 200 && Array.isArray(response.data.users)) {
        this.log('User Search Valid', true, `Encontrados ${response.data.users.length} usuários`);
        
        // Guardar primeiro usuário para testes posteriores
        if (response.data.users.length > 0) {
          this.testUser = response.data.users[0];
          console.log(`   📝 Usuário de teste: ${this.testUser.name} (${this.testUser.email})`);
        }
      } else {
        this.log('User Search Valid', false, 'Formato de resposta inválido');
      }
    } catch (error) {
      this.log('User Search', false, error.message);
    }
  }

  // 📋 Teste 5: Listagem de créditos
  async testListCreditsEndpoint() {
    console.log('\n📋 5. TESTANDO LISTAGEM DE CRÉDITOS...');
    
    try {
      // Teste básico de listagem
      let response = await axios.get(`${this.baseURL}/api/admin/test-credits?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.status === 200 && response.data.success) {
        this.log('Credit List Basic', true, 
          `Página 1: ${response.data.data?.length || 0} registros de ${response.data.pagination?.total_items || 0} total`);
      } else {
        this.log('Credit List Basic', false, 'Resposta inválida da listagem básica');
      }
      
      // Teste com filtros
      response = await axios.get(`${this.baseURL}/api/admin/test-credits?type=admin_grant&status=available`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.status === 200) {
        this.log('Credit List Filtered', true, 'Filtros aplicados com sucesso');
      } else {
        this.log('Credit List Filtered', false, 'Erro ao aplicar filtros');
      }
      
    } catch (error) {
      this.log('Credit List', false, error.message);
    }
  }

  // 🎁 Teste 6: Validações de liberação de crédito
  async testGrantCreditValidations() {
    console.log('\n🎁 6. TESTANDO VALIDAÇÕES DE LIBERAÇÃO...');
    
    const testCases = [
      {
        name: 'Sem user_id',
        data: { amount: 100, currency: 'BRL', notes: 'Teste sem user_id' },
        expectedError: true
      },
      {
        name: 'Sem amount',
        data: { user_id: 'test-id', currency: 'BRL', notes: 'Teste sem amount' },
        expectedError: true
      },
      {
        name: 'Amount negativo',
        data: { user_id: 'test-id', amount: -50, currency: 'BRL', notes: 'Teste amount negativo' },
        expectedError: true
      },
      {
        name: 'Amount muito alto',
        data: { user_id: 'test-id', amount: 2000, currency: 'BRL', notes: 'Teste amount alto' },
        expectedError: true
      },
      {
        name: 'Sem notes',
        data: { user_id: 'test-id', amount: 100, currency: 'BRL' },
        expectedError: true
      },
      {
        name: 'Notes muito curtas',
        data: { user_id: 'test-id', amount: 100, currency: 'BRL', notes: 'abc' },
        expectedError: true
      },
      {
        name: 'Moeda inválida',
        data: { user_id: 'test-id', amount: 100, currency: 'EUR', notes: 'Teste moeda inválida' },
        expectedError: true
      },
      {
        name: 'Usuário inexistente',
        data: { user_id: 'user-que-nao-existe', amount: 100, currency: 'BRL', notes: 'Teste usuário inexistente' },
        expectedError: true
      }
    ];
    
    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${this.baseURL}/api/admin/test-credits/grant`, testCase.data, {
          headers: { 
            'Authorization': `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (testCase.expectedError) {
          this.log(`Grant Validation: ${testCase.name}`, false, 'Deveria ter retornado erro');
        } else {
          this.log(`Grant Validation: ${testCase.name}`, true, 'Sucesso inesperado');
        }
      } catch (error) {
        if (testCase.expectedError && error.response?.status >= 400) {
          this.log(`Grant Validation: ${testCase.name}`, true, `Erro esperado: ${error.response.status}`);
        } else {
          this.log(`Grant Validation: ${testCase.name}`, false, `Erro inesperado: ${error.message}`);
        }
      }
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 🔍 Teste 7: Elegibilidade
  async testEligibilityEndpoint() {
    console.log('\n🔍 7. TESTANDO VERIFICAÇÃO DE ELEGIBILIDADE...');
    
    try {
      // Teste com usuário válido (se disponível)
      const testUserId = this.testUser?.id || 1;
      
      const response = await axios.post(`${this.baseURL}/api/test-credits/check-eligibility`, {
        user_id: testUserId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 200 && typeof response.data.eligible === 'boolean') {
        this.log('Eligibility Check', true, 
          `Usuário ${response.data.eligible ? 'elegível' : 'não elegível'}: ${response.data.reason || 'N/A'}`);
      } else {
        this.log('Eligibility Check', false, 'Formato de resposta inválido');
      }
      
      // Teste sem user_id
      try {
        await axios.post(`${this.baseURL}/api/test-credits/check-eligibility`, {}, {
          headers: { 'Content-Type': 'application/json' }
        });
        this.log('Eligibility Validation', false, 'Deveria rejeitar requisição sem user_id');
      } catch (validationError) {
        if (validationError.response?.status === 400) {
          this.log('Eligibility Validation', true, 'Validação de user_id funcionando');
        } else {
          this.log('Eligibility Validation', false, 'Erro inesperado na validação');
        }
      }
      
    } catch (error) {
      this.log('Eligibility Check', false, error.message);
    }
  }

  // 🔒 Teste 8: Segurança e autorização
  async testUnauthorizedAccess() {
    console.log('\n🔒 8. TESTANDO CONTROLES DE SEGURANÇA...');
    
    const protectedEndpoints = [
      'GET /api/admin/test-credits/stats',
      'GET /api/admin/test-credits',
      'GET /api/admin/users/search?q=test',
      'POST /api/admin/test-credits/grant'
    ];
    
    for (const endpoint of protectedEndpoints) {
      try {
        const [method, path] = endpoint.split(' ');
        const url = `${this.baseURL}${path}`;
        
        // Teste sem token
        const requestWithoutToken = method === 'GET' 
          ? axios.get(url)
          : axios.post(url, {});
        
        await requestWithoutToken;
        this.log(`Security: ${endpoint}`, false, 'Permitiu acesso sem token');
        
      } catch (error) {
        if (error.response?.status === 401) {
          this.log(`Security: ${endpoint}`, true, 'Bloqueou acesso sem token (correto)');
        } else {
          this.log(`Security: ${endpoint}`, false, `Erro inesperado: ${error.response?.status || error.message}`);
        }
      }
      
      // Teste com token inválido
      try {
        const [method, path] = endpoint.split(' ');
        const url = `${this.baseURL}${path}`;
        const headers = { 'Authorization': 'Bearer token-invalido' };
        
        const requestWithBadToken = method === 'GET' 
          ? axios.get(url, { headers })
          : axios.post(url, {}, { headers });
        
        await requestWithBadToken;
        this.log(`Security Bad Token: ${endpoint}`, false, 'Permitiu acesso com token inválido');
        
      } catch (error) {
        if (error.response?.status === 401) {
          this.log(`Security Bad Token: ${endpoint}`, true, 'Bloqueou token inválido (correto)');
        } else {
          this.log(`Security Bad Token: ${endpoint}`, false, `Erro inesperado: ${error.response?.status}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // ⚡ Teste 9: Rate limiting
  async testRateLimiting() {
    console.log('\n⚡ 9. TESTANDO RATE LIMITING...');
    
    try {
      const requests = [];
      const maxRequests = 10; // Fazer várias requests rapidamente
      
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          axios.get(`${this.baseURL}/api/admin/test-credits/stats`, {
            headers: { 'Authorization': `Bearer ${this.adminToken}` },
            timeout: 5000
          }).catch(error => ({ error: true, status: error.response?.status }))
        );
      }
      
      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => !r.error).length;
      const rateLimitedCount = responses.filter(r => r.error && r.status === 429).length;
      
      if (rateLimitedCount > 0) {
        this.log('Rate Limiting', true, `Rate limiting ativo: ${rateLimitedCount}/${maxRequests} requests bloqueadas`);
      } else {
        this.log('Rate Limiting', false, `Nenhuma request bloqueada: ${successCount}/${maxRequests} sucessos`);
      }
      
    } catch (error) {
      this.log('Rate Limiting', false, `Erro no teste: ${error.message}`);
    }
  }

  // 🚀 Teste 10: Performance
  async testPerformance() {
    console.log('\n🚀 10. TESTANDO PERFORMANCE...');
    
    const performanceTests = [
      {
        name: 'Stats Endpoint',
        url: `${this.baseURL}/api/admin/test-credits/stats`,
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      },
      {
        name: 'List Credits',
        url: `${this.baseURL}/api/admin/test-credits?limit=20`,
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      },
      {
        name: 'User Search',
        url: `${this.baseURL}/api/admin/users/search?q=test&limit=10`,
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      }
    ];
    
    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const response = await axios.get(test.url, { headers: test.headers });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (response.status === 200 && duration < 2000) {
          this.log(`Performance: ${test.name}`, true, `Resposta em ${duration}ms (bom)`);
        } else if (duration < 5000) {
          this.log(`Performance: ${test.name}`, true, `Resposta em ${duration}ms (aceitável)`);
        } else {
          this.log(`Performance: ${test.name}`, false, `Muito lento: ${duration}ms`);
        }
      } catch (error) {
        this.log(`Performance: ${test.name}`, false, `Erro: ${error.message}`);
      }
    }
  }

  // 📊 Gerar relatório final
  async generateReport() {
    console.log('\n' + '=' * 60);
    console.log('📊 RELATÓRIO FINAL DOS TESTES - FASE 2');
    console.log('=' * 60);
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`\n📈 RESUMO GERAL:`);
    console.log(`✅ Testes Passou: ${passedTests}`);
    console.log(`❌ Testes Falhou: ${failedTests}`);
    console.log(`📊 Taxa de Sucesso: ${successRate}%`);
    console.log(`⏱️ Tempo Total: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
    
    // Categorizar resultados
    const categories = {
      'Conectividade': ['Server Health', 'Endpoints List'],
      'APIs Admin': ['Stats Endpoint', 'User Search', 'Credit List'],
      'Validações': this.testResults.filter(r => r.test.includes('Validation')).map(r => r.test),
      'Segurança': this.testResults.filter(r => r.test.includes('Security')).map(r => r.test),
      'Performance': this.testResults.filter(r => r.test.includes('Performance')).map(r => r.test)
    };
    
    console.log('\n📋 DETALHES POR CATEGORIA:');
    for (const [category, tests] of Object.entries(categories)) {
      const categoryResults = this.testResults.filter(r => tests.includes(r.test));
      const categoryPassed = categoryResults.filter(r => r.success).length;
      const categoryTotal = categoryResults.length;
      
      if (categoryTotal > 0) {
        const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(0);
        const icon = categoryRate == 100 ? '✅' : categoryRate >= 80 ? '⚠️' : '❌';
        console.log(`${icon} ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
      }
    }
    
    // Listar falhas
    const failures = this.testResults.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      failures.forEach(failure => {
        console.log(`   • ${failure.test}: ${failure.message}`);
      });
    }
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (successRate >= 95) {
      console.log('🎉 Excelente! Sistema está funcionando perfeitamente.');
      console.log('✅ Pronto para integração com frontend.');
    } else if (successRate >= 80) {
      console.log('⚠️ Bom, mas há alguns problemas menores para resolver.');
      console.log('🔧 Revisar testes que falharam antes do deploy.');
    } else {
      console.log('🚨 Atenção! Muitos problemas encontrados.');
      console.log('⛔ NÃO recomendado para produção até correções.');
    }
    
    // Salvar relatório em arquivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: parseFloat(successRate),
        duration: (Date.now() - this.startTime) / 1000
      },
      categories,
      results: this.testResults,
      recommendations: successRate >= 95 ? 'READY' : successRate >= 80 ? 'MINOR_ISSUES' : 'MAJOR_ISSUES'
    };
    
    try {
      await fs.writeFile('test-report-fase2.json', JSON.stringify(reportData, null, 2));
      console.log('\n💾 Relatório detalhado salvo em: test-report-fase2.json');
    } catch (error) {
      console.log('\n⚠️ Erro ao salvar relatório:', error.message);
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new AdminCreditAPITester();
  tester.runAllTests().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = AdminCreditAPITester;
