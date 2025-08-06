// Teste rápido dos endpoints usados na página de integração
// Execute: node test-endpoints.js

import https from 'https';

const API_BASE = 'https://coinbitclub-market-bot.up.railway.app';

async function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 TESTE DOS ENDPOINTS DA PÁGINA DE INTEGRAÇÃO');
  console.log('===============================================');
  console.log('');

  // 1. Health Check
  console.log('1️⃣ Backend Health Check');
  try {
    const result = await makeRequest('GET', '/health');
    console.log(`✅ Status: ${result.statusCode}`);
    console.log(`📋 Response:`, result.data);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');

  // 2. API Status
  console.log('2️⃣ API Status Check');
  try {
    const result = await makeRequest('GET', '/api/status');
    console.log(`✅ Status: ${result.statusCode}`);
    console.log(`📋 Response:`, result.data);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');

  // 3. API Health (para database connection)
  console.log('3️⃣ API Health (Database Test)');
  try {
    const result = await makeRequest('GET', '/api/health');
    console.log(`✅ Status: ${result.statusCode}`);
    console.log(`📋 Database:`, result.data.database);
    console.log(`📋 Service:`, result.data.service);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');

  // 4. Auth Test (login inválido)
  console.log('4️⃣ Authentication Test (Invalid Login)');
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: 'test@invalid.com',
      password: 'invalid'
    });
    console.log(`⚠️ Status: ${result.statusCode} (esperado: 401)`);
    console.log(`📋 Response:`, result.data);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');

  // 5. Webhook Test
  console.log('5️⃣ Webhook Signal Test');
  try {
    const result = await makeRequest('POST', '/webhook/signal', {
      test: true,
      source: 'integration_test'
    });
    console.log(`✅ Status: ${result.statusCode}`);
    console.log(`📋 Response:`, result.data);
  } catch (error) {
    console.log(`⚠️ Status: ${error.response?.status || 'Unknown'} (pode ser esperado)`);
    console.log(`📋 Response:`, error.response?.data || error.message);
  }
  console.log('');

  // 6. Endpoints List Test
  console.log('6️⃣ Available Endpoints Test');
  try {
    const result = await makeRequest('GET', '/api/endpoints-list');
    console.log(`✅ Status: ${result.statusCode}`);
    console.log(`📋 Response:`, result.data);
  } catch (error) {
    console.log(`⚠️ Status: 404 (esperado - lista endpoints no erro)`);
    // Este endpoint deve retornar 404 com lista de endpoints
  }
  console.log('');

  console.log('🎯 TESTE FINALIZADO');
  console.log('Todos os endpoints testados para verificar compatibilidade com a página de integração');
}

testEndpoints().catch(console.error);
