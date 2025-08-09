/**
 * 🔧 AUDITORIA SIMPLES - COINBITCLUB MARKETBOT
 * Teste rápido de conectividade e problemas críticos
 */

const https = require('https');
const http = require('http');

async function testEndpoint(url, method = 'GET') {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 10000,
      headers: {
        'User-Agent': 'CoinbitClub-Auditor/1.0'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500) // First 500 chars
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        error: err.message,
        status: 0
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Timeout',
        status: 0
      });
    });

    req.end();
  });
}

async function runSimpleAudit() {
  console.log('🔍 AUDITORIA SIMPLES - COINBITCLUB MARKETBOT');
  console.log('='.repeat(50));
  
  const baseUrl = 'https://coinbitclub-market-bot-production.up.railway.app';
  
  const endpoints = [
    { name: 'Health Check', url: `${baseUrl}/health` },
    { name: 'API Status', url: `${baseUrl}/api/status` },
    { name: 'Login Endpoint', url: `${baseUrl}/api/auth/login` },
    { name: 'Register Endpoint', url: `${baseUrl}/api/auth/register` },
    { name: 'Missing OTP', url: `${baseUrl}/api/auth/request-otp` },
    { name: 'Missing SMS Status', url: `${baseUrl}/api/auth/thulio-sms-status` },
    { name: 'Missing Webhook', url: `${baseUrl}/api/webhooks/signal` },
    { name: 'TradingView Webhook', url: `${baseUrl}/api/webhooks/tradingview` },
    { name: 'User Dashboard', url: `${baseUrl}/api/user/dashboard` },
    { name: 'Admin Stats', url: `${baseUrl}/api/admin/stats` }
  ];

  console.log(`\n📡 Testando ${endpoints.length} endpoints...\n`);

  const results = {
    working: [],
    errors: [],
    missing: []
  };

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testando: ${endpoint.name}`);
      const result = await testEndpoint(endpoint.url);
      
      if (result.error) {
        console.log(`   ❌ ERRO: ${result.error}`);
        results.errors.push({ name: endpoint.name, error: result.error });
      } else if (result.status === 404) {
        console.log(`   🔴 404 NOT FOUND`);
        results.missing.push({ name: endpoint.name, status: 404 });
      } else if (result.status >= 200 && result.status < 500) {
        console.log(`   ✅ Status: ${result.status}`);
        results.working.push({ name: endpoint.name, status: result.status });
      } else {
        console.log(`   ⚠️ Status: ${result.status}`);
        results.errors.push({ name: endpoint.name, status: result.status });
      }
    } catch (error) {
      console.log(`   💥 EXCEÇÃO: ${error.message}`);
      results.errors.push({ name: endpoint.name, error: error.message });
    }
  }

  // Test Frontend Connectivity
  console.log('\n🖥️ Testando Frontend...\n');
  
  const frontendUrl = 'http://localhost:3002';
  const frontendResult = await testEndpoint(frontendUrl);
  
  if (frontendResult.error) {
    console.log(`❌ Frontend: ${frontendResult.error}`);
    results.errors.push({ name: 'Frontend', error: frontendResult.error });
  } else {
    console.log(`✅ Frontend: Status ${frontendResult.status}`);
    results.working.push({ name: 'Frontend', status: frontendResult.status });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMO DA AUDITORIA');
  console.log('='.repeat(50));
  console.log(`✅ Funcionando: ${results.working.length}`);
  console.log(`❌ Com Erro: ${results.errors.length}`);
  console.log(`🔴 Não Encontrado (404): ${results.missing.length}`);
  
  if (results.missing.length > 0) {
    console.log('\n🔴 ENDPOINTS MISSING (404):');
    results.missing.forEach(item => {
      console.log(`   • ${item.name}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ ENDPOINTS COM ERRO:');
    results.errors.forEach(item => {
      console.log(`   • ${item.name}: ${item.error || item.status}`);
    });
  }
  
  console.log('\n✅ ENDPOINTS FUNCIONANDO:');
  results.working.forEach(item => {
    console.log(`   • ${item.name}: ${item.status}`);
  });

  // Overall Status
  const critical404 = results.missing.filter(item => 
    ['Missing OTP', 'Missing SMS Status', 'Missing Webhook'].includes(item.name)
  ).length;
  
  const frontendWorking = results.working.some(item => item.name === 'Frontend');
  
  console.log('\n🎯 STATUS GERAL:');
  if (critical404 > 0) {
    console.log('🔴 REPROVADO - Endpoints críticos faltando (404)');
  } else if (!frontendWorking) {
    console.log('🔴 REPROVADO - Frontend não acessível');
  } else if (results.errors.length > results.working.length) {
    console.log('🟡 ATENÇÃO - Mais erros que sucessos');
  } else {
    console.log('🟢 APROVADO COM RESSALVAS - Principais endpoints funcionando');
  }

  return results;
}

// Execute
runSimpleAudit().then(results => {
  console.log('\n🏁 Auditoria simples finalizada');
}).catch(error => {
  console.error('💥 Erro na auditoria:', error.message);
});
