const axios = require('axios');

// URL DO RAILWAY
const RAILWAY_URL = 'https://coinbitclub-market-bot-backend-production.up.railway.app';

async function testarEndpoints() {
  const endpoints = [
    '',
    '/api/health',
    '/api/status',
    '/health',
    '/status'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testando: ${RAILWAY_URL}${endpoint}`);
      
      const response = await axios.get(`${RAILWAY_URL}${endpoint}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TradingView-Webhook-Test'
        }
      });

      console.log(`✅ SUCESSO!`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📝 Response:`, response.data);

    } catch (error) {
      console.log(`❌ ERRO no endpoint ${endpoint}!`);
      
      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📝 Response:`, error.response.data);
      } else if (error.request) {
        console.log('🔌 Sem resposta do servidor');
        console.log('⚠️ Erro de rede:', error.message);
      } else {
        console.log('💥 Erro:', error.message);
      }
    }
  }
}

testarEndpoints();
