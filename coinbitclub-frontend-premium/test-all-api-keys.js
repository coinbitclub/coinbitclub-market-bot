#!/usr/bin/env node

const crypto = require('crypto');

// Configurações de diferentes usuários para teste
const USERS = [
  {
    name: 'ERICA ANDRADE',
    api_key: 'dtbi5nXnYURm7uHnxA',
    secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
    source: 'user_api_keys'
  },
  {
    name: 'PALOMA AMARAL',
    api_key: 'AfFEGdxLuYPnSFaXEJ',
    secret_key: 'kxCAy7yDenRFKKrPVp93hIZhcRNw4FNZknmvRk16Wb',
    source: 'credentials'
  },
  {
    name: 'MAURO ALVES (TESTNET)',
    api_key: 'JQVNAD0aCqNqPLvo25',
    secret_key: 'rQ1Qle81XBKeL5NRzAzfDLZfnrbZ7wA0dYk',
    source: 'credentials',
    isTestnet: true
  }
];

const RAILWAY_IP = '132.255.160.140';

console.log('🔍 TESTE COMPARATIVO DE CHAVES API - MÚLTIPLOS USUÁRIOS');
console.log('=' .repeat(70));

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

// Função para testar uma chave específica
async function testSingleKey(user) {
  try {
    console.log(`\n👤 TESTANDO: ${user.name}`);
    console.log(`📊 Fonte: ${user.source}`);
    console.log(`🔑 API Key: ${user.api_key.substring(0, 8)}...${user.api_key.slice(-4)}`);
    console.log(`🔐 Secret: ${user.secret_key.substring(0, 6)}...${user.secret_key.slice(-6)}`);
    
    const timestamp = Date.now().toString();
    const signature = generateBybitSignature(user.api_key, user.secret_key, timestamp, {});
    
    const baseUrl = user.isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
    const endpoint = '/v5/account/wallet-balance?accountType=UNIFIED';
    
    const headers = {
      'X-BAPI-API-KEY': user.api_key,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-RECV-WINDOW': '5000',
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Bot/1.0',
      'X-Source-IP': RAILWAY_IP
    };
    
    console.log(`🌐 URL: ${baseUrl}${endpoint}`);
    console.log(`📡 Environment: ${user.isTestnet ? 'TESTNET' : 'PRODUCTION'}`);
    
    const start = Date.now();
    const response = await fetch(baseUrl + endpoint, {
      method: 'GET',
      headers: headers
    });
    const latency = Date.now() - start;
    
    console.log(`⏱️  Latência: ${latency}ms`);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCESSO: Chave autenticada!`);
      
      if (data.result && data.result.list) {
        console.log(`💰 Carteiras: ${data.result.list.length}`);
        data.result.list.forEach((wallet, index) => {
          if (wallet.coin && wallet.coin.length > 0) {
            const balances = wallet.coin.filter(c => parseFloat(c.walletBalance) > 0);
            if (balances.length > 0) {
              console.log(`   Carteira ${index + 1} (${wallet.accountType}):`);
              balances.slice(0, 3).forEach(coin => {
                console.log(`      ${coin.coin}: ${parseFloat(coin.walletBalance).toFixed(8)}`);
              });
            }
          }
        });
      }
      
      return { success: true, user: user.name, latency };
    } else {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.log(`❌ FALHOU: ${response.status}`);
      console.log(`📝 Erro: ${errorData.retMsg || errorData.message || 'Erro desconhecido'}`);
      
      return { success: false, user: user.name, status: response.status, error: errorData };
    }
  } catch (error) {
    console.error(`❌ Erro de rede: ${error.message}`);
    return { success: false, user: user.name, error: error.message };
  }
}

// Função principal
async function runComparison() {
  console.log('\n🚀 Iniciando testes comparativos...\n');
  
  const results = [];
  
  for (const user of USERS) {
    const result = await testSingleKey(user);
    results.push(result);
    
    // Aguardar um pouco entre os testes para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO COMPARATIVO');
  console.log('='.repeat(70));
  
  results.forEach(result => {
    const status = result.success ? '✅ FUNCIONANDO' : '❌ FALHOU';
    const extra = result.success ? `(${result.latency}ms)` : `(${result.status || 'erro'})`;
    console.log(`${status} - ${result.user} ${extra}`);
  });
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('\n📈 ESTATÍSTICAS:');
  console.log(`✅ Funcionando: ${working.length}/${results.length}`);
  console.log(`❌ Com problemas: ${failed.length}/${results.length}`);
  
  if (working.length > 0) {
    console.log('\n🎉 SUCESSO: Encontramos chaves funcionais!');
    console.log('💡 RECOMENDAÇÃO: Usar as chaves que funcionaram para configurar o sistema');
    
    working.forEach(w => {
      const user = USERS.find(u => u.name === w.user);
      console.log(`\n📋 ${w.user}:`);
      console.log(`   API Key: ${user.api_key}`);
      console.log(`   Secret: ${user.secret_key.substring(0, 10)}...`);
      console.log(`   Ambiente: ${user.isTestnet ? 'TESTNET' : 'PRODUCTION'}`);
    });
  } else {
    console.log('\n⚠️  PROBLEMA: Nenhuma chave API funcionou');
    console.log('🔧 POSSÍVEIS CAUSAS:');
    console.log('   1. IP Railway não está nas whitelists das exchanges');
    console.log('   2. Chaves API são de teste/demo (não reais)');
    console.log('   3. Permissões insuficientes nas chaves');
    console.log('   4. Chaves expiraram');
  }
  
  console.log('\n✅ Análise concluída!');
}

// Executar análise
runComparison().catch(console.error);
