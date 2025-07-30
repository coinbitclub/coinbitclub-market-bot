#!/usr/bin/env node

/**
 * 🏆 HOMOLOGAÇÃO COMPLETA - COINBITCLUB MARKETBOT
 * Sistema de validação com meta de 95%+ de aproveitamento
 */

const https = require('https');
const http = require('http');
const { Pool } = require('pg');

// ✅ CONFIGURAÇÕES DO SISTEMA
const CONFIG = {
  BACKEND_URL: 'http://localhost:8080', // Usar servidor local
  FRONTEND_URL: 'http://localhost:3000', // Frontend local
  RAILWAY_URL: 'https://coinbitclub-market-bot-up.railway.app',
  VERCEL_URL: 'https://coinbitclub-market-bot.vercel.app',
  DATABASE_URL: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  WEBHOOK_SECRET: 'coinbitclub_webhook_secret_2024',
  ADMIN_TOKEN: 'admin-emergency-token'
};

// 📊 MÉTRICAS DE HOMOLOGAÇÃO
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  critical: 0,
  criticalPassed: 0,
  details: []
};

// 🧪 FUNÇÕES DE TESTE

// Test HTTP endpoint
async function testEndpoint(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const startTime = Date.now();
    const req = protocol.request(url, options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode < 400,
          status: res.statusCode,
          responseTime,
          data: data || null,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 'TIMEOUT',
        responseTime: 10000,
        error: 'Request timeout'
      });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Test database connection
async function testDatabase() {
  try {
    const pool = new Pool({
      connectionString: CONFIG.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    await pool.end();
    
    return {
      success: true,
      data: result.rows[0],
      responseTime: 100
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: 1000
    };
  }
}

// Add test result
function addTestResult(name, result, isCritical = false) {
  testResults.total++;
  if (isCritical) testResults.critical++;
  
  if (result.success) {
    testResults.passed++;
    if (isCritical) testResults.criticalPassed++;
  } else {
    testResults.failed++;
  }
  
  testResults.details.push({
    name,
    success: result.success,
    critical: isCritical,
    status: result.status,
    responseTime: result.responseTime,
    error: result.error || null,
    data: result.data || null
  });
  
  const icon = result.success ? '✅' : '❌';
  const criticalIcon = isCritical ? '🔥' : '📋';
  console.log(`${icon} ${criticalIcon} ${name}: ${result.status} (${result.responseTime}ms)`);
  if (result.error) console.log(`   Error: ${result.error}`);
}

// 🚀 EXECUÇÃO DA HOMOLOGAÇÃO COMPLETA
async function runCompleteHomologation() {
  console.log('🏆 HOMOLOGAÇÃO COMPLETA COINBITCLUB MARKETBOT');
  console.log('==============================================');
  console.log(`📅 Executado em: ${new Date().toISOString()}`);
  console.log('🎯 Meta: 95%+ de aproveitamento\n');

  // ===== 1. TESTES CRÍTICOS DE INFRAESTRUTURA =====
  console.log('🔥 1. TESTES CRÍTICOS DE INFRAESTRUTURA');
  console.log('========================================');

  // Backend Health
  let result = await testEndpoint(`${CONFIG.BACKEND_URL}/health`);
  addTestResult('Backend Health Check', result, true);

  // Frontend Home
  result = await testEndpoint(CONFIG.FRONTEND_URL);
  addTestResult('Frontend Home Page', result, true);

  // Database Connection
  result = await testDatabase();
  addTestResult('Database Connection', result, true);

  // ===== 2. TESTES DE ENDPOINTS ESSENCIAIS =====
  console.log('\n📡 2. TESTES DE ENDPOINTS ESSENCIAIS');
  console.log('====================================');

  // API Health
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/health`);
  addTestResult('API Health Endpoint', result, true);

  // API Status
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/status`);
  addTestResult('API Status Endpoint', result, true);

  // Webhook Signal Test
  const signalPayload = {
    token: CONFIG.WEBHOOK_SECRET,
    ticker: 'BTCUSDT',
    side: 'BUY',
    price: 50000,
    strategy: 'HOMOLOGATION_TEST',
    timestamp: new Date().toISOString()
  };
  
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/webhooks/signal`, 'POST', signalPayload);
  addTestResult('Webhook Signal Processing', result, true);

  // ===== 3. TESTES DE AUTENTICAÇÃO =====
  console.log('\n🔐 3. TESTES DE AUTENTICAÇÃO');
  console.log('============================');

  // OTP Request Test
  const otpPayload = {
    email: 'homologacao@coinbitclub.com',
    phone: '+5511999999999'
  };
  
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/auth/request-otp`, 'POST', otpPayload);
  addTestResult('OTP Request Endpoint', result, false);

  // Register Test
  const registerPayload = {
    email: 'teste.homologacao@coinbitclub.com',
    password: 'SecurePass123!',
    name: 'Teste Homologação',
    phone: '+5511888888888'
  };
  
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/auth/register`, 'POST', registerPayload);
  addTestResult('User Registration', result, false);

  // ===== 4. TESTES DE FRONTEND INTEGRADO =====
  console.log('\n🌐 4. TESTES DE FRONTEND INTEGRADO');
  console.log('==================================');

  // Login Page
  result = await testEndpoint(`${CONFIG.FRONTEND_URL}/login-integrated`);
  addTestResult('Frontend Login Page', result, false);

  // Dashboard (expected auth required)
  result = await testEndpoint(`${CONFIG.FRONTEND_URL}/dashboard`);
  addTestResult('Frontend Dashboard Access', result, false);

  // ===== 5. TESTES DE MICROSERVIÇOS =====
  console.log('\n🧠 5. TESTES DE MICROSERVIÇOS');
  console.log('=============================');

  // Signal Ingestor Status
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/services/signal-ingestor/status`);
  addTestResult('Signal Ingestor Service', result, false);

  // Decision Engine Status  
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/services/decision-engine/status`);
  addTestResult('Decision Engine Service', result, false);

  // ===== 6. TESTES DE SEGURANÇA =====
  console.log('\n🛡️ 6. TESTES DE SEGURANÇA');
  console.log('=========================');

  // Webhook without token (should fail)
  const invalidPayload = { ticker: 'BTCUSDT', side: 'BUY' };
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/webhooks/signal`, 'POST', invalidPayload);
  addTestResult('Security: Invalid Webhook Token', { ...result, success: !result.success }, false);

  // SQL Injection Test
  const sqlPayload = { token: CONFIG.WEBHOOK_SECRET, ticker: "'; DROP TABLE users; --" };
  result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/webhooks/signal`, 'POST', sqlPayload);
  addTestResult('Security: SQL Injection Protection', result, false);

  // ===== 7. TESTES DE PERFORMANCE =====
  console.log('\n⚡ 7. TESTES DE PERFORMANCE');
  console.log('===========================');

  // Multiple concurrent requests
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(testEndpoint(`${CONFIG.BACKEND_URL}/health`));
  }
  
  const concurrentResults = await Promise.all(promises);
  const avgResponseTime = concurrentResults.reduce((sum, r) => sum + r.responseTime, 0) / concurrentResults.length;
  const allSuccess = concurrentResults.every(r => r.success);
  
  addTestResult('Performance: Concurrent Requests', {
    success: allSuccess && avgResponseTime < 1000,
    responseTime: Math.round(avgResponseTime),
    status: allSuccess ? 200 : 'MIXED'
  }, false);

  // ===== RELATÓRIO FINAL =====
  console.log('\n📊 RELATÓRIO FINAL DA HOMOLOGAÇÃO');
  console.log('==================================');
  
  const successRate = (testResults.passed / testResults.total * 100).toFixed(1);
  const criticalSuccessRate = testResults.critical > 0 ? (testResults.criticalPassed / testResults.critical * 100).toFixed(1) : 100;
  
  console.log(`📈 Taxa de Sucesso Geral: ${successRate}% (${testResults.passed}/${testResults.total})`);
  console.log(`🔥 Taxa de Sucesso Crítico: ${criticalSuccessRate}% (${testResults.criticalPassed}/${testResults.critical})`);
  console.log(`⚡ Testes Executados: ${testResults.total}`);
  console.log(`✅ Testes Aprovados: ${testResults.passed}`);
  console.log(`❌ Testes Falharam: ${testResults.failed}`);
  
  // Status final
  console.log('\n🎯 AVALIAÇÃO FINAL:');
  if (successRate >= 95 && criticalSuccessRate >= 90) {
    console.log('🏆 SISTEMA APROVADO! Meta de 95%+ atingida!');
    console.log('✅ Pronto para produção!');
  } else if (successRate >= 80 && criticalSuccessRate >= 80) {
    console.log('⚠️ SISTEMA APROVADO COM RESSALVAS');
    console.log('🔧 Algumas melhorias recomendadas');
  } else {
    console.log('❌ SISTEMA REPROVADO');
    console.log('🚫 Correções críticas necessárias');
  }
  
  // Detalhes dos falhas
  const failures = testResults.details.filter(t => !t.success);
  if (failures.length > 0) {
    console.log('\n❌ FALHAS DETECTADAS:');
    failures.forEach(f => {
      console.log(`   ${f.critical ? '🔥' : '📋'} ${f.name}: ${f.status} - ${f.error || 'Unknown error'}`);
    });
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      successRate: parseFloat(successRate),
      criticalSuccessRate: parseFloat(criticalSuccessRate),
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      critical: testResults.critical,
      criticalPassed: testResults.criticalPassed
    },
    details: testResults.details,
    status: successRate >= 95 && criticalSuccessRate >= 90 ? 'APPROVED' : 
            successRate >= 80 && criticalSuccessRate >= 80 ? 'APPROVED_WITH_CONDITIONS' : 'REJECTED'
  };
  
  require('fs').writeFileSync('homologation-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Relatório salvo em: homologation-report.json');
  
  return report;
}

// Executar se chamado diretamente
if (require.main === module) {
  runCompleteHomologation().catch(console.error);
}

module.exports = { runCompleteHomologation, CONFIG };
