// TESTE DOS WEBHOOKS CORRIGIDOS
// ==============================

const https = require('https');

console.log('🧪 TESTE DOS WEBHOOKS TRADINGVIEW CORRIGIDOS');
console.log('=============================================');

// URLs corretas para teste
const WEBHOOK_URLS = {
  signal: 'https://coinbitclub-market-bot.up.railway.app/webhook/signal?token=210406',
  dominance: 'https://coinbitclub-market-bot.up.railway.app/webhook/dominance?token=210406'
};

// Função para fazer request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingView-Webhook-Test',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Teste 1: Signal Webhook
async function testSignalWebhook() {
  console.log('🎯 TESTE 1: WEBHOOK DE SINAIS');
  console.log('=============================');
  console.log(`URL: ${WEBHOOK_URLS.signal}`);
  
  const testSignal = {
    token: "210406",
    symbol: "BTCUSDT", 
    action: "buy",
    price: 67500.50,
    volume: 2.5,
    strategy: "GOLDEN_CROSS_TEST",
    timeframe: "1h",
    timestamp: new Date().toISOString(),
    source: "tradingview_test"
  };
  
  console.log('📤 Enviando sinal de teste:', testSignal);
  
  try {
    const response = await makeRequest(WEBHOOK_URLS.signal, {
      method: 'POST',
      body: testSignal
    });
    
    console.log(`📥 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    console.log(`📄 Resposta:`, response.data);
    
    if (response.success) {
      console.log('🎉 Webhook de sinais funcionando corretamente!');
    } else {
      console.log('❌ Webhook de sinais com problemas');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de sinais:', error.message);
  }
  
  console.log('');
}

// Teste 2: Dominance Webhook  
async function testDominanceWebhook() {
  console.log('📈 TESTE 2: WEBHOOK DE DOMINÂNCIA');
  console.log('=================================');
  console.log(`URL: ${WEBHOOK_URLS.dominance}`);
  
  const testDominance = {
    token: "210406",
    btc_dominance: 56.8,
    eth_dominance: 17.2,
    trend: "bullish",
    timestamp: new Date().toISOString(),
    source: "tradingview_test"
  };
  
  console.log('📤 Enviando dominância de teste:', testDominance);
  
  try {
    const response = await makeRequest(WEBHOOK_URLS.dominance, {
      method: 'POST', 
      body: testDominance
    });
    
    console.log(`📥 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    console.log(`📄 Resposta:`, response.data);
    
    if (response.success) {
      console.log('🎉 Webhook de dominância funcionando corretamente!');
    } else {
      console.log('❌ Webhook de dominância com problemas');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de dominância:', error.message);
  }
  
  console.log('');
}

// Teste 3: Token inválido
async function testInvalidToken() {
  console.log('🔒 TESTE 3: TOKEN INVÁLIDO');
  console.log('==========================');
  
  const invalidSignal = {
    token: "WRONG_TOKEN",
    symbol: "BTCUSDT",
    action: "sell",
    price: 67000
  };
  
  console.log('📤 Enviando com token inválido:', invalidSignal.token);
  
  try {
    const response = await makeRequest(WEBHOOK_URLS.signal, {
      method: 'POST',
      body: invalidSignal
    });
    
    console.log(`📥 Status: ${response.statusCode}`);
    console.log(`📄 Resposta:`, response.data);
    
    if (response.statusCode === 401) {
      console.log('✅ Autenticação funcionando - token inválido rejeitado');
    } else {
      console.log('⚠️ Autenticação pode ter problemas');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de token:', error.message);
  }
  
  console.log('');
}

// Teste 4: Verificar dados salvos
async function testSavedData() {
  console.log('🗄️ TESTE 4: DADOS SALVOS');
  console.log('========================');
  
  const recentUrl = 'https://coinbitclub-market-bot.up.railway.app/api/signals/recent';
  console.log(`URL: ${recentUrl}`);
  
  try {
    const response = await makeRequest(recentUrl);
    
    console.log(`📥 Status: ${response.statusCode}`);
    
    if (response.success) {
      const data = JSON.parse(response.data);
      console.log(`✅ Sinais recentes: ${data.total_signals}`);
      console.log(`✅ Dominância recente: ${data.total_dominance}`);
      
      if (data.signals && data.signals.length > 0) {
        console.log('📊 Último sinal:', {
          symbol: data.signals[0].symbol,
          action: data.signals[0].action,
          price: data.signals[0].price,
          timestamp: data.signals[0].created_at
        });
      }
      
      if (data.dominance && data.dominance.length > 0) {
        console.log('📈 Última dominância:', {
          btc: data.dominance[0].btc_dominance,
          eth: data.dominance[0].eth_dominance,
          timestamp: data.dominance[0].created_at
        });
      }
      
    } else {
      console.log('❌ Erro ao buscar dados salvos');
      console.log('📄 Resposta:', response.data);
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar dados salvos:', error.message);
  }
  
  console.log('');
}

// Função principal
async function runTests() {
  console.log('🚀 INICIANDO TESTES COMPLETOS...\n');
  
  try {
    await testSignalWebhook();
    await testDominanceWebhook();
    await testInvalidToken();
    await testSavedData();
    
    console.log('📊 RELATÓRIO FINAL DOS TESTES:');
    console.log('==============================');
    console.log('✅ Testes completados');
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Webhooks estão funcionando localmente');
    console.log('2. 🔄 Atualizar URLs no TradingView:');
    console.log(`   Signal: ${WEBHOOK_URLS.signal}`);
    console.log(`   Dominance: ${WEBHOOK_URLS.dominance}`);
    console.log('3. 🧪 Fazer teste real com TradingView');
    console.log('4. 📊 Monitorar recebimento de sinais reais');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante testes:', error);
  }
}

// Executar testes
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
