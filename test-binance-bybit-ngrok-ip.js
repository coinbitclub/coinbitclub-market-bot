// TESTE ESPECÍFICO DE CONECTIVIDADE BINANCE E BYBIT 
// IP NGROK SELECIONADO: 54.207.219.70

const axios = require('axios');
const https = require('https');
const http = require('http');

console.log('🧪 TESTE DE CONECTIVIDADE EXCHANGES COM IP NGROK ESPECÍFICO');
console.log('=' * 60);

const SELECTED_NGROK_IP = '54.207.219.70';
console.log(`🌐 IP NGROK SELECIONADO: ${SELECTED_NGROK_IP}`);

// Criar agentes com IP NGROK específico
function createNgrokAgent(isHttps = true) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  try {
    return new AgentClass({
      localAddress: SELECTED_NGROK_IP,
      keepAlive: true,
      timeout: 15000,
      maxSockets: 10,
      family: 4 // Force IPv4
    });
  } catch (error) {
    console.log(`⚠️ Erro criando agente: ${error.message}`);
    return null;
  }
}

// Configuração de request com IP NGROK
const createRequestConfig = (timeout = 15000) => {
  const httpsAgent = createNgrokAgent(true);
  const httpAgent = createNgrokAgent(false);
  
  return {
    timeout,
    httpsAgent,
    httpAgent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'DNT': '1'
    }
  };
};

// Teste Binance
async function testBinance() {
  console.log('\n🚀 TESTANDO BINANCE API...');
  
  const endpoints = [
    {
      name: 'Exchange Info',
      url: 'https://api.binance.com/api/v3/exchangeInfo',
      test: (data) => data.symbols && data.symbols.length > 0
    },
    {
      name: 'Server Time', 
      url: 'https://api.binance.com/api/v3/time',
      test: (data) => data.serverTime && typeof data.serverTime === 'number'
    },
    {
      name: 'BTC Ticker',
      url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
      test: (data) => data.symbol === 'BTCUSDT' && data.price
    },
    {
      name: 'Top 100 Tickers',
      url: 'https://api.binance.com/api/v3/ticker/24hr',
      test: (data) => Array.isArray(data) && data.length > 50
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`  📊 Testando: ${endpoint.name}...`);
      
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, createRequestConfig(12000));
      const responseTime = Date.now() - startTime;
      
      const isValid = endpoint.test(response.data);
      
      if (response.status === 200 && isValid) {
        console.log(`    ✅ Sucesso: ${responseTime}ms - Status ${response.status}`);
        console.log(`    📡 IP NGROK usado: ${SELECTED_NGROK_IP}`);
        
        results.push({
          endpoint: endpoint.name,
          success: true,
          responseTime,
          status: response.status,
          dataSize: JSON.stringify(response.data).length
        });
      } else {
        console.log(`    ⚠️ Resposta inválida: Status ${response.status}`);
        results.push({
          endpoint: endpoint.name,
          success: false,
          error: `Invalid response: ${response.status}`
        });
      }
      
    } catch (error) {
      console.log(`    ❌ Erro: ${error.response?.status || error.code || error.message}`);
      
      if (error.code === 'EADDRNOTAVAIL') {
        console.log(`    💡 IP ${SELECTED_NGROK_IP} não disponível localmente (normal - só funciona com NGROK ativo)`);
      }
      
      results.push({
        endpoint: endpoint.name,
        success: false,
        error: error.response?.status || error.code || error.message
      });
    }
    
    // Aguardar entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// Teste Bybit
async function testBybit() {
  console.log('\n💜 TESTANDO BYBIT API...');
  
  const endpoints = [
    {
      name: 'Server Time',
      url: 'https://api.bybit.com/v5/market/time',
      test: (data) => data.result && data.result.timeSecond
    },
    {
      name: 'BTC Ticker',
      url: 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT',
      test: (data) => data.result && data.result.list && data.result.list.length > 0
    },
    {
      name: 'All Spot Tickers',
      url: 'https://api.bybit.com/v5/market/tickers?category=spot',
      test: (data) => data.result && data.result.list && data.result.list.length > 50
    },
    {
      name: 'Instruments Info',
      url: 'https://api.bybit.com/v5/market/instruments-info?category=spot&symbol=BTCUSDT',
      test: (data) => data.result && data.result.list && data.result.list.length > 0
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`  📊 Testando: ${endpoint.name}...`);
      
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, createRequestConfig(12000));
      const responseTime = Date.now() - startTime;
      
      const isValid = endpoint.test(response.data);
      
      if (response.status === 200 && isValid) {
        console.log(`    ✅ Sucesso: ${responseTime}ms - Status ${response.status}`);
        console.log(`    📡 IP NGROK usado: ${SELECTED_NGROK_IP}`);
        
        results.push({
          endpoint: endpoint.name,
          success: true,
          responseTime,
          status: response.status,
          dataSize: JSON.stringify(response.data).length
        });
      } else {
        console.log(`    ⚠️ Resposta inválida: Status ${response.status}`);
        results.push({
          endpoint: endpoint.name,
          success: false,
          error: `Invalid response: ${response.status}`
        });
      }
      
    } catch (error) {
      console.log(`    ❌ Erro: ${error.response?.status || error.code || error.message}`);
      
      if (error.code === 'EADDRNOTAVAIL') {
        console.log(`    💡 IP ${SELECTED_NGROK_IP} não disponível localmente (normal - só funciona com NGROK ativo)`);
      }
      
      results.push({
        endpoint: endpoint.name,
        success: false,
        error: error.response?.status || error.code || error.message
      });
    }
    
    // Aguardar entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// Teste sem IP (para comparação)
async function testWithoutNgrokIP() {
  console.log('\n🌐 TESTANDO SEM IP NGROK (para comparação)...');
  
  const normalConfig = {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  };

  const testEndpoints = [
    { name: 'Binance Time', url: 'https://api.binance.com/api/v3/time' },
    { name: 'Bybit Time', url: 'https://api.bybit.com/v5/market/time' }
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`  📊 Testando: ${endpoint.name}...`);
      
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, normalConfig);
      const responseTime = Date.now() - startTime;
      
      console.log(`    ✅ Sucesso SEM IP fixo: ${responseTime}ms`);
      
    } catch (error) {
      console.log(`    ❌ Falhou SEM IP fixo: ${error.response?.status || error.message}`);
    }
  }
}

// Função principal
async function runConnectivityTest() {
  console.log(`\n🔍 Iniciando teste de conectividade...`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Testar Binance
    const binanceResults = await testBinance();
    
    // Testar Bybit  
    const bybitResults = await testBybit();
    
    // Testar sem IP para comparação
    await testWithoutNgrokIP();
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('=' * 40);
    
    const binanceSuccesses = binanceResults.filter(r => r.success).length;
    const bybitSuccesses = bybitResults.filter(r => r.success).length;
    
    console.log(`\n🚀 BINANCE (${binanceSuccesses}/${binanceResults.length} sucessos):`);
    binanceResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      console.log(`   ${status} ${result.endpoint}: ${time} ${result.error || ''}`);
    });
    
    console.log(`\n💜 BYBIT (${bybitSuccesses}/${bybitResults.length} sucessos):`);
    bybitResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      console.log(`   ${status} ${result.endpoint}: ${time} ${result.error || ''}`);
    });

    // Análise final
    console.log(`\n🎯 ANÁLISE:`);
    
    if (binanceSuccesses === 0 && bybitSuccesses === 0) {
      console.log(`❌ Nenhuma exchange respondeu com IP NGROK ${SELECTED_NGROK_IP}`);
      console.log(`💡 Motivo: IP NGROK só funciona em ambiente de produção com túnel ativo`);
      console.log(`✅ Em produção (Railway + NGROK), este IP deveria funcionar normalmente`);
    } else {
      console.log(`✅ Conectividade parcial estabelecida`);
      console.log(`📊 Binance: ${(binanceSuccesses/binanceResults.length*100).toFixed(1)}% sucesso`);
      console.log(`📊 Bybit: ${(bybitSuccesses/bybitResults.length*100).toFixed(1)}% sucesso`);
    }

    console.log(`\n🔧 CONFIGURAÇÃO RECOMENDADA PARA PRODUÇÃO:`);
    console.log(`   NGROK_IP_FIXO=${SELECTED_NGROK_IP}`);
    console.log(`   Agentes HTTP/HTTPS configurados com localAddress: ${SELECTED_NGROK_IP}`);

  } catch (error) {
    console.error('\n❌ Erro geral no teste:', error.message);
  }
}

// Executar teste
console.log('🚀 Iniciando em 2 segundos...\n');
setTimeout(() => {
  runConnectivityTest()
    .then(() => {
      console.log('\n✅ Teste de conectividade finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro durante teste:', error.message);
      process.exit(1);
    });
}, 2000);
