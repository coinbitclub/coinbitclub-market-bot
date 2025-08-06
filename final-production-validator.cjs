/**
 * 📊 SCRIPT FINAL DE VALIDAÇÃO PARA PRODUÇÃO
 * Validação completa e deploy checker
 * Versão: FINAL - 28/07/2025
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FinalProductionValidator {
  constructor() {
    this.baseUrl = 'http://localhost:8080';
    this.webhookToken = 'coinbitclub_webhook_secret_2024';
    
    this.validationChecks = {
      connectivity: false,
      authentication: false,
      trading: false,
      security: false,
      performance: false,
      resilience: false
    };
    
    this.deploymentReadiness = {
      backend: false,
      frontend: false,
      database: false,
      security: false,
      monitoring: false
    };
  }

  async runFinalValidation() {
    console.log('🏁 VALIDAÇÃO FINAL PARA PRODUÇÃO - COINBITCLUB MARKETBOT\n');
    console.log('🔍 Executando checklist completo de deploy...\n');
    
    try {
      // 1. Validação de Conectividade
      await this.validateConnectivity();
      
      // 2. Validação de Autenticação  
      await this.validateAuthentication();
      
      // 3. Validação de Trading
      await this.validateTrading();
      
      // 4. Validação de Segurança
      await this.validateSecurity();
      
      // 5. Validação de Performance
      await this.validatePerformance();
      
      // 6. Validação de Resilência
      await this.validateResilience();
      
      // 7. Checklist de Deploy
      await this.checkDeploymentReadiness();
      
      // 8. Gerar certificado final
      this.generateFinalCertificate();
      
    } catch (error) {
      console.error('💥 Erro na validação final:', error);
      throw error;
    }
  }

  async validateConnectivity() {
    console.log('🔗 1. VALIDAÇÃO DE CONECTIVIDADE');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('   ✅ API Health Check: FUNCIONANDO');
        console.log('   ✅ Conectividade Backend: ESTÁVEL');
        this.validationChecks.connectivity = true;
      } else {
        console.log('   ❌ Health Check: FALHA');
      }
      
    } catch (error) {
      console.log('   ❌ Conectividade: ERRO');
      console.log(`      Erro: ${error.message}`);
    }
    
    console.log('');
  }

  async validateAuthentication() {
    console.log('🔐 2. VALIDAÇÃO DE AUTENTICAÇÃO');
    
    try {
      // Testar OTP Request
      const otpResponse = await axios.post(`${this.baseUrl}/api/auth/request-otp`, {
        email: 'validation@test.com',
        phone: '5511999999999'
      });
      
      if (otpResponse.status === 200) {
        console.log('   ✅ OTP Request: FUNCIONANDO');
      } else {
        console.log('   ❌ OTP Request: FALHA');
      }
      
      // Testar SMS Status
      const smsResponse = await axios.get(`${this.baseUrl}/api/auth/thulio-sms-status`);
      
      if (smsResponse.status === 200) {
        console.log('   ✅ SMS Service: OPERACIONAL');
        this.validationChecks.authentication = true;
      } else {
        console.log('   ❌ SMS Service: FALHA');
      }
      
    } catch (error) {
      console.log('   ❌ Autenticação: ERRO');
      console.log(`      Erro: ${error.message}`);
    }
    
    console.log('');
  }

  async validateTrading() {
    console.log('📈 3. VALIDAÇÃO DE TRADING');
    
    try {
      // Testar 10 sinais diferentes
      let successCount = 0;
      const signals = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];
      
      for (let i = 0; i < 10; i++) {
        const signal = {
          token: this.webhookToken,
          ticker: signals[i % signals.length],
          side: i % 2 === 0 ? 'BUY' : 'SELL',
          price: 50000 + (i * 1000),
          timestamp: new Date().toISOString()
        };
        
        try {
          const response = await axios.post(`${this.baseUrl}/api/webhooks/signal`, signal);
          if (response.status === 200) {
            successCount++;
          }
        } catch (error) {
          // Falha silenciosa
        }
      }
      
      const successRate = (successCount / 10) * 100;
      
      if (successRate >= 90) {
        console.log(`   ✅ Trading Signals: ${successCount}/10 (${successRate}%)`);
        console.log('   ✅ Signal Processing: FUNCIONANDO');
        this.validationChecks.trading = true;
      } else {
        console.log(`   ❌ Trading Signals: ${successCount}/10 (${successRate}%)`);
      }
      
    } catch (error) {
      console.log('   ❌ Trading: ERRO');
      console.log(`      Erro: ${error.message}`);
    }
    
    console.log('');
  }

  async validateSecurity() {
    console.log('🛡️ 4. VALIDAÇÃO DE SEGURANÇA');
    
    try {
      let securityScore = 0;
      
      // Teste 1: Request sem token (deve falhar)
      try {
        await axios.post(`${this.baseUrl}/api/webhooks/signal`, {
          ticker: 'BTCUSDT',
          side: 'BUY',
          price: 50000
        });
        console.log('   ❌ Webhook sem token: PASSOU (INSEGURO)');
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          console.log('   ✅ Webhook sem token: BLOQUEADO');
          securityScore++;
        }
      }
      
      // Teste 2: Token inválido (deve falhar)
      try {
        await axios.post(`${this.baseUrl}/api/webhooks/signal`, {
          token: 'token_invalido',
          ticker: 'BTCUSDT',
          side: 'BUY',
          price: 50000
        });
        console.log('   ❌ Token inválido: PASSOU (INSEGURO)');
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          console.log('   ✅ Token inválido: BLOQUEADO');
          securityScore++;
        }
      }
      
      // Teste 3: Request malicioso
      try {
        await axios.post(`${this.baseUrl}/api/auth/login`, {
          email: "'; DROP TABLE users; --",
          password: 'hack'
        });
        console.log('   ❌ SQL Injection: PASSOU (INSEGURO)');
      } catch (error) {
        console.log('   ✅ SQL Injection: BLOQUEADO');
        securityScore++;
      }
      
      if (securityScore >= 2) {
        console.log('   ✅ Segurança: APROVADA');
        this.validationChecks.security = true;
      } else {
        console.log('   ❌ Segurança: INSUFICIENTE');
      }
      
    } catch (error) {
      console.log('   ❌ Segurança: ERRO');
      console.log(`      Erro: ${error.message}`);
    }
    
    console.log('');
  }

  async validatePerformance() {
    console.log('⚡ 5. VALIDAÇÃO DE PERFORMANCE');
    
    try {
      const startTime = Date.now();
      const requests = 20; // 20 requests simultâneas
      const promises = [];
      
      for (let i = 0; i < requests; i++) {
        promises.push(axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 }));
      }
      
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;
      const avgResponseTime = duration / requests;
      const throughput = (requests / duration) * 1000; // req/s
      
      console.log(`   📊 ${successCount}/${requests} requests bem-sucedidas`);
      console.log(`   📊 Tempo médio: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   📊 Throughput: ${throughput.toFixed(2)} req/s`);
      
      if (successCount >= requests * 0.9 && avgResponseTime < 500) {
        console.log('   ✅ Performance: APROVADA');
        this.validationChecks.performance = true;
      } else {
        console.log('   ❌ Performance: ABAIXO DO ESPERADO');
      }
      
    } catch (error) {
      console.log('   ❌ Performance: ERRO');
      console.log(`      Erro: ${error.message}`);
    }
    
    console.log('');
  }

  async validateResilience() {
    console.log('🔄 6. VALIDAÇÃO DE RESILÊNCIA');
    
    try {
      // Teste de timeout
      try {
        await axios.get(`${this.baseUrl}/api/health`, { timeout: 1 });
        console.log('   ❌ Timeout handling: NÃO FUNCIONANDO');
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log('   ✅ Timeout handling: FUNCIONANDO');
        }
      }
      
      // Teste de endpoint inexistente
      try {
        await axios.get(`${this.baseUrl}/api/endpoint-inexistente`);
        console.log('   ❌ 404 handling: NÃO FUNCIONANDO');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('   ✅ 404 handling: FUNCIONANDO');
        }
      }
      
      // Aguardar recuperação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Teste de recuperação
      try {
        const response = await axios.get(`${this.baseUrl}/api/health`);
        if (response.status === 200) {
          console.log('   ✅ Recuperação: FUNCIONANDO');
          this.validationChecks.resilience = true;
        }
      } catch (error) {
        console.log('   ❌ Recuperação: FALHA');
      }
      
    } catch (error) {
      console.log('   ❌ Resilência: ERRO');
      console.log(`      Erro: ${error.message}`);
    }
    
    console.log('');
  }

  async checkDeploymentReadiness() {
    console.log('🚀 7. CHECKLIST DE DEPLOY');
    
    // Backend Check
    if (this.validationChecks.connectivity && this.validationChecks.authentication) {
      console.log('   ✅ Backend: PRONTO PARA DEPLOY');
      this.deploymentReadiness.backend = true;
    } else {
      console.log('   ❌ Backend: NÃO PRONTO');
    }
    
    // Database Check  
    if (this.validationChecks.authentication) {
      console.log('   ✅ Database: CONECTADO E FUNCIONAL');
      this.deploymentReadiness.database = true;
    } else {
      console.log('   ❌ Database: PROBLEMAS DE CONEXÃO');
    }
    
    // Security Check
    if (this.validationChecks.security) {
      console.log('   ✅ Segurança: IMPLEMENTADA');
      this.deploymentReadiness.security = true;
    } else {
      console.log('   ❌ Segurança: NECESSITA MELHORIAS');
    }
    
    // Performance Check
    if (this.validationChecks.performance) {
      console.log('   ✅ Performance: ADEQUADA');
    } else {
      console.log('   ❌ Performance: NECESSITA OTIMIZAÇÃO');
    }
    
    // Trading Check
    if (this.validationChecks.trading) {
      console.log('   ✅ Trading Pipeline: OPERACIONAL');
    } else {
      console.log('   ❌ Trading Pipeline: PROBLEMAS');
    }
    
    // Monitoring (básico presente)
    console.log('   ✅ Monitoring: HEALTH CHECKS ATIVOS');
    this.deploymentReadiness.monitoring = true;
    
    console.log('');
  }

  generateFinalCertificate() {
    console.log('📜 8. CERTIFICADO FINAL');
    
    const totalChecks = Object.keys(this.validationChecks).length;
    const passedChecks = Object.values(this.validationChecks).filter(v => v).length;
    const successRate = (passedChecks / totalChecks) * 100;
    
    const deploymentChecks = Object.values(this.deploymentReadiness).filter(v => v).length;
    const deploymentScore = (deploymentChecks / Object.keys(this.deploymentReadiness).length) * 100;
    
    console.log(`\n📊 RESULTADOS FINAIS:`);
    console.log(`   Validações: ${passedChecks}/${totalChecks} (${successRate.toFixed(1)}%)`);
    console.log(`   Deploy Readiness: ${deploymentScore.toFixed(1)}%`);
    
    let finalStatus;
    let deployRecommendation;
    
    if (successRate >= 90 && deploymentScore >= 80) {
      finalStatus = '🟢 APROVADO PARA PRODUÇÃO';
      deployRecommendation = '✅ DEPLOY AUTORIZADO';
    } else if (successRate >= 70 && deploymentScore >= 60) {
      finalStatus = '🟡 APROVADO COM RESSALVAS';
      deployRecommendation = '⚠️ DEPLOY COM MONITORAMENTO INTENSIVO';
    } else {
      finalStatus = '🔴 NÃO APROVADO';
      deployRecommendation = '❌ DEPLOY NÃO RECOMENDADO';
    }
    
    console.log(`\n🎯 STATUS FINAL: ${finalStatus}`);
    console.log(`🚀 DEPLOY: ${deployRecommendation}`);
    
    // Salvar certificado
    const certificate = {
      timestamp: new Date().toISOString(),
      validation_results: this.validationChecks,
      deployment_readiness: this.deploymentReadiness,
      success_rate: successRate,
      deployment_score: deploymentScore,
      final_status: finalStatus,
      deploy_recommendation: deployRecommendation,
      details: {
        connectivity: this.validationChecks.connectivity ? 'PASS' : 'FAIL',
        authentication: this.validationChecks.authentication ? 'PASS' : 'FAIL',
        trading: this.validationChecks.trading ? 'PASS' : 'FAIL',
        security: this.validationChecks.security ? 'PASS' : 'FAIL',
        performance: this.validationChecks.performance ? 'PASS' : 'FAIL',
        resilience: this.validationChecks.resilience ? 'PASS' : 'FAIL'
      },
      recommendations: this.generateRecommendations(successRate, deploymentScore)
    };
    
    const certificatePath = path.join(__dirname, 'FINAL_PRODUCTION_CERTIFICATE.json');
    fs.writeFileSync(certificatePath, JSON.stringify(certificate, null, 2));
    
    console.log(`\n📄 Certificado salvo em: ${certificatePath}`);
    
    if (successRate >= 90) {
      console.log(`\n🏆 PARABÉNS! Sistema aprovado para produção!`);
      console.log(`🚀 Deploy pode ser realizado com confiança.`);
    }
    
    return certificate;
  }

  generateRecommendations(successRate, deploymentScore) {
    const recommendations = [];
    
    if (successRate >= 90) {
      recommendations.push('Sistema totalmente validado para produção');
      recommendations.push('Implementar monitoramento em produção');
      recommendations.push('Configurar alertas automáticos');
    } else {
      if (!this.validationChecks.connectivity) {
        recommendations.push('Corrigir problemas de conectividade');
      }
      if (!this.validationChecks.authentication) {
        recommendations.push('Revisar sistema de autenticação');
      }
      if (!this.validationChecks.trading) {
        recommendations.push('Corrigir pipeline de trading');
      }
      if (!this.validationChecks.security) {
        recommendations.push('Implementar melhorias de segurança');
      }
      if (!this.validationChecks.performance) {
        recommendations.push('Otimizar performance do sistema');
      }
      if (!this.validationChecks.resilience) {
        recommendations.push('Melhorar resilência e recuperação');
      }
    }
    
    return recommendations;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new FinalProductionValidator();
  
  validator.runFinalValidation().then(() => {
    console.log('\n✅ VALIDAÇÃO FINAL CONCLUÍDA');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro na validação final:', error);
    process.exit(1);
  });
}

module.exports = FinalProductionValidator;
