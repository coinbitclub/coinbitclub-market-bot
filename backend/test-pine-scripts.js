// TESTE DOS WEBHOOKS TRADINGVIEW COM DADOS REAIS DOS PINE SCRIPTS
// ================================================================

const https = require('https');
const http = require('http');

console.log('🧪 TESTE DOS WEBHOOKS TRADINGVIEW - DADOS PINE SCRIPT');
console.log('=====================================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// ================================================
// CONFIGURAÇÕES
// ================================================

const CONFIG = {
  // URL atual do Railway (sem -production)
  baseUrl: 'https://coinbitclub-market-bot.up.railway.app',
  
  // Token de autenticação
  webhookToken: '210406',
  
  // Endpoints
  endpoints: {
    signal: '/api/webhooks/signal',
    dominance: '/api/webhooks/dominance',
    recent: '/api/webhooks/signals/recent'
  }
};

// ================================================
// FUNÇÃO PARA FAZER REQUESTS HTTP
// ================================================

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingView-Webhook-Test',
        ...options.headers
      }
    };

    const req = lib.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// ================================================
// DADOS DE TESTE SIMULANDO OS PINE SCRIPTS
// ================================================

const testData = {
  // Dados do Pine Script 1: BTC Dominance vs EMA 7
  dominanceScript: {
    ticker: "BTC.D",
    time: "2024-01-26 15:30:00",
    btc_dominance: "42.156",
    ema_7: "41.890",
    diff_pct: "0.635",
    sinal: "NEUTRO"
  },

  // Dados do Pine Script 2: CoinBitClub - Sinal Completo
  signalScript: {
    ticker: "BTCUSDT",
    time: "2024-01-26 15:30:00",
    close: "42500.50",
    ema9_30: "42450.25",
    rsi_4h: "65.4",
    rsi_15: "58.2",
    momentum_15: "125.6",
    atr_30: "850.25",
    atr_pct_30: "2.0",
    vol_30: "1250000",
    vol_ma_30: "980000",
    diff_btc_ema7: "0.635",
    cruzou_acima_ema9: "1",  // Sinal de compra
    cruzou_abaixo_ema9: "0"
  },

  // Variação com sinal de venda
  signalScriptSell: {
    ticker: "ETHUSDT",
    time: "2024-01-26 15:31:00",
    close: "2580.75",
    ema9_30: "2595.30",
    rsi_4h: "35.8",
    rsi_15: "42.1",
    momentum_15: "-45.2",
    atr_30: "65.40",
    atr_pct_30: "2.5",
    vol_30: "850000",
    vol_ma_30: "1200000",
    diff_btc_ema7: "-0.421",
    cruzou_acima_ema9: "0",
    cruzou_abaixo_ema9: "1"  // Sinal de venda
  }
};

// ================================================
// TESTE DO WEBHOOK DE DOMINÂNCIA
// ================================================

async function testDominanceWebhook() {
  console.log('📈 TESTANDO WEBHOOK DE DOMINÂNCIA BTC:');
  console.log('======================================');
  
  const url = `${CONFIG.baseUrl}${CONFIG.endpoints.dominance}?token=${CONFIG.webhookToken}`;
  console.log(`URL: ${url}`);
  console.log(`Dados: ${JSON.stringify(testData.dominanceScript, null, 2)}`);
  console.log('');
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: testData.dominanceScript
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Sucesso: ${response.success ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Resposta: ${response.data}`);
    
    if (response.success) {
      const responseData = JSON.parse(response.data);
      console.log(`Webhook ID: ${responseData.webhook_id}`);
      console.log(`Dominância: ${responseData.dominance}%`);
      console.log(`Sinal: ${responseData.signal}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// TESTE DO WEBHOOK DE SINAIS
// ================================================

async function testSignalWebhook() {
  console.log('🎯 TESTANDO WEBHOOK DE SINAIS - COMPRA:');
  console.log('=======================================');
  
  const url = `${CONFIG.baseUrl}${CONFIG.endpoints.signal}?token=${CONFIG.webhookToken}`;
  console.log(`URL: ${url}`);
  console.log(`Dados: ${JSON.stringify(testData.signalScript, null, 2)}`);
  console.log('');
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: testData.signalScript
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Sucesso: ${response.success ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Resposta: ${response.data}`);
    
    if (response.success) {
      const responseData = JSON.parse(response.data);
      console.log(`Webhook ID: ${responseData.webhook_id}`);
      console.log(`Ação: ${responseData.action}`);
      console.log(`Símbolo: ${responseData.symbol}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  
  console.log('');
  
  // Teste com sinal de venda
  console.log('🎯 TESTANDO WEBHOOK DE SINAIS - VENDA:');
  console.log('======================================');
  
  console.log(`Dados: ${JSON.stringify(testData.signalScriptSell, null, 2)}`);
  console.log('');
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: testData.signalScriptSell
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Sucesso: ${response.success ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Resposta: ${response.data}`);
    
    if (response.success) {
      const responseData = JSON.parse(response.data);
      console.log(`Webhook ID: ${responseData.webhook_id}`);
      console.log(`Ação: ${responseData.action}`);
      console.log(`Símbolo: ${responseData.symbol}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// CONSULTAR SINAIS RECENTES
// ================================================

async function checkRecentSignals() {
  console.log('📊 CONSULTANDO SINAIS RECENTES:');
  console.log('===============================');
  
  const url = `${CONFIG.baseUrl}${CONFIG.endpoints.recent}`;
  console.log(`URL: ${url}`);
  console.log('');
  
  try {
    const response = await makeRequest(url);
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Sucesso: ${response.success ? '✅ SIM' : '❌ NÃO'}`);
    
    if (response.success) {
      const responseData = JSON.parse(response.data);
      console.log(`Total de sinais: ${responseData.count}`);
      
      if (responseData.signals && responseData.signals.length > 0) {
        console.log('\n📋 Últimos 5 sinais:');
        responseData.signals.slice(0, 5).forEach((signal, i) => {
          console.log(`${i+1}. ${signal.symbol} - ${signal.action} - ${signal.created_at}`);
          console.log(`   Preço: ${signal.price} | Estratégia: ${signal.strategy}`);
          if (signal.metadata && signal.metadata.cruzou_acima_ema9) {
            console.log(`   🔄 Cruzou acima EMA9: ${signal.metadata.cruzou_acima_ema9}`);
          }
          if (signal.metadata && signal.metadata.cruzou_abaixo_ema9) {
            console.log(`   🔄 Cruzou abaixo EMA9: ${signal.metadata.cruzou_abaixo_ema9}`);
          }
        });
      } else {
        console.log('📭 Nenhum sinal encontrado');
      }
    } else {
      console.log(`Resposta: ${response.data}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// TESTE DE CONECTIVIDADE
// ================================================

async function testConnectivity() {
  console.log('🌐 TESTE DE CONECTIVIDADE:');
  console.log('==========================');
  
  const healthUrl = `${CONFIG.baseUrl}/health`;
  console.log(`Testando: ${healthUrl}`);
  
  try {
    const response = await makeRequest(healthUrl);
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Sucesso: ${response.success ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Resposta: ${response.data}`);
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// FUNÇÃO PRINCIPAL
// ================================================

async function runPineScriptTests() {
  console.log('🚀 INICIANDO TESTES DOS PINE SCRIPTS...\n');
  
  try {
    await testConnectivity();
    await testDominanceWebhook();
    await testSignalWebhook();
    await checkRecentSignals();
    
    console.log('🎉 TESTES CONCLUÍDOS!');
    console.log('=====================');
    console.log('✅ Todos os testes de Pine Script foram executados');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se os dados foram salvos no banco');
    console.log('2. Configurar os alertas do TradingView com as URLs corretas');
    console.log('3. Monitorar os webhooks em produção');
    console.log('');
    console.log('🔗 URLs para configurar no TradingView:');
    console.log(`   Dominância: ${CONFIG.baseUrl}${CONFIG.endpoints.dominance}?token=${CONFIG.webhookToken}`);
    console.log(`   Sinais: ${CONFIG.baseUrl}${CONFIG.endpoints.signal}?token=${CONFIG.webhookToken}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar se for o arquivo principal
if (require.main === module) {
  runPineScriptTests();
}

module.exports = { runPineScriptTests };
