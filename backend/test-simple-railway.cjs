const axios = require('axios');

async function testSimpleRailway() {
  const url = 'https://coinbitclub-market-bot-production.up.railway.app';
  
  console.log('🧪 TESTE SIMPLES DE CONECTIVIDADE RAILWAY');
  console.log('URL:', url);
  
  try {
    // Teste básico de health
    console.log('\n1. Testando /api/health...');
    const healthResponse = await axios.get(`${url}/api/health`, { timeout: 15000 });
    console.log('✅ Health OK:', healthResponse.status);
    console.log('📄 Dados:', healthResponse.data);
    
    // Teste de status
    console.log('\n2. Testando /api/status...');
    const statusResponse = await axios.get(`${url}/api/status`, { timeout: 15000 });
    console.log('✅ Status OK:', statusResponse.status);
    
    // Teste do webhook
    console.log('\n3. Testando webhook...');
    const webhookData = { 
      token: 'coinbitclub_webhook_secret_2024', 
      symbol: 'BTCUSDT', 
      action: 'BUY', 
      price: 43250.50,
      test_mode: true 
    };
    
    const webhookResponse = await axios.post(`${url}/api/webhooks/tradingview`, webhookData, { 
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Webhook OK:', webhookResponse.status);
    console.log('📄 Resposta:', webhookResponse.data);
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('🔍 Detalhes:', {
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

testSimpleRailway();
