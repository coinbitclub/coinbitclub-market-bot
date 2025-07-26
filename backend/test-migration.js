// Script de Teste para Migração Railway V2
// Verifica se todos os endpoints estão funcionando corretamente
// Execute: node test-migration.js

const https = require('https');
const http = require('http');

console.log('🧪 TESTE DE MIGRAÇÃO RAILWAY V2');
console.log('===============================');
console.log('');

// Configuração dos testes
const TEST_CONFIG = {
  // URL será detectada automaticamente ou fornecida via argumento
  baseUrl: process.argv[2] || process.env.TEST_URL || 'http://localhost:3000',
  timeout: 10000,
  webhookToken: process.env.WEBHOOK_TOKEN || 'coinbitclub_webhook_secret_2024'
};

console.log(`🎯 URL de teste: ${TEST_CONFIG.baseUrl}`);
console.log('');

// Função auxiliar para fazer requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Migration-Test/2.0.0',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout
    };
    
    const req = httpModule.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Testes individuais
const tests = [
  {
    name: 'Root Endpoint (/)',
    url: '/',
    expectedStatus: 200,
    check: (data) => {
      return data.service && data.service.includes('CoinBitClub') && data.version;
    }
  },
  {
    name: 'Health Check (/health)',
    url: '/health',
    expectedStatus: 200,
    check: (data) => {
      return data.status === 'healthy' && data.version && data.database;
    }
  },
  {
    name: 'API Health (/api/health)',
    url: '/api/health',
    expectedStatus: 200,
    check: (data) => {
      return data.status === 'healthy' && data.service;
    }
  },
  {
    name: 'API Status (/api/status)',
    url: '/api/status',
    expectedStatus: 200,
    check: (data) => {
      return data.status === 'active' && data.uptime !== undefined;
    }
  },
  {
    name: 'TradingView Webhook (POST /api/webhooks/tradingview)',
    url: '/api/webhooks/tradingview',
    method: 'POST',
    body: {
      token: TEST_CONFIG.webhookToken,
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 45000,
      strategy: 'test-migration',
      test_mode: true
    },
    expectedStatus: 200,
    check: (data) => {
      return data.success === true && data.signal_id && data.version;
    }
  },
  {
    name: 'Generic Webhook (POST /webhook/test)',
    url: '/webhook/test',
    method: 'POST',
    body: {
      test: 'migration',
      timestamp: new Date().toISOString()
    },
    expectedStatus: 200,
    check: (data) => {
      return data.success === true && data.signal_id;
    }
  },
  {
    name: '404 Test (GET /nonexistent)',
    url: '/nonexistent',
    expectedStatus: 404,
    check: (data) => {
      return data.error && data.available_endpoints;
    }
  }
];

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes da migração...');
  console.log('');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const testUrl = TEST_CONFIG.baseUrl + test.url;
    
    try {
      console.log(`🧪 Testando: ${test.name}`);
      console.log(`   URL: ${test.method || 'GET'} ${testUrl}`);
      
      const result = await makeRequest(testUrl, {
        method: test.method,
        body: test.body
      });
      
      // Verificar status code
      if (result.statusCode === test.expectedStatus) {
        console.log(`   ✅ Status: ${result.statusCode} (esperado)`);
      } else {
        console.log(`   ❌ Status: ${result.statusCode} (esperado: ${test.expectedStatus})`);
        failed++;
        continue;
      }
      
      // Verificar conteúdo
      if (test.check) {
        if (test.check(result.data)) {
          console.log(`   ✅ Conteúdo: Válido`);
        } else {
          console.log(`   ❌ Conteúdo: Inválido`);
          console.log(`   📄 Resposta:`, JSON.stringify(result.data, null, 2));
          failed++;
          continue;
        }
      }
      
      // Verificar headers específicos da migração
      if (result.headers['x-migration-version'] || result.headers['x-server-id']) {
        console.log(`   ✅ Headers V2: Presentes`);
      }
      
      console.log(`   ✅ PASSOU`);
      passed++;
      
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  // Resumo dos testes
  console.log('📊 RESUMO DOS TESTES');
  console.log('===================');
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log(`🎯 Taxa de sucesso: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('');
  
  if (failed === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM - MIGRAÇÃO BEM-SUCEDIDA!');
    console.log('✅ O servidor V2 está funcionando corretamente');
    console.log('🚀 Pronto para receber tráfego de produção');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM - REVISAR MIGRAÇÃO');
    console.log('⚠️ Não migre o tráfego até resolver os problemas');
  }
  
  console.log('');
  
  // Teste adicional de performance
  await performanceTest();
  
  process.exit(failed > 0 ? 1 : 0);
}

// Teste de performance básico
async function performanceTest() {
  console.log('⚡ TESTE DE PERFORMANCE');
  console.log('=====================');
  
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    try {
      await makeRequest(TEST_CONFIG.baseUrl + '/health');
      const end = Date.now();
      const time = end - start;
      times.push(time);
      console.log(`📊 Teste ${i + 1}: ${time}ms`);
    } catch (error) {
      console.log(`❌ Teste ${i + 1}: Falhou`);
    }
  }
  
  if (times.length > 0) {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log('');
    console.log(`📈 Tempo médio: ${avg}ms`);
    console.log(`⚡ Tempo mínimo: ${min}ms`);
    console.log(`🐌 Tempo máximo: ${max}ms`);
    
    if (avg < 1000) {
      console.log('✅ Performance: Excelente (< 1s)');
    } else if (avg < 2000) {
      console.log('✅ Performance: Boa (< 2s)');
    } else {
      console.log('⚠️ Performance: Lenta (> 2s)');
    }
  }
  
  console.log('');
}

// Executar testes
runTests().catch(error => {
  console.error('💥 Erro nos testes:', error);
  process.exit(1);
});
