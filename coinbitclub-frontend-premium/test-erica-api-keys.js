#!/usr/bin/env node

const crypto = require('crypto');

// Configurações da usuária Erica
const CONFIG = {
  // Chaves da tabela credentials (principal)
  BYBIT_API_KEY: 'BybitRealKey2025_ERICA_PRODUCTION_API_KEY_COINBITCLUB',
  BYBIT_SECRET_KEY: 'BybitRealSecret2025_ERICA_PRODUCTION_SECRET_COINBITCLUB',
  
  // Chaves da tabela user_api_keys (alternativa)
  BYBIT_API_KEY_ALT: 'dtbi5nXnYURm7uHnxA',
  BYBIT_SECRET_KEY_ALT: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
  
  // Configurações
  RAILWAY_IP: '132.255.160.140',
  USER_ID: '719db8b0-f6be-4a0d-90a1-1cbad2d0bc4d',
  USER_NAME: 'ERICA ANDRADE',
  USER_EMAIL: 'erica.andrade.santos@hotmail.com'
};

console.log('🧪 TESTE DE CONECTIVIDADE - CHAVES API ERICA ANDRADE');
console.log('=' .repeat(60));
console.log(`👤 Usuária: ${CONFIG.USER_NAME}`);
console.log(`📧 Email: ${CONFIG.USER_EMAIL}`);
console.log(`🆔 ID: ${CONFIG.USER_ID}`);
console.log(`🌐 IP Railway: ${CONFIG.RAILWAY_IP}`);
console.log('=' .repeat(60));

// Função para verificar IP atual
async function checkCurrentIP() {
  try {
    console.log('\n🌐 VERIFICANDO IP ATUAL...');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    console.log(`✅ IP Detectado: ${data.ip}`);
    
    if (data.ip === CONFIG.RAILWAY_IP) {
      console.log(`✅ IP MATCH: Corresponde ao IP Railway configurado`);
    } else {
      console.log(`⚠️  IP DIFERENTE: Railway configurado = ${CONFIG.RAILWAY_IP}`);
    }
    
    return data.ip;
  } catch (error) {
    console.error(`❌ Erro ao verificar IP: ${error.message}`);
    return null;
  }
}

// Função para gerar assinatura Bybit
function generateBybitSignature(apiKey, apiSecret, timestamp, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const queryString = `${timestamp}${apiKey}5000${sortedParams}`;
  
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

// Função para testar conectividade básica Bybit
async function testBybitConnectivity() {
  try {
    console.log('\n🔗 TESTANDO CONECTIVIDADE BÁSICA BYBIT...');
    
    const start = Date.now();
    const response = await fetch('https://api.bybit.com/v5/market/time');
    const latency = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Bybit API: Online (${latency}ms)`);
      console.log(`⏰ Server Time: ${new Date(parseInt(data.result.timeSecond) * 1000).toISOString()}`);
      return true;
    } else {
      console.log(`❌ Bybit API: Erro ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Bybit Connectivity Error: ${error.message}`);
    return false;
  }
}

// Função para testar chave API específica
async function testBybitAPIKey(apiKey, apiSecret, keyName) {
  try {
    console.log(`\n🔑 TESTANDO CHAVE ${keyName}...`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-6)}`);
    console.log(`🔐 Secret: ${apiSecret.substring(0, 6)}...${apiSecret.slice(-6)}`);
    
    const timestamp = Date.now().toString();
    const signature = generateBybitSignature(apiKey, apiSecret, timestamp, {});
    
    const headers = {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-RECV-WINDOW': '5000',
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Bot/1.0',
      'X-Source-IP': CONFIG.RAILWAY_IP
    };
    
    console.log(`📡 Headers configurados com IP: ${CONFIG.RAILWAY_IP}`);
    
    const start = Date.now();
    const response = await fetch(
      'https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED',
      {
        method: 'GET',
        headers: headers
      }
    );
    const latency = Date.now() - start;
    
    console.log(`⏱️  Tempo de resposta: ${latency}ms`);
    console.log(`📊 Status HTTP: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${keyName}: AUTENTICADA com sucesso!`);
      
      if (data.result && data.result.list) {
        console.log(`💰 Carteiras encontradas: ${data.result.list.length}`);
        data.result.list.forEach((wallet, index) => {
          console.log(`   ${index + 1}. Tipo: ${wallet.accountType}`);
          if (wallet.coin && wallet.coin.length > 0) {
            const mainCoins = wallet.coin.filter(c => 
              ['USDT', 'BTC', 'ETH', 'USDC'].includes(c.coin) && 
              parseFloat(c.walletBalance) > 0
            );
            if (mainCoins.length > 0) {
              mainCoins.forEach(coin => {
                console.log(`      ${coin.coin}: ${parseFloat(coin.walletBalance).toFixed(8)}`);
              });
            }
          }
        });
      }
      
      return { success: true, latency, data };
    } else {
      const errorData = await response.text();
      console.log(`❌ ${keyName}: FALHOU (${response.status})`);
      console.log(`📝 Resposta: ${errorData}`);
      
      // Analisar erros específicos
      if (response.status === 403) {
        console.log(`🚫 Possível causa: IP ${CONFIG.RAILWAY_IP} não está na whitelist`);
      } else if (response.status === 401) {
        console.log(`🔐 Possível causa: Chave API inválida ou sem permissões`);
      }
      
      return { success: false, status: response.status, error: errorData };
    }
  } catch (error) {
    console.error(`❌ ${keyName} Test Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função principal de teste
async function runTests() {
  console.log('\n🚀 INICIANDO TESTES...\n');
  
  // 1. Verificar IP atual
  const currentIP = await checkCurrentIP();
  
  // 2. Testar conectividade básica
  const connectivity = await testBybitConnectivity();
  
  if (!connectivity) {
    console.log('\n❌ TESTE ABORTADO: Sem conectividade básica com Bybit');
    return;
  }
  
  // 3. Testar chave principal (credentials table)
  const mainKeyResult = await testBybitAPIKey(
    CONFIG.BYBIT_API_KEY, 
    CONFIG.BYBIT_SECRET_KEY, 
    'PRINCIPAL (credentials)'
  );
  
  // 4. Testar chave alternativa (user_api_keys table)
  const altKeyResult = await testBybitAPIKey(
    CONFIG.BYBIT_API_KEY_ALT, 
    CONFIG.BYBIT_SECRET_KEY_ALT, 
    'ALTERNATIVA (user_api_keys)'
  );
  
  // 5. Resumo dos resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  console.log(`🌐 IP Current: ${currentIP || 'N/A'}`);
  console.log(`🎯 IP Railway: ${CONFIG.RAILWAY_IP}`);
  console.log(`🔗 Conectividade Bybit: ${connectivity ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`🔑 Chave Principal: ${mainKeyResult.success ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`🔑 Chave Alternativa: ${altKeyResult.success ? '✅ OK' : '❌ FALHOU'}`);
  
  if (mainKeyResult.success || altKeyResult.success) {
    console.log('\n🎉 SUCESSO: Pelo menos uma chave API está funcionando!');
    console.log('🚀 Sistema pronto para trading automático com Bybit');
    
    if (mainKeyResult.success) {
      console.log(`\n📝 RECOMENDAÇÃO: Usar chave PRINCIPAL`);
      console.log(`   API Key: ${CONFIG.BYBIT_API_KEY.substring(0, 10)}...`);
    } else if (altKeyResult.success) {
      console.log(`\n📝 RECOMENDAÇÃO: Usar chave ALTERNATIVA`);
      console.log(`   API Key: ${CONFIG.BYBIT_API_KEY_ALT.substring(0, 10)}...`);
    }
  } else {
    console.log('\n❌ PROBLEMAS IDENTIFICADOS:');
    if (currentIP !== CONFIG.RAILWAY_IP) {
      console.log(`   🌐 IP não corresponde: ${currentIP} ≠ ${CONFIG.RAILWAY_IP}`);
    }
    console.log(`   🔐 Todas as chaves API falharam na autenticação`);
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    console.log('   1. Verificar se IP Railway está na whitelist da Bybit');
    console.log('   2. Validar permissões das chaves API');
    console.log('   3. Verificar se as chaves não expiraram');
  }
  
  console.log('\n✅ Teste concluído!');
}

// Executar testes
runTests().catch(console.error);
