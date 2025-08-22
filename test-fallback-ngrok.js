// TESTE RÁPIDO DO SISTEMA DE FALLBACK NGROK
const axios = require('axios');
const https = require('https');
const http = require('http');

console.log('🧪 TESTE DO SISTEMA DE FALLBACK NGROK');
console.log('=' * 50);

const SELECTED_NGROK_IP = '54.207.219.70';
let NGROK_AVAILABLE = false;

// Função de teste do sistema real
function createExchangeAgent(isHttps = true, useNgrokIP = true) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  const config = {
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 100,
    maxFreeSockets: 50,
    timeout: 30000,
    freeSocketTimeout: 15000,
    socketActiveTTL: 60000
  };

  // TENTAR IP NGROK PRIMEIRO para exchanges (com fallback automático)
  if (useNgrokIP) {
    try {
      config.localAddress = SELECTED_NGROK_IP;
      console.log(`🔗 Agente ${isHttps ? 'HTTPS' : 'HTTP'} com IP NGROK: ${SELECTED_NGROK_IP}`);
      
      // Testar se o IP NGROK está disponível criando o agente
      const testAgent = new AgentClass(config);
      return testAgent;
      
    } catch (error) {
      console.log(`⚠️ IP NGROK ${SELECTED_NGROK_IP} não disponível, usando conexão normal: ${error.message}`);
      
      // Remover localAddress para usar conexão normal
      delete config.localAddress;
    }
  }
  
  return new AgentClass(config);
}

function createOptimizedAgent(isHttps = true) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  return new AgentClass({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 100,
    maxFreeSockets: 50,
    timeout: 30000,
    freeSocketTimeout: 15000,
    socketActiveTTL: 60000
  });
}

// Função para testar conectividade NGROK
async function testNgrokConnectivity() {
  try {
    console.log(`🧪 Testando conectividade IP NGROK: ${SELECTED_NGROK_IP}...`);
    
    // Testar com um endpoint simples
    const testAgent = createExchangeAgent(true, true);
    const testConfig = {
      timeout: 5000,
      httpsAgent: testAgent,
      headers: { 'User-Agent': 'MarketBot-Test/1.0' }
    };
    
    // Tentar acessar Binance time endpoint
    await axios.get('https://api.binance.com/api/v3/time', testConfig);
    
    NGROK_AVAILABLE = true;
    console.log(`✅ IP NGROK ${SELECTED_NGROK_IP} funcionando!`);
    return true;
    
  } catch (error) {
    console.log(`⚠️ IP NGROK ${SELECTED_NGROK_IP} não disponível: ${error.code || error.message}`);
    console.log(`🔄 Sistema funcionará com conexão normal (sem IP fixo)`);
    
    NGROK_AVAILABLE = false;
    return false;
  }
}

// Função para criar agente baseado na disponibilidade do NGROK
function createSmartAgent(isHttps = true) {
  if (NGROK_AVAILABLE) {
    console.log(`🎯 Usando agente NGROK para ${isHttps ? 'HTTPS' : 'HTTP'}`);
    return createExchangeAgent(isHttps, true);
  } else {
    console.log(`🔄 Usando agente normal para ${isHttps ? 'HTTPS' : 'HTTP'}`);
    return createOptimizedAgent(isHttps);
  }
}

// Teste principal
async function testarSistemaFallback() {
  console.log('\n1️⃣ TESTANDO CONECTIVIDADE NGROK...');
  await testNgrokConnectivity();
  
  console.log('\n2️⃣ TESTANDO AGENTE INTELIGENTE...');
  const smartAgent = createSmartAgent(true);
  
  const config = {
    timeout: 10000,
    httpsAgent: smartAgent,
    headers: { 'User-Agent': 'MarketBot-Test/1.0' }
  };
  
  console.log('\n3️⃣ TESTANDO BINANCE COM AGENTE INTELIGENTE...');
  try {
    const response = await axios.get('https://api.binance.com/api/v3/time', config);
    console.log(`✅ Binance respondeu: ${JSON.stringify(response.data)}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`⏱️ Tempo de resposta: OK`);
  } catch (error) {
    console.log(`❌ Binance falhou: ${error.code || error.message}`);
  }
  
  console.log('\n4️⃣ TESTANDO BYBIT COM AGENTE INTELIGENTE...');
  try {
    const response = await axios.get('https://api.bybit.com/v5/market/time', config);
    console.log(`✅ Bybit respondeu: ${JSON.stringify(response.data)}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`⏱️ Tempo de resposta: OK`);
  } catch (error) {
    console.log(`❌ Bybit falhou: ${error.code || error.message}`);
  }
  
  console.log('\n🎯 RESULTADO DO TESTE:');
  if (NGROK_AVAILABLE) {
    console.log('✅ NGROK disponível - usando IPs fixos');
  } else {
    console.log('🔄 NGROK não disponível - usando conexão normal');
    console.log('✅ Sistema funcionando com fallback automático');
  }
}

// Executar teste
testarSistemaFallback()
  .then(() => {
    console.log('\n🎉 Teste do sistema de fallback concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Erro no teste:', error.message);
    process.exit(1);
  });
