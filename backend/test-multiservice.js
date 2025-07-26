// 🧪 TESTE COMPLETO DO SERVIDOR MULTISERVIÇO
// Valida todas as funcionalidades GET e POST
// Uso: node test-multiservice.js [URL_DO_SERVIDOR]

const https = require('https');
const http = require('http');

const baseUrl = process.argv[2] || 'http://localhost:3000';

console.log('🧪 INICIANDO TESTES DO SERVIDOR MULTISERVIÇO');
console.log(`🌐 URL Base: ${baseUrl}`);
console.log('=====================================');

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const requestModule = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MultiserviceTestBot/1.0',
        ...options.headers
      },
      timeout: 15000
    };

    if (isHttps) {
      requestOptions.rejectUnauthorized = false;
    }

    const req = requestModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Testes individuais
const tests = [
  {
    name: 'Health Check Principal',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    expectedFields: ['status', 'service', 'version', 'database']
  },
  {
    name: 'Root Endpoint',
    method: 'GET', 
    path: '/',
    expectedStatus: 200,
    expectedFields: ['service', 'capabilities', 'endpoints']
  },
  {
    name: 'API Health Check',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200,
    expectedFields: ['status', 'service', 'api_capabilities']
  },
  {
    name: 'Status Detalhado',
    method: 'GET',
    path: '/api/status',
    expectedStatus: 200,
    expectedFields: ['status', 'runtime', 'memory', 'performance']
  },
  {
    name: 'Métricas do Sistema',
    method: 'GET',
    path: '/api/metrics',
    expectedStatus: 200,
    expectedFields: ['metrics']
  },
  {
    name: 'Recebimento de Dados via GET',
    method: 'GET',
    path: '/api/data?test=true&symbol=BTCUSDT&action=buy&price=50000',
    expectedStatus: 200,
    expectedFields: ['status', 'message', 'data_count']
  },
  {
    name: 'Recebimento de Dados via POST',
    method: 'POST',
    path: '/api/data',
    body: {
      test: true,
      symbol: 'ETHUSDT',
      action: 'sell',
      price: 3000,
      timestamp: new Date().toISOString()
    },
    expectedStatus: 200,
    expectedFields: ['status', 'message', 'body_size']
  },
  {
    name: 'Webhook TradingView',
    method: 'POST',
    path: '/api/webhooks/tradingview',
    body: {
      token: 'coinbitclub_webhook_secret_2024',
      strategy: 'TestStrategy',
      symbol: 'BTCUSDT',
      action: 'buy',
      price: 51000,
      timestamp: new Date().toISOString(),
      test_mode: true
    },
    expectedStatus: 200,
    expectedFields: ['status', 'message', 'server_id']
  },
  {
    name: 'Webhook Genérico',
    method: 'POST',
    path: '/webhook/signal1',
    body: {
      signal: 'test_signal',
      data: 'test_data',
      timestamp: new Date().toISOString()
    },
    expectedStatus: 200,
    expectedFields: ['status', 'message', 'signal']
  },
  {
    name: 'Webhook de Teste',
    method: 'POST',
    path: '/api/webhooks/test',
    body: {
      test: true,
      message: 'Teste do webhook',
      timestamp: new Date().toISOString()
    },
    expectedStatus: 200,
    expectedFields: ['status', 'message', 'received_data']
  },
  {
    name: 'Endpoint Inexistente (404)',
    method: 'GET',
    path: '/endpoint/inexistente',
    expectedStatus: 404,
    expectedFields: ['error', 'available_endpoints']
  }
];

// Executar testes
async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  console.log(`\n🚀 Executando ${tests.length} testes...\n`);

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testNumber = i + 1;
    
    try {
      console.log(`📋 Teste ${testNumber}/${tests.length}: ${test.name}`);
      
      const url = `${baseUrl}${test.path}`;
      const options = {
        method: test.method,
        body: test.body
      };

      const result = await makeRequest(url, options);
      
      // Verificar status
      const statusOk = result.status === test.expectedStatus;
      
      // Verificar campos esperados
      let fieldsOk = true;
      let missingFields = [];
      
      if (test.expectedFields && typeof result.data === 'object') {
        for (const field of test.expectedFields) {
          if (!(field in result.data)) {
            fieldsOk = false;
            missingFields.push(field);
          }
        }
      }
      
      const testPassed = statusOk && fieldsOk;
      
      if (testPassed) {
        console.log(`   ✅ PASSOU - Status: ${result.status}`);
        passed++;
      } else {
        console.log(`   ❌ FALHOU - Status: ${result.status} (esperado: ${test.expectedStatus})`);
        if (missingFields.length > 0) {
          console.log(`   ❌ Campos ausentes: ${missingFields.join(', ')}`);
        }
        failed++;
      }
      
      // Mostrar informações adicionais para alguns endpoints
      if (result.data && typeof result.data === 'object') {
        if (result.data.version) {
          console.log(`   📦 Versão: ${result.data.version}`);
        }
        if (result.data.server_id) {
          console.log(`   🆔 Server ID: ${result.data.server_id.substring(0, 8)}...`);
        }
        if (result.data.database && result.data.database.status) {
          console.log(`   🗄️ Banco: ${result.data.database.status}`);
        }
      }
      
      results.push({
        test: test.name,
        passed: testPassed,
        status: result.status,
        expectedStatus: test.expectedStatus,
        response: result.data
      });
      
    } catch (error) {
      console.log(`   ❌ ERRO - ${error.message}`);
      failed++;
      
      results.push({
        test: test.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log('');
  }

  // Resumo final
  console.log('📊 RESUMO DOS TESTES');
  console.log('===================');
  console.log(`✅ Testes passaram: ${passed}/${tests.length}`);
  console.log(`❌ Testes falharam: ${failed}/${tests.length}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((passed / tests.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Servidor multiserviço está funcionando perfeitamente!');
    console.log('🚀 Sistema pronto para produção!');
  } else {
    console.log('\n⚠️ Alguns testes falharam - verificar configuração');
  }
  
  // Informações do servidor (se disponível)
  try {
    const healthResult = await makeRequest(`${baseUrl}/health`);
    if (healthResult.data && typeof healthResult.data === 'object') {
      console.log('\n📊 INFORMAÇÕES DO SERVIDOR:');
      console.log(`   🏷️ Serviço: ${healthResult.data.service || 'N/A'}`);
      console.log(`   📦 Versão: ${healthResult.data.version || 'N/A'}`);
      console.log(`   🆔 Server ID: ${healthResult.data.server_id ? healthResult.data.server_id.substring(0, 12) + '...' : 'N/A'}`);
      console.log(`   ⏰ Uptime: ${healthResult.data.uptime ? healthResult.data.uptime.formatted : 'N/A'}`);
      console.log(`   🗄️ Banco: ${healthResult.data.database ? healthResult.data.database.status : 'N/A'}`);
      
      if (healthResult.data.capabilities) {
        console.log('   🔧 Capacidades:');
        Object.entries(healthResult.data.capabilities).forEach(([key, value]) => {
          console.log(`      ${value ? '✅' : '❌'} ${key}`);
        });
      }
    }
  } catch (error) {
    console.log('\n⚠️ Não foi possível obter informações detalhadas do servidor');
  }
  
  console.log('\n🔗 Para mais informações, acesse:');
  console.log(`   📊 Health: ${baseUrl}/health`);
  console.log(`   📈 Status: ${baseUrl}/api/status`);
  console.log(`   📋 Métricas: ${baseUrl}/api/metrics`);
  
  return { passed, failed, total: tests.length, results };
}

// Executar se for chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Erro ao executar testes:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
