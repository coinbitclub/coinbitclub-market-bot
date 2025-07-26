const axios = require('axios');

// Configuração da URL do servidor
const BASE_URL = 'http://localhost:3003';

console.log('🧪 TESTE WEBHOOK APÓS CORREÇÃO');
console.log('════════════════════════════════════════════════════════');

async function testWebhookFinal() {
  try {
    // 1. Testar endpoint básico
    console.log('🔍 Testando /api/test...');
    const testResponse = await axios.get(`${BASE_URL}/api/test`);
    console.log('📊 Status /api/test:', testResponse.status);
    
    // 2. Testar webhook com dados válidos
    console.log('\n🧪 Testando webhook TradingView com dados válidos...');
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
    
    const webhookResponse = await axios.post(`${BASE_URL}/api/webhooks/tradingview`, webhookData);
    console.log('📊 Status webhook:', webhookResponse.status);
    console.log('📄 Resposta webhook:', JSON.stringify(webhookResponse.data, null, 2));
    
    // 3. Testar webhook com token inválido
    console.log('\n🧪 Testando webhook com token inválido...');
    const invalidTokenData = { ...webhookData, token: 'token_invalido' };
    
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/webhooks/tradingview`, invalidTokenData);
      console.log('📊 Status token inválido:', invalidResponse.status);
    } catch (error) {
      console.log('📊 Status token inválido:', error.response.status);
      console.log('📄 Resposta token inválido:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n✅ TESTE COMPLETO - WEBHOOK FUNCIONANDO!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Dados:', error.response.data);
    }
  }
}

testWebhookFinal();
