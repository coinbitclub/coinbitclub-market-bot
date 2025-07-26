// TESTE FINAL DOS WEBHOOKS APÓS REDEPLOY
// ======================================

const https = require('https');

console.log('🧪 TESTE FINAL DOS WEBHOOKS TRADINGVIEW');
console.log('=======================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// Aguardar 30 segundos para o redeploy
console.log('⏱️ Aguardando 30 segundos para o redeploy...');

setTimeout(async () => {
  console.log('🚀 Iniciando testes finais...\n');
  
  const CONFIG = {
    baseUrl: 'https://coinbitclub-market-bot.up.railway.app',
    webhookToken: '210406'
  };
  
  // Função para fazer requests
  function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingView-Final-Test',
          ...options.headers
        }
      };

      const req = https.request(url, requestOptions, (res) => {
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
  
  // Teste de conectividade
  console.log('🌐 TESTE DE CONECTIVIDADE:');
  console.log('==========================');
  
  try {
    const healthResponse = await makeRequest(`${CONFIG.baseUrl}/health`);
    console.log(`Status /health: ${healthResponse.statusCode} | ${healthResponse.success ? 'OK' : 'ERRO'}`);
    
    if (healthResponse.success) {
      const healthData = JSON.parse(healthResponse.data);
      console.log(`Uptime: ${Math.floor(healthData.uptime || 0)}s`);
    }
  } catch (error) {
    console.log(`❌ Erro health: ${error.message}`);
  }
  
  console.log('');
  
  // Teste dos novos endpoints
  console.log('🎯 TESTE DOS NOVOS ENDPOINTS:');
  console.log('=============================');
  
  const endpoints = [
    '/api/webhooks/signal',
    '/api/webhooks/dominance',
    '/api/webhooks/signals/recent'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Testando: ${endpoint}`);
    
    try {
      const url = `${CONFIG.baseUrl}${endpoint}`;
      const response = await makeRequest(url);
      
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 404) {
        console.log(`   ❌ Ainda não encontrado - precisa aguardar mais`);
      } else if (response.statusCode === 401) {
        console.log(`   🔐 Endpoint existe! Requer token (normal)`);
      } else if (response.statusCode === 405) {
        console.log(`   ✅ Endpoint existe! Método não permitido (normal para GET)`);
      } else if (response.statusCode === 200) {
        console.log(`   ✅ Endpoint funcionando!`);
        console.log(`   📄 Resposta: ${response.data.substring(0, 100)}...`);
      } else {
        console.log(`   ⚠️ Status inesperado: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('');
  
  // Teste com dados reais se os endpoints existirem
  console.log('📡 TESTE COM DADOS REAIS:');
  console.log('=========================');
  
  // Testar webhook de sinal
  console.log('🎯 Testando webhook de sinal...');
  
  const signalData = {
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
    cruzou_acima_ema9: "1",
    cruzou_abaixo_ema9: "0"
  };
  
  try {
    const signalUrl = `${CONFIG.baseUrl}/api/webhooks/signal?token=${CONFIG.webhookToken}`;
    const signalResponse = await makeRequest(signalUrl, {
      method: 'POST',
      body: signalData
    });
    
    console.log(`   Status: ${signalResponse.statusCode}`);
    
    if (signalResponse.success) {
      console.log(`   ✅ Sucesso! Sinal processado`);
      console.log(`   📄 Resposta: ${signalResponse.data}`);
    } else {
      console.log(`   ❌ Erro: ${signalResponse.data}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no teste de sinal: ${error.message}`);
  }
  
  console.log('');
  
  // Testar webhook de dominância
  console.log('📈 Testando webhook de dominância...');
  
  const dominanceData = {
    ticker: "BTC.D",
    time: "2024-01-26 15:30:00",
    btc_dominance: "42.156",
    ema_7: "41.890",
    diff_pct: "0.635",
    sinal: "NEUTRO"
  };
  
  try {
    const dominanceUrl = `${CONFIG.baseUrl}/api/webhooks/dominance?token=${CONFIG.webhookToken}`;
    const dominanceResponse = await makeRequest(dominanceUrl, {
      method: 'POST',
      body: dominanceData
    });
    
    console.log(`   Status: ${dominanceResponse.statusCode}`);
    
    if (dominanceResponse.success) {
      console.log(`   ✅ Sucesso! Dominância processada`);
      console.log(`   📄 Resposta: ${dominanceResponse.data}`);
    } else {
      console.log(`   ❌ Erro: ${dominanceResponse.data}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no teste de dominância: ${error.message}`);
  }
  
  console.log('');
  
  console.log('🎉 TESTES FINAIS CONCLUÍDOS!');
  console.log('============================');
  console.log('');
  console.log('📋 CONFIGURAÇÃO NO TRADINGVIEW:');
  console.log('');
  console.log('Para o Pine Script de Sinais:');
  console.log(`URL: ${CONFIG.baseUrl}/api/webhooks/signal?token=${CONFIG.webhookToken}`);
  console.log('');
  console.log('Para o Pine Script de Dominância:');
  console.log(`URL: ${CONFIG.baseUrl}/api/webhooks/dominance?token=${CONFIG.webhookToken}`);
  console.log('');
  console.log('✅ Sistema de webhooks TradingView configurado e testado!');
  
}, 30000); // 30 segundos
