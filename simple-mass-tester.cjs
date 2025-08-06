/**
 * 🚀 TESTES EM MASSA SIMPLIFICADOS PARA PRODUÇÃO
 * Versão otimizada e robusta para validação em produção
 * Versão: 2.1.0 - 28/07/2025
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SimplifiedProductionTester {
  constructor() {
    this.baseUrl = 'http://localhost:8080';
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    
    this.webhookToken = 'coinbitclub_webhook_secret_2024';
  }

  async runTests() {
    console.log('🚀 INICIANDO TESTES EM MASSA SIMPLIFICADOS\n');
    
    try {
      // 1. Testes básicos de conectividade
      await this.testConnectivity();
      
      // 2. Testes de endpoints críticos
      await this.testCriticalEndpoints();
      
      // 3. Testes de webhook em massa
      await this.testWebhookMass();
      
      // 4. Teste de carga simplificado
      await this.testSimpleLoad();
      
      // 5. Relatório final
      this.generateReport();
      
    } catch (error) {
      console.error('💥 Erro nos testes:', error);
      this.results.errors.push(error.message);
    }
  }

  async testConnectivity() {
    console.log('🔗 Testando conectividade básica...');
    
    try {
      const response = await this.makeRequest('GET', '/api/health');
      if (response.status === 200) {
        console.log('✅ Conectividade: OK');
        this.recordSuccess();
      } else {
        console.log('❌ Conectividade: FALHOU');
        this.recordFailure('Conectividade falhou');
      }
    } catch (error) {
      console.log('❌ Conectividade: ERRO');
      this.recordFailure(`Conectividade erro: ${error.message}`);
    }
  }

  async testCriticalEndpoints() {
    console.log('\n🎯 Testando endpoints críticos...');
    
    const endpoints = [
      { method: 'GET', path: '/api/status', name: 'Status API' },
      { method: 'GET', path: '/api/auth/thulio-sms-status', name: 'SMS Status' },
      { method: 'POST', path: '/api/auth/request-otp', name: 'OTP Request', data: { email: 'test@test.com', phone: '5511999999999' } }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`  🔍 ${endpoint.name}...`);
        const response = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
        
        if (response.status >= 200 && response.status < 400) {
          console.log(`  ✅ ${endpoint.name}: OK`);
          this.recordSuccess();
        } else {
          console.log(`  ❌ ${endpoint.name}: Status ${response.status}`);
          this.recordFailure(`${endpoint.name} retornou status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: ERRO`);
        this.recordFailure(`${endpoint.name}: ${error.message}`);
      }
    }
  }

  async testWebhookMass() {
    console.log('\n📈 Testando webhooks em massa...');
    
    const signalCount = 100;
    let success = 0;
    let failed = 0;

    console.log(`  🎯 Enviando ${signalCount} sinais...`);
    
    for (let i = 0; i < signalCount; i++) {
      try {
        const signal = {
          token: this.webhookToken,
          ticker: 'BTCUSDT',
          side: i % 2 === 0 ? 'BUY' : 'SELL',
          price: 50000 + (i * 10),
          timestamp: new Date().toISOString()
        };

        const response = await this.makeRequest('POST', '/api/webhooks/signal', signal);
        
        if (response.status === 200) {
          success++;
          this.recordSuccess();
        } else {
          failed++;
          this.recordFailure(`Webhook signal ${i} falhou`);
        }
        
        // Pausa pequena para não sobrecarregar
        if (i % 10 === 0) {
          await this.sleep(10);
          process.stdout.write(`\r  📊 Progresso: ${i}/${signalCount} (${success} sucessos, ${failed} falhas)`);
        }
        
      } catch (error) {
        failed++;
        this.recordFailure(`Webhook signal ${i} erro: ${error.message}`);
      }
    }
    
    console.log(`\n  ✅ Webhooks: ${success}/${signalCount} sucessos (${((success/signalCount)*100).toFixed(1)}%)`);
  }

  async testSimpleLoad() {
    console.log('\n⚡ Teste de carga simplificado...');
    
    const concurrent = 20;
    const requestsPerConnection = 10;
    
    console.log(`  🔄 ${concurrent} conexões simultâneas, ${requestsPerConnection} requests cada`);
    
    const promises = [];
    
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.loadTestConnection(i, requestsPerConnection));
    }
    
    try {
      const results = await Promise.allSettled(promises);
      
      let totalRequests = 0;
      let successfulRequests = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalRequests += result.value.total;
          successfulRequests += result.value.success;
        } else {
          console.log(`  ❌ Conexão ${index} falhou`);
          totalRequests += requestsPerConnection;
        }
      });
      
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      console.log(`  ✅ Carga: ${successfulRequests}/${totalRequests} (${successRate.toFixed(1)}% sucesso)`);
      
      this.results.passed += successfulRequests;
      this.results.failed += (totalRequests - successfulRequests);
      this.results.total += totalRequests;
      
    } catch (error) {
      console.log(`  ❌ Erro no teste de carga: ${error.message}`);
      this.recordFailure(`Teste de carga: ${error.message}`);
    }
  }

  async loadTestConnection(connectionId, requests) {
    let success = 0;
    let total = 0;
    
    for (let i = 0; i < requests; i++) {
      try {
        const response = await this.makeRequest('GET', '/api/health');
        total++;
        
        if (response.status === 200) {
          success++;
        }
        
        await this.sleep(Math.random() * 50); // Pausa aleatória
        
      } catch (error) {
        total++;
        // Falha silenciosa para teste de carga
      }
    }
    
    return { connectionId, total, success };
  }

  async makeRequest(method, path, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${path}`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    
    return await axios(config);
  }

  recordSuccess() {
    this.results.total++;
    this.results.passed++;
  }

  recordFailure(error) {
    this.results.total++;
    this.results.failed++;
    this.results.errors.push(error);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    console.log('\n🏆 RELATÓRIO FINAL DOS TESTES EM MASSA\n');
    
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0;
    
    console.log('📊 RESUMO EXECUTIVO:');
    console.log(`Total de testes: ${this.results.total}`);
    console.log(`Sucessos: ${this.results.passed}`);
    console.log(`Falhas: ${this.results.failed}`);
    console.log(`Taxa de sucesso: ${successRate.toFixed(2)}%`);
    
    let status;
    if (successRate >= 95) {
      status = '🟢 EXCELENTE - APROVADO PARA PRODUÇÃO';
    } else if (successRate >= 85) {
      status = '🟡 BOM - APROVADO COM MONITORAMENTO';
    } else if (successRate >= 70) {
      status = '🟠 REGULAR - NECESSITA MELHORIAS';
    } else {
      status = '🔴 CRÍTICO - NÃO APROVADO PARA PRODUÇÃO';
    }
    
    console.log(`Status: ${status}\n`);
    
    if (this.results.errors.length > 0) {
      console.log('❌ PRINCIPAIS ERROS:');
      const uniqueErrors = [...new Set(this.results.errors)];
      uniqueErrors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      if (uniqueErrors.length > 10) {
        console.log(`... e mais ${uniqueErrors.length - 10} erros`);
      }
    }
    
    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        success_rate: parseFloat(successRate.toFixed(2)),
        status: status
      },
      errors: this.results.errors,
      recommendations: this.generateRecommendations(successRate)
    };
    
    const reportPath = path.join(__dirname, 'SIMPLE_MASS_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
    
    return report;
  }

  generateRecommendations(successRate) {
    const recommendations = [];
    
    if (successRate >= 95) {
      recommendations.push('Sistema aprovado para produção sem restrições');
      recommendations.push('Implementar monitoramento contínuo em produção');
    } else if (successRate >= 85) {
      recommendations.push('Sistema aprovado com monitoramento intensivo');
      recommendations.push('Investigar erros ocasionais');
    } else if (successRate >= 70) {
      recommendations.push('Otimizar endpoints com maior taxa de falha');
      recommendations.push('Revisar configurações de timeout');
    } else {
      recommendations.push('CRÍTICO: Revisar toda a arquitetura do sistema');
      recommendations.push('Não deploy em produção até correções');
    }
    
    return recommendations;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const tester = new SimplifiedProductionTester();
  
  tester.runTests().then(() => {
    console.log('\n✅ TESTES EM MASSA CONCLUÍDOS');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = SimplifiedProductionTester;
