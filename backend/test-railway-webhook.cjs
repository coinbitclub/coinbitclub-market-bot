const axios = require('axios');

// URLs para teste
const RAILWAY_URL = 'https://coinbitclub-market-bot-production.up.railway.app';

console.log('🚀 TESTE FINAL - WEBHOOK TRADINGVIEW EM PRODUÇÃO (RAILWAY)');
console.log('═══════════════════════════════════════════════════════════════════');

async function testProductionWebhook() {
  try {
    // Testar webhook no Railway
    console.log('🌐 Testando webhook no Railway...');
    
    const webhookData = {
      token: 'coinbitclub_webhook_secret_2024',
      strategy: 'RSI_MACD_Strategy',
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 43250.50,
      timestamp: new Date().toISOString(),
      indicators: {
        rsi: 68.5,
        macd: 0.025,
        signal: 'bullish'
      },
      test_mode: true
    };
    
    const response = await axios.post(`${RAILWAY_URL}/api/webhooks/tradingview`, webhookData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingView-Webhook-Test'
      }
    });
    
    console.log('✅ STATUS:', response.status);
    console.log('📊 RESPOSTA:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 WEBHOOK TRADINGVIEW FUNCIONANDO EM PRODUÇÃO!');
    console.log('🔗 URL do webhook:', `${RAILWAY_URL}/api/webhooks/tradingview`);
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Dados:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout na conexão');
    } else {
      console.error('🌐 Erro de rede:', error.code);
    }
  }
}

testProductionWebhook();
