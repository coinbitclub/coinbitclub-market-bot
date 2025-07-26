const axios = require('axios');

// URL do servidor Railway
const RAILWAY_URL = 'https://coinbitclub-market-bot.up.railway.app';
const WEBHOOK_TOKEN = '210406'; // Token do backup

async function testWebhookWithToken() {
  console.log('🧪 TESTANDO WEBHOOK COM TOKEN CORRETO');
  console.log('====================================');
  console.log(`🌐 URL: ${RAILWAY_URL}`);
  console.log(`🔑 Token: ${WEBHOOK_TOKEN}`);
  console.log('');
  
  try {
    // Teste webhook TradingView com token
    console.log('📡 Testando POST /api/webhooks/tradingview com token...');
    const webhookData = {
      action: 'buy',
      symbol: 'BTCUSDT',
      price: 45000,
      strategy: 'test-webhook-with-token',
      timestamp: new Date().toISOString(),
      token: WEBHOOK_TOKEN, // Incluir token no body
      metadata: {
        source: 'tradingview',
        test: true,
        migration_complete: true
      }
    };
    
    // Teste 1: Token no body
    try {
      const webhookResponse1 = await axios.post(`${RAILWAY_URL}/api/webhooks/tradingview`, webhookData, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Test'
        }
      });
      console.log('✅ Webhook com token no body OK:');
      console.log('   Status:', webhookResponse1.status);
      console.log('   Resposta:', JSON.stringify(webhookResponse1.data, null, 2));
    } catch (error) {
      console.log('❌ Webhook com token no body falhou:', error.response?.status);
      console.log('📄 Resposta:', error.response?.data);
    }
    
    // Teste 2: Token no header
    try {
      const webhookResponse2 = await axios.post(`${RAILWAY_URL}/api/webhooks/tradingview`, {
        action: 'buy',
        symbol: 'BTCUSDT',
        price: 45000,
        strategy: 'test-webhook-header-token',
        timestamp: new Date().toISOString()
      }, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Test',
          'Authorization': `Bearer ${WEBHOOK_TOKEN}`,
          'X-Webhook-Token': WEBHOOK_TOKEN
        }
      });
      console.log('✅ Webhook com token no header OK:');
      console.log('   Status:', webhookResponse2.status);
      console.log('   Resposta:', JSON.stringify(webhookResponse2.data, null, 2));
    } catch (error) {
      console.log('❌ Webhook com token no header falhou:', error.response?.status);
      console.log('📄 Resposta:', error.response?.data);
    }
    
    // Teste 3: Token como query parameter
    try {
      const webhookResponse3 = await axios.post(`${RAILWAY_URL}/api/webhooks/tradingview?token=${WEBHOOK_TOKEN}`, {
        action: 'buy',
        symbol: 'BTCUSDT',
        price: 45000,
        strategy: 'test-webhook-query-token',
        timestamp: new Date().toISOString()
      }, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Test'
        }
      });
      console.log('✅ Webhook com token no query OK:');
      console.log('   Status:', webhookResponse3.status);
      console.log('   Resposta:', JSON.stringify(webhookResponse3.data, null, 2));
    } catch (error) {
      console.log('❌ Webhook com token no query falhou:', error.response?.status);
      console.log('📄 Resposta:', error.response?.data);
    }
    
    console.log('\\n🎉 TESTE DE WEBHOOK FINALIZADO!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testWebhookWithToken();
