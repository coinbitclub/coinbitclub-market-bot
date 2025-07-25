const axios = require('axios');

async function testRailwayWebhook() {
  console.log('🚀 TESTE RAILWAY WEBHOOK - ENDPOINT CORRETO');
  console.log('═'.repeat(60));
  
  const baseUrl = 'https://coinbitclub-market-bot-production.up.railway.app';
  
  try {
    // 1. Teste de health primeiro
    console.log('🏥 Testando health endpoint...');
    try {
      const healthResponse = await axios.get(`${baseUrl}/api/health`, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Test-Bot' }
      });
      console.log('✅ Health OK:', healthResponse.status);
    } catch (error) {
      console.log('❌ Health falhou:', error.response?.status || error.message);
    }
    
    // 2. Teste do webhook
    console.log('\n📡 Testando webhook /api/webhooks/tradingview...');
    
    const webhookData = {
      token: 'coinbitclub_webhook_secret_2024',
      strategy: 'TradingView_Test',
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 67500.00,
      timestamp: new Date().toISOString(),
      test_mode: true
    };
    
    const webhookResponse = await axios.post(
      `${baseUrl}/api/webhooks/tradingview`,
      webhookData,
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Webhook',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ WEBHOOK SUCESSO!');
    console.log('📊 Status:', webhookResponse.status);
    console.log('📄 Response:', JSON.stringify(webhookResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:');
    console.error('🔍 Message:', error.message);
    console.error('📊 Status:', error.response?.status);
    console.error('📄 Data:', error.response?.data);
    console.error('🌐 Code:', error.code);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout - Servidor demorou para responder');
    }
  }
}

testRailwayWebhook();
