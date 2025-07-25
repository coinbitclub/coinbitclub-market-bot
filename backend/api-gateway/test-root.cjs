const axios = require('axios');

// URL DO RAILWAY
const RAILWAY_URL = 'https://coinbitclub-market-bot-backend-production.up.railway.app';

async function testarEndpointRoot() {
  try {
    console.log('🔍 Testando endpoint ROOT do Railway...');
    console.log(`📡 URL: ${RAILWAY_URL}`);
    
    const response = await axios.get(RAILWAY_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TradingView-Webhook-Test'
      }
    });

    console.log('✅ SUCESSO!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, response.data);

  } catch (error) {
    console.log('❌ ERRO no endpoint ROOT!');
    
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

testarEndpointRoot();
