const axios = require('axios');

// URL do Railway
const RAILWAY_URL = 'https://coinbitclub-market-bot-production.up.railway.app';

console.log('🚀 TESTE COMPLETO RAILWAY - SERVIDOR OTIMIZADO');
console.log('==============================================');

async function testRailwayOptimized() {
  try {
    console.log('🏥 1. Testando Health Check...');
    
    const healthResponse = await axios.get(`${RAILWAY_URL}/health`, { 
      timeout: 15000 
    });
    console.log('✅ Health Check OK:', healthResponse.status);
    console.log('📊 Response:', healthResponse.data);
    
    console.log('\n🏥 2. Testando API Health...');
    
    const apiHealthResponse = await axios.get(`${RAILWAY_URL}/api/health`, { 
      timeout: 15000 
    });
    console.log('✅ API Health OK:', apiHealthResponse.status);
    console.log('📊 Response:', apiHealthResponse.data);
    
    console.log('\n📊 3. Testando API Status...');
    
    const statusResponse = await axios.get(`${RAILWAY_URL}/api/status`, { 
      timeout: 15000 
    });
    console.log('✅ API Status OK:', statusResponse.status);
    console.log('📊 Response:', statusResponse.data);
    
    console.log('\n📡 4. Testando Webhook TradingView...');
    
    const webhookData = {
      token: 'coinbitclub_webhook_secret_2024',
      strategy: 'TradingView_Production_Test',
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 67800.00,
      timestamp: new Date().toISOString(),
      test_mode: true
    };
    
    const webhookResponse = await axios.post(
      `${RAILWAY_URL}/api/webhooks/tradingview`,
      webhookData,
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Production-Test'
        }
      }
    );
    console.log('✅ Webhook TradingView OK:', webhookResponse.status);
    console.log('📊 Response:', webhookResponse.data);
    
    console.log('\n📡 5. Testando Webhook Signal1...');
    
    const signal1Data = {
      strategy: 'Generic_Production_Test',
      symbol: 'ETHUSDT',
      action: 'SELL',
      price: 2480.00,
      timestamp: new Date().toISOString()
    };
    
    const signal1Response = await axios.post(
      `${RAILWAY_URL}/webhook/signal1`,
      signal1Data,
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Signal1-Production-Test'
        }
      }
    );
    console.log('✅ Webhook Signal1 OK:', signal1Response.status);
    console.log('📊 Response:', signal1Response.data);
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('============================');
    console.log('✅ Sistema Railway totalmente funcional');
    console.log('✅ Erro 502 RESOLVIDO');
    console.log('✅ Webhooks funcionando perfeitamente');
    console.log('✅ Sistema pronto para produção');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('================');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
      console.error('🔗 URL:', error.config.url);
      
      if (error.response.status === 502) {
        console.error('\n🚨 AINDA COM ERRO 502');
        console.error('💡 Possíveis causas:');
        console.error('   - Deploy ainda em andamento');
        console.error('   - Railway não atualizou ainda');
        console.error('   - Problemas de cache');
        console.error('\n⏰ Aguarde mais alguns minutos e teste novamente');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout - Servidor demorou para responder');
    } else {
      console.error('🌐 Erro de conexão:', error.message);
    }
  }
}

testRailwayOptimized();
