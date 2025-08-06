
/**
 * Script de teste para verificar conectividade com exchanges
 * Usa IP fixo Railway: 132.255.160.140
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuração
const RAILWAY_IP = '132.255.160.140';
const exchanges = {
  "binance": {
    "mainnet": "https://api.binance.com",
    "testnet": "https://testnet.binance.vision",
    "futuresMainnet": "https://fapi.binance.com",
    "futuresTestnet": "https://testnet.binancefuture.com"
  },
  "bybit": {
    "mainnet": "https://api.bybit.com",
    "testnet": "https://api-testnet.bybit.com"
  }
};

// Função para testar conectividade básica
async function testBasicConnectivity() {
  console.log('🔍 TESTE DE CONECTIVIDADE BÁSICA');
  console.log('-'.repeat(40));
  
  // Verificar IP atual
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    console.log(`📍 IP Atual: ${ipData.ip}`);
    console.log(`📌 IP Esperado: ${RAILWAY_IP}`);
    console.log(`✅ Match: ${ipData.ip === RAILWAY_IP ? 'SIM' : 'NÃO'}`);
  } catch (error) {
    console.log(`❌ Erro ao verificar IP: ${error.message}`);
  }
  
  // Testar Binance
  try {
    console.log('\n📊 Testando Binance...');
    const response = await fetch('https://api.binance.com/api/v3/ping');
    if (response.ok) {
      console.log('   ✅ Binance: Conectividade OK');
      
      // Teste de tempo do servidor
      const timeResponse = await fetch('https://api.binance.com/api/v3/time');
      const timeData = await timeResponse.json();
      console.log(`   ⏰ Server Time: ${new Date(timeData.serverTime).toISOString()}`);
    } else {
      console.log(`   ❌ Binance: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Binance: ${error.message}`);
  }
  
  // Testar Bybit
  try {
    console.log('\n📊 Testando Bybit...');
    const response = await fetch('https://api.bybit.com/v5/market/time');
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Bybit: Conectividade OK');
      console.log(`   ⏰ Server Time: ${new Date(parseInt(data.time)).toISOString()}`);
    } else {
      console.log(`   ❌ Bybit: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Bybit: ${error.message}`);
  }
}

// Função para testar API keys (se configuradas)
async function testAPIKeys() {
  console.log('\n🔑 TESTE DE API KEYS');
  console.log('-'.repeat(40));
  
  const binanceKey = process.env.BINANCE_API_KEY;
  const bybitKey = process.env.BYBIT_API_KEY;
  
  if (!binanceKey && !bybitKey) {
    console.log('⚠️  Nenhuma API Key configurada - pulando testes');
    return;
  }
  
  // Teste Binance API Key
  if (binanceKey) {
    try {
      console.log('📊 Testando Binance API Key...');
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', process.env.BINANCE_SECRET_KEY || '')
        .update(queryString)
        .digest('hex');
      
      const response = await fetch(
        `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': binanceKey,
            'X-Source-IP': RAILWAY_IP
          }
        }
      );
      
      if (response.ok) {
        console.log('   ✅ Binance API Key: Válida');
      } else {
        const error = await response.text();
        console.log(`   ❌ Binance API Key: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Binance API Test: ${error.message}`);
    }
  }
  
  // Teste Bybit API Key  
  if (bybitKey) {
    try {
      console.log('📊 Testando Bybit API Key...');
      
      const timestamp = Date.now().toString();
      const params = { accountType: 'UNIFIED' };
      const queryString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const signString = `${timestamp}${bybitKey}${queryString}`;
      const signature = crypto
        .createHmac('sha256', process.env.BYBIT_SECRET_KEY || '')
        .update(signString)
        .digest('hex');
      
      const response = await fetch(
        `https://api.bybit.com/v5/account/wallet-balance?${queryString}`,
        {
          headers: {
            'X-BAPI-API-KEY': bybitKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-Source-IP': RAILWAY_IP
          }
        }
      );
      
      if (response.ok) {
        console.log('   ✅ Bybit API Key: Válida');
      } else {
        const error = await response.text();
        console.log(`   ❌ Bybit API Key: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Bybit API Test: ${error.message}`);
    }
  }
}

// Função principal
async function runTests() {
  console.log('🎯 TESTE DE CONFIGURAÇÃO IP FIXO - TRADING AUTOMÁTICO');
  console.log('=' .repeat(60));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 IP Railway: ${RAILWAY_IP}`);
  
  await testBasicConnectivity();
  await testAPIKeys();
  
  console.log('\n✅ TESTES CONCLUÍDOS');
  console.log('=' .repeat(60));
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testBasicConnectivity,
  testAPIKeys,
  runTests
};
