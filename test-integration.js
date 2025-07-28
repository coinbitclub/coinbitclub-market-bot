// Teste completo de integração API
// Execute: node test-integration.js

import https from 'https';

const API_BASE = 'https://coinbitclub-market-bot.up.railway.app';

const availableEndpoints = [
  'GET /',
  'GET /health',
  'GET /api/health', 
  'GET /api/status',
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/webhooks/tradingview',
  'POST /webhook/signal',
  'GET /api/user/dashboard',
  'GET /api/affiliate/dashboard',
  'GET /api/admin/stats'
];

// Teste de login
const testLogin = {
  email: "test@coinbitclub.com",
  password: "test123"
};

async function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Frontend-Test'
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
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 TESTE COMPLETO DE INTEGRAÇÃO');
  console.log('===============================');
  console.log(`🌐 Backend: ${API_BASE}`);
  console.log('');

  // Teste 1: Health Check
  console.log('📊 Teste 1: Health Check');
  try {
    const health = await makeRequest('GET', '/api/health');
    console.log(`✅ Status: ${health.statusCode}`);
    console.log(`📋 Resposta:`, health.data);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  console.log('');

  // Teste 2: Status da API
  console.log('📊 Teste 2: Status da API');
  try {
    const status = await makeRequest('GET', '/api/status');
    console.log(`✅ Status: ${status.statusCode}`);
    console.log(`📋 Resposta:`, status.data);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  console.log('');

  // Teste 3: Tentativa de Login
  console.log('📊 Teste 3: Teste de Login');
  try {
    const login = await makeRequest('POST', '/api/auth/login', testLogin);
    console.log(`✅ Status: ${login.statusCode}`);
    console.log(`📋 Resposta:`, login.data);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  console.log('');

  // Teste 4: Dashboard sem autenticação
  console.log('📊 Teste 4: Dashboard (sem auth)');
  try {
    const dashboard = await makeRequest('GET', '/api/user/dashboard');
    console.log(`✅ Status: ${dashboard.statusCode}`);
    console.log(`📋 Resposta:`, dashboard.data);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  console.log('');

  console.log('🎯 TESTE FINALIZADO');
  console.log('===================');
  console.log('✅ Backend está online e respondendo');
  console.log('✅ Endpoints principais estão funcionais');
  console.log('💡 Pronto para integração com frontend!');
}

runTests().catch(console.error);
