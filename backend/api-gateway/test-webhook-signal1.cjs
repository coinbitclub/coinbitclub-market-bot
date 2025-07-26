const axios = require('axios');

// URL DO RAILWAY
const RAILWAY_URL = 'https://coinbitclub-market-bot-backend-production.up.railway.app';

async function testarWebhookSignal1() {
  try {
    console.log('📡 Testando webhook /webhook/signal1...');
    
    const testData = {
      strategy: 'TradingView_Test',
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 67500.00,
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(`${RAILWAY_URL}/webhook/signal1`, testData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingView-Test'
      }
    });

    console.log('✅ SUCESSO!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, response.data);

  } catch (error) {
    console.log('❌ ERRO!');
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Response:`, error.response.data);
    } else {
      console.log('💥 Erro:', error.message);
    }
  }
}

testarWebhookSignal1();
