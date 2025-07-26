const axios = require('axios');

// URL do servidor Railway (assumindo baseado no padrão)
const RAILWAY_URL = 'https://coinbitclub-market-bot-v3-production.up.railway.app';

async function testServer() {
  console.log('🧪 TESTANDO SERVIDOR RAILWAY COM BANCO MIGRADO');
  console.log('===============================================');
  console.log(`🌐 URL: ${RAILWAY_URL}`);
  console.log('');
  
  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    try {
      const healthResponse = await axios.get(`${RAILWAY_URL}/health`, { timeout: 15000 });
      console.log('✅ Health Check OK:', healthResponse.data);
      
      if (healthResponse.data.database && healthResponse.data.database.status === 'connected') {
        console.log('🗄️ Banco de dados conectado!');
      }
    } catch (error) {
      console.log('❌ Health Check falhou:', error.message);
    }
    
    // Teste 2: GET API Data
    console.log('\n2️⃣ Testando GET /api/data...');
    try {
      const getResponse = await axios.get(`${RAILWAY_URL}/api/data?test=true&symbol=BTCUSDT&action=buy`, { 
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ GET /api/data OK:', getResponse.data);
    } catch (error) {
      console.log('❌ GET /api/data falhou:', error.message);
      if (error.response) {
        console.log('📄 Response:', error.response.data);
      }
    }
    
    // Teste 3: POST API Data
    console.log('\n3️⃣ Testando POST /api/data...');
    try {
      const postData = {
        action: 'buy',
        symbol: 'BTCUSDT',
        price: 45000,
        timestamp: new Date().toISOString(),
        strategy: 'test-migration',
        metadata: { test: true, migration: 'complete' }
      };
      
      const postResponse = await axios.post(`${RAILWAY_URL}/api/data`, postData, { 
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ POST /api/data OK:', postResponse.data);
    } catch (error) {
      console.log('❌ POST /api/data falhou:', error.message);
      if (error.response) {
        console.log('📄 Response:', error.response.data);
      }
    }
    
    // Teste 4: Webhook TradingView
    console.log('\n4️⃣ Testando POST /api/webhooks/tradingview...');
    try {
      const webhookData = {
        action: 'buy',
        symbol: 'BTCUSDT',
        price: 45000,
        strategy: 'test-webhook',
        timestamp: new Date().toISOString()
      };
      
      const webhookResponse = await axios.post(`${RAILWAY_URL}/api/webhooks/tradingview`, webhookData, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Test'
        }
      });
      console.log('✅ Webhook TradingView OK:', webhookResponse.data);
    } catch (error) {
      console.log('❌ Webhook TradingView falhou:', error.message);
      if (error.response) {
        console.log('📄 Response:', error.response.data);
      }
    }
    
    // Teste 5: Verificar dados no banco
    console.log('\n5️⃣ Verificando dados salvos no banco...');
    try {
      const statsResponse = await axios.get(`${RAILWAY_URL}/api/stats`, { timeout: 15000 });
      console.log('✅ Estatísticas do banco:', statsResponse.data);
    } catch (error) {
      console.log('❌ Estatísticas não disponíveis:', error.message);
    }
    
    console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
    console.log('==============================');
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

testServer();
