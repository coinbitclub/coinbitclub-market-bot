/**
 * 🔥 TESTE EXTREMO DE PRODUÇÃO - COINBITCLUB MARKETBOT
 * Simulação de ambiente de produção com carga extrema
 * Versão: 3.0.0 - 28/07/2025
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ExtremeProductionTester {
  constructor() {
    this.baseUrl = 'http://localhost:8080';
    this.webhookToken = 'coinbitclub_webhook_secret_2024';
    
    this.testConfig = {
      // Cenários de stress extremo
      extremeLoad: {
        concurrentUsers: 100,
        requestsPerUser: 50,
        duration: 120000 // 2 minutos
      },
      
      // Cenários de trading intensivo
      tradingStorm: {
        signalsPerSecond: 20,
        totalSignals: 2000,
        pairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT']
      },
      
      // Cenários de resilência
      resilience: {
        maliciousRequests: 100,
        timeoutTests: 50,
        errorRecoveryTests: 30
      }
    };
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: [],
      throughput: 0,
      errors: {},
      startTime: null,
      endTime: null
    };
  }

  async runExtremeTests() {
    console.log('🔥 INICIANDO TESTES EXTREMOS DE PRODUÇÃO\n');
    console.log('⚠️  AVISO: Este teste simula condições extremas de produção');
    console.log('🎯 Configuração do teste:');
    console.log(`   - ${this.testConfig.extremeLoad.concurrentUsers} usuários simultâneos`);
    console.log(`   - ${this.testConfig.tradingStorm.signalsPerSecond} sinais/segundo`);
    console.log(`   - ${this.testConfig.tradingStorm.totalSignals} sinais totais`);
    console.log('');
    
    this.metrics.startTime = Date.now();
    
    try {
      // 1. Teste de aquecimento
      await this.warmupTest();
      
      // 2. Teste de carga extrema
      await this.extremeLoadTest();
      
      // 3. Tempestade de trading
      await this.tradingStormTest();
      
      // 4. Teste de resilência extrema
      await this.extremeResilienceTest();
      
      // 5. Teste de recuperação
      await this.recoveryTest();
      
      this.metrics.endTime = Date.now();
      
      // 6. Relatório final
      this.generateExtremeReport();
      
    } catch (error) {
      console.error('💥 Erro nos testes extremos:', error);
      this.recordError('CRITICAL', error.message);
    }
  }

  async warmupTest() {
    console.log('🔥 FASE 1: AQUECIMENTO DO SISTEMA');
    console.log('   Preparando o sistema para carga extrema...');
    
    // Enviar requests gradualmente crescentes
    for (let batch = 1; batch <= 5; batch++) {
      const batchSize = batch * 10;
      console.log(`   🌡️  Lote ${batch}: ${batchSize} requests simultâneas`);
      
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(this.timedRequest('GET', '/api/health'));
      }
      
      try {
        await Promise.allSettled(promises);
        await this.sleep(1000); // Pausa entre lotes
      } catch (error) {
        console.log(`   ⚠️  Erro no aquecimento lote ${batch}`);
      }
    }
    
    console.log('   ✅ Sistema aquecido\n');
  }

  async extremeLoadTest() {
    console.log('⚡ FASE 2: TESTE DE CARGA EXTREMA');
    console.log(`   Simulando ${this.testConfig.extremeLoad.concurrentUsers} usuários reais...`);
    
    const startTime = Date.now();
    const promises = [];
    
    // Criar usuários virtuais
    for (let user = 0; user < this.testConfig.extremeLoad.concurrentUsers; user++) {
      promises.push(this.simulateRealUser(user));
    }
    
    try {
      const results = await Promise.allSettled(promises);
      
      let totalUserRequests = 0;
      let successfulUserRequests = 0;
      
      results.forEach((result, userIndex) => {
        if (result.status === 'fulfilled') {
          totalUserRequests += result.value.total;
          successfulUserRequests += result.value.success;
        } else {
          console.log(`   ❌ Usuário ${userIndex} falhou completamente`);
          totalUserRequests += this.testConfig.extremeLoad.requestsPerUser;
        }
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const throughput = totalUserRequests / duration;
      
      console.log(`   📊 Resultados da carga extrema:`);
      console.log(`      Duração: ${duration.toFixed(2)}s`);
      console.log(`      Requests: ${successfulUserRequests}/${totalUserRequests}`);
      console.log(`      Taxa: ${((successfulUserRequests/totalUserRequests)*100).toFixed(1)}%`);
      console.log(`      Throughput: ${throughput.toFixed(2)} req/s`);
      
      this.metrics.throughput = Math.max(this.metrics.throughput, throughput);
      
    } catch (error) {
      console.log(`   💥 Falha crítica na carga extrema: ${error.message}`);
      this.recordError('EXTREME_LOAD', error.message);
    }
    
    console.log('');
  }

  async simulateRealUser(userId) {
    let success = 0;
    let total = 0;
    
    // Simular comportamento real de usuário
    const userActions = [
      { method: 'GET', path: '/api/health', weight: 3 },
      { method: 'GET', path: '/api/status', weight: 2 },
      { method: 'GET', path: '/api/auth/thulio-sms-status', weight: 1 },
      { method: 'POST', path: '/api/auth/request-otp', weight: 1, data: { email: `user${userId}@test.com`, phone: '5511999999999' } }
    ];
    
    for (let request = 0; request < this.testConfig.extremeLoad.requestsPerUser; request++) {
      try {
        // Escolher ação baseada no peso
        const action = this.weightedChoice(userActions);
        
        const result = await this.timedRequest(action.method, action.path, action.data);
        total++;
        
        if (result.success) {
          success++;
        }
        
        // Pausa realística entre requests
        await this.sleep(Math.random() * 200 + 50);
        
      } catch (error) {
        total++;
        // Falha silenciosa para não interromper simulação
      }
    }
    
    return { userId, total, success };
  }

  async tradingStormTest() {
    console.log('🌪️  FASE 3: TEMPESTADE DE TRADING');
    console.log(`   Enviando ${this.testConfig.tradingStorm.totalSignals} sinais em alta frequência...`);
    
    const pairs = this.testConfig.tradingStorm.pairs;
    const signalsPerSecond = this.testConfig.tradingStorm.signalsPerSecond;
    const totalSignals = this.testConfig.tradingStorm.totalSignals;
    
    let sentSignals = 0;
    let successfulSignals = 0;
    let failedSignals = 0;
    
    const intervalMs = 1000 / signalsPerSecond;
    
    for (let i = 0; i < totalSignals; i++) {
      try {
        const pair = pairs[i % pairs.length];
        const signal = {
          token: this.webhookToken,
          ticker: pair,
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
          price: this.generateRealisticPrice(pair),
          timestamp: new Date().toISOString(),
          volume: Math.random() * 10 + 1
        };
        
        const result = await this.timedRequest('POST', '/api/webhooks/signal', signal);
        sentSignals++;
        
        if (result.success) {
          successfulSignals++;
        } else {
          failedSignals++;
        }
        
        // Controle de frequência
        if (i % signalsPerSecond === 0) {
          process.stdout.write(`\r   📡 Enviados: ${sentSignals}/${totalSignals} (${successfulSignals} sucessos)`);
          await this.sleep(intervalMs);
        }
        
      } catch (error) {
        sentSignals++;
        failedSignals++;
        this.recordError('TRADING_SIGNAL', error.message);
      }
    }
    
    const successRate = sentSignals > 0 ? (successfulSignals / sentSignals) * 100 : 0;
    
    console.log(`\n   📊 Tempestade de trading:`);
    console.log(`      Sinais enviados: ${sentSignals}`);
    console.log(`      Sucessos: ${successfulSignals} (${successRate.toFixed(1)}%)`);
    console.log(`      Falhas: ${failedSignals}`);
    console.log('');
  }

  async extremeResilienceTest() {
    console.log('🛡️ FASE 4: TESTE DE RESILÊNCIA EXTREMA');
    console.log('   Testando resistência a ataques e condições adversas...');
    
    // Teste 1: Requests maliciosos
    console.log('   🎯 Testando resistência a requests maliciosos...');
    await this.testMaliciousRequests();
    
    // Teste 2: Timeouts extremos
    console.log('   ⏱️  Testando timeouts extremos...');
    await this.testExtremeTimeouts();
    
    // Teste 3: Payload bombing
    console.log('   💣 Testando payload bombing...');
    await this.testPayloadBombing();
    
    // Teste 4: Concurrent chaos
    console.log('   🌀 Testando concurrent chaos...');
    await this.testConcurrentChaos();
    
    console.log('   ✅ Testes de resilência concluídos\n');
  }

  async testMaliciousRequests() {
    const maliciousPayloads = [
      null,
      undefined,
      '',
      'DROP TABLE users;',
      { '../../../../etc/passwd': 'hack' },
      'A'.repeat(10000), // String gigante
      { recursion: { recursion: { recursion: 'deep' } } },
      '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>'
    ];
    
    let blockedCorrectly = 0;
    
    for (const payload of maliciousPayloads) {
      try {
        const result = await this.timedRequest('POST', '/api/auth/login', payload);
        
        // Se retornou erro 4xx, foi bloqueado corretamente
        if (!result.success && result.status >= 400 && result.status < 500) {
          blockedCorrectly++;
        }
        
      } catch (error) {
        // Timeout ou erro de rede também conta como bloqueio
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
          blockedCorrectly++;
        }
      }
    }
    
    const blockRate = (blockedCorrectly / maliciousPayloads.length) * 100;
    console.log(`      Bloqueios: ${blockedCorrectly}/${maliciousPayloads.length} (${blockRate.toFixed(1)}%)`);
  }

  async testExtremeTimeouts() {
    const timeoutTests = [1, 5, 10, 50, 100]; // ms
    let properTimeouts = 0;
    
    for (const timeout of timeoutTests) {
      try {
        const startTime = Date.now();
        await axios.get(`${this.baseUrl}/api/health`, { timeout });
        
        const duration = Date.now() - startTime;
        if (duration > timeout * 2) { // Tolerância de 2x
          // Não deveria ter passado do timeout
        } else {
          properTimeouts++;
        }
        
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          properTimeouts++; // Timeout funcionou
        }
      }
    }
    
    console.log(`      Timeouts: ${properTimeouts}/${timeoutTests.length} funcionando`);
  }

  async testPayloadBombing() {
    const hugePlaylods = [
      { data: 'X'.repeat(1000000) }, // 1MB
      { array: new Array(100000).fill('test') },
      { nested: this.createDeepObject(1000) }
    ];
    
    let defendedAgainst = 0;
    
    for (const payload of hugePlaylods) {
      try {
        const result = await this.timedRequest('POST', '/api/auth/register', payload);
        
        // Deveria rejeitar payloads gigantes
        if (!result.success) {
          defendedAgainst++;
        }
        
      } catch (error) {
        defendedAgainst++; // Erro/timeout é defesa válida
      }
    }
    
    console.log(`      Defesas: ${defendedAgainst}/${hugePlaylods.length} payload bombs bloqueados`);
  }

  async testConcurrentChaos() {
    const chaosRequests = 200;
    const promises = [];
    
    // Criar requests totalmente aleatórios simultâneos
    for (let i = 0; i < chaosRequests; i++) {
      const randomEndpoint = this.getRandomEndpoint();
      promises.push(this.timedRequest(randomEndpoint.method, randomEndpoint.path, randomEndpoint.data));
    }
    
    try {
      const results = await Promise.allSettled(promises);
      const survived = results.filter(r => r.status === 'fulfilled').length;
      const survivalRate = (survived / chaosRequests) * 100;
      
      console.log(`      Sobrevivência: ${survived}/${chaosRequests} (${survivalRate.toFixed(1)}%)`);
      
    } catch (error) {
      console.log(`      Chaos test falhou: ${error.message}`);
    }
  }

  async recoveryTest() {
    console.log('🔄 FASE 5: TESTE DE RECUPERAÇÃO');
    console.log('   Verificando se sistema se recuperou após stress...');
    
    // Aguardar um pouco para sistema se estabilizar
    await this.sleep(2000);
    
    // Fazer 10 requests simples para verificar saúde
    let healthyRequests = 0;
    
    for (let i = 0; i < 10; i++) {
      try {
        const result = await this.timedRequest('GET', '/api/health');
        if (result.success) {
          healthyRequests++;
        }
        await this.sleep(500);
      } catch (error) {
        // Falha na recuperação
      }
    }
    
    const recoveryRate = (healthyRequests / 10) * 100;
    console.log(`   🏥 Recuperação: ${healthyRequests}/10 (${recoveryRate}%)`);
    
    if (recoveryRate >= 80) {
      console.log('   ✅ Sistema se recuperou adequadamente');
    } else {
      console.log('   ⚠️  Sistema pode ter problemas de recuperação');
    }
    
    console.log('');
  }

  async timedRequest(method, path, data = null) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${this.baseUrl}${path}`,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }
      
      const response = await axios(config);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.recordMetrics(responseTime, true, response.status);
      
      return {
        success: response.status >= 200 && response.status < 400,
        status: response.status,
        responseTime,
        data: response.data
      };
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.recordMetrics(responseTime, false, error.response?.status || 0);
      
      return {
        success: false,
        status: error.response?.status || 0,
        responseTime,
        error: error.message
      };
    }
  }

  recordMetrics(responseTime, success, status) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.responseTimes.push(responseTime);
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime);
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
    
    // Calcular média móvel
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.metrics.responseTimes.length;
  }

  recordError(category, message) {
    if (!this.metrics.errors[category]) {
      this.metrics.errors[category] = [];
    }
    this.metrics.errors[category].push(message);
  }

  weightedChoice(choices) {
    const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const choice of choices) {
      random -= choice.weight;
      if (random <= 0) {
        return choice;
      }
    }
    
    return choices[0]; // fallback
  }

  generateRealisticPrice(pair) {
    const basePrices = {
      'BTCUSDT': 50000,
      'ETHUSDT': 3000,
      'ADAUSDT': 0.5,
      'DOTUSDT': 8.5,
      'LINKUSDT': 15.2
    };
    
    const basePrice = basePrices[pair] || 100;
    return basePrice + (Math.random() * basePrice * 0.1 - basePrice * 0.05); // ±5% variação
  }

  createDeepObject(depth) {
    if (depth <= 0) return 'deep';
    return { deeper: this.createDeepObject(depth - 1) };
  }

  getRandomEndpoint() {
    const endpoints = [
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '/api/status' },
      { method: 'GET', path: '/api/nonexistent' },
      { method: 'POST', path: '/api/auth/login', data: { email: 'test@test.com', password: 'test' } },
      { method: 'POST', path: '/api/webhooks/signal', data: { token: this.webhookToken, ticker: 'BTCUSDT', side: 'BUY', price: 50000 } }
    ];
    
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateExtremeReport() {
    console.log('🏆 RELATÓRIO EXTREMO DE PRODUÇÃO\n');
    
    const duration = this.metrics.endTime - this.metrics.startTime;
    const successRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0;
    
    console.log('📊 MÉTRICAS EXTREMAS:');
    console.log(`Total de requests: ${this.metrics.totalRequests}`);
    console.log(`Sucessos: ${this.metrics.successfulRequests}`);
    console.log(`Falhas: ${this.metrics.failedRequests}`);
    console.log(`Taxa de sucesso: ${successRate.toFixed(2)}%`);
    console.log(`Duração total: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Throughput máximo: ${this.metrics.throughput.toFixed(2)} req/s`);
    
    console.log('\n⚡ PERFORMANCE:');
    console.log(`Tempo resposta médio: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Tempo resposta mínimo: ${this.metrics.minResponseTime}ms`);
    console.log(`Tempo resposta máximo: ${this.metrics.maxResponseTime}ms`);
    
    // Percentis
    if (this.metrics.responseTimes.length > 0) {
      const sorted = this.metrics.responseTimes.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      
      console.log(`P50: ${p50}ms | P95: ${p95}ms | P99: ${p99}ms`);
    }
    
    // Status final
    let finalStatus;
    if (successRate >= 95 && this.metrics.averageResponseTime < 500) {
      finalStatus = '🟢 EXTREMAMENTE ROBUSTO - PRODUÇÃO ALTA ESCALA APROVADA';
    } else if (successRate >= 90 && this.metrics.averageResponseTime < 1000) {
      finalStatus = '🟡 ROBUSTO - PRODUÇÃO APROVADA COM MONITORAMENTO';
    } else if (successRate >= 80) {
      finalStatus = '🟠 MODERADAMENTE ROBUSTO - NECESSITA OTIMIZAÇÕES';
    } else {
      finalStatus = '🔴 NÃO ROBUSTO - CRÍTICO PARA PRODUÇÃO';
    }
    
    console.log(`\n🎯 STATUS FINAL: ${finalStatus}`);
    
    // Salvar relatório detalhado
    const report = {
      timestamp: new Date().toISOString(),
      test_type: 'EXTREME_PRODUCTION_TEST',
      configuration: this.testConfig,
      metrics: this.metrics,
      final_status: finalStatus,
      recommendations: this.generateExtremeRecommendations(successRate)
    };
    
    const reportPath = path.join(__dirname, 'EXTREME_PRODUCTION_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Relatório extremo salvo em: ${reportPath}`);
    
    return report;
  }

  generateExtremeRecommendations(successRate) {
    const recommendations = [];
    
    if (successRate >= 95) {
      recommendations.push('🚀 Sistema APROVADO para produção de alta escala');
      recommendations.push('💪 Capaz de lidar com picos extremos de tráfego');
      recommendations.push('🔄 Implementar auto-scaling para otimização de recursos');
    } else if (successRate >= 90) {
      recommendations.push('✅ Sistema APROVADO para produção com monitoramento');
      recommendations.push('📊 Implementar alertas para queda de performance');
      recommendations.push('🔧 Considerar otimizações de cache');
    } else if (successRate >= 80) {
      recommendations.push('⚠️  Sistema necessita melhorias antes de produção alta escala');
      recommendations.push('🔍 Investigar gargalos de performance');
      recommendations.push('💾 Otimizar queries de database');
    } else {
      recommendations.push('❌ Sistema NÃO aprovado para produção');
      recommendations.push('🔄 Revisar completamente a arquitetura');
      recommendations.push('🛠️  Implementar melhorias críticas de performance');
    }
    
    return recommendations;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const tester = new ExtremeProductionTester();
  
  console.log('⚠️  AVISO: Este teste vai submeter o sistema a condições extremas!');
  console.log('🔥 Prosseguindo em 3 segundos...\n');
  
  setTimeout(() => {
    tester.runExtremeTests().then(() => {
      console.log('\n🏁 TESTES EXTREMOS CONCLUÍDOS');
      process.exit(0);
    }).catch(error => {
      console.error('💥 Erro fatal nos testes extremos:', error);
      process.exit(1);
    });
  }, 3000);
}

module.exports = ExtremeProductionTester;
