#!/usr/bin/env node

const crypto = require('crypto');

// Configuração da chave funcional identificada
const WORKING_CONFIG = {
  name: 'PALOMA AMARAL',
  api_key: 'AfFEGdxLuYPnSFaXEJ',
  secret_key: 'kxCAy7yDenRFKKrPVp93hIZhcRNw4FNZknmvRk16Wb',
  railway_ip: '132.255.160.140',
  base_url: 'https://api.bybit.com'
};

console.log('🎯 TESTE FINAL - VALIDAÇÃO COMPLETA PARA TRADING');
console.log('=' .repeat(70));
console.log(`👤 Usuária: ${WORKING_CONFIG.name}`);
console.log(`🔑 API Key: ${WORKING_CONFIG.api_key.substring(0, 8)}...${WORKING_CONFIG.api_key.slice(-6)}`);
console.log(`🌐 IP Railway: ${WORKING_CONFIG.railway_ip}`);
console.log('=' .repeat(70));

// Gerar assinatura Bybit
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

// Função para fazer requisições autenticadas
async function makeAuthenticatedRequest(endpoint, params = {}) {
  const timestamp = Date.now().toString();
  const signature = generateBybitSignature(
    WORKING_CONFIG.api_key, 
    WORKING_CONFIG.secret_key, 
    timestamp, 
    params
  );
  
  const headers = {
    'X-BAPI-API-KEY': WORKING_CONFIG.api_key,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-SIGN': signature,
    'X-BAPI-SIGN-TYPE': '2',
    'X-BAPI-RECV-WINDOW': '5000',
    'Content-Type': 'application/json',
    'User-Agent': 'CoinBitClub-Trading-System/1.0',
    'X-Source-IP': WORKING_CONFIG.railway_ip
  };
  
  const queryString = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const url = `${WORKING_CONFIG.base_url}${endpoint}${queryString ? '?' + queryString : ''}`;
  
  const start = Date.now();
  const response = await fetch(url, { method: 'GET', headers });
  const latency = Date.now() - start;
  
  return { response, latency };
}

// Teste 1: Informações da conta
async function testAccountInfo() {
  try {
    console.log('\n1️⃣ TESTE: Informações da Conta');
    
    const { response, latency } = await makeAuthenticatedRequest('/v5/account/wallet-balance', {
      accountType: 'UNIFIED'
    });
    
    console.log(`   ⏱️  Latência: ${latency}ms`);
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Sucesso: Conta acessível`);
      
      if (data.result?.list) {
        console.log(`   💰 Carteiras: ${data.result.list.length}`);
        data.result.list.forEach((wallet, index) => {
          console.log(`      Carteira ${index + 1}: ${wallet.accountType}`);
          if (wallet.coin) {
            const balances = wallet.coin.filter(c => parseFloat(c.walletBalance) > 0.001);
            if (balances.length > 0) {
              balances.slice(0, 3).forEach(coin => {
                console.log(`         ${coin.coin}: ${parseFloat(coin.walletBalance).toFixed(8)}`);
              });
            } else {
              console.log(`         Sem saldos significativos`);
            }
          }
        });
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ Falha: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

// Teste 2: Informações de instrumentos (mercado)
async function testInstrumentInfo() {
  try {
    console.log('\n2️⃣ TESTE: Informações de Instrumentos');
    
    const { response, latency } = await makeAuthenticatedRequest('/v5/market/instruments-info', {
      category: 'linear',
      symbol: 'BTCUSDT'
    });
    
    console.log(`   ⏱️  Latência: ${latency}ms`);
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Sucesso: Dados de mercado acessíveis`);
      
      if (data.result?.list && data.result.list.length > 0) {
        const btc = data.result.list[0];
        console.log(`   📈 BTCUSDT Informações:`);
        console.log(`      Status: ${btc.status}`);
        console.log(`      Lot Size: ${btc.lotSizeFilter?.minOrderQty || 'N/A'}`);
        console.log(`      Price Scale: ${btc.priceScale || 'N/A'}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ Falha: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

// Teste 3: Posições ativas
async function testPositions() {
  try {
    console.log('\n3️⃣ TESTE: Posições Ativas');
    
    const { response, latency } = await makeAuthenticatedRequest('/v5/position/list', {
      category: 'linear'
    });
    
    console.log(`   ⏱️  Latência: ${latency}ms`);
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Sucesso: Posições acessíveis`);
      console.log(`   📊 Posições encontradas: ${data.result?.list?.length || 0}`);
      
      if (data.result?.list && data.result.list.length > 0) {
        data.result.list.forEach((position, index) => {
          console.log(`      Posição ${index + 1}: ${position.symbol} - ${position.side}`);
          console.log(`         Size: ${position.size}`);
          console.log(`         Value: ${position.positionValue}`);
        });
      } else {
        console.log(`      Nenhuma posição ativa encontrada`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ Falha: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

// Teste 4: Histórico de ordens
async function testOrderHistory() {
  try {
    console.log('\n4️⃣ TESTE: Histórico de Ordens');
    
    const { response, latency } = await makeAuthenticatedRequest('/v5/order/history', {
      category: 'linear',
      limit: 5
    });
    
    console.log(`   ⏱️  Latência: ${latency}ms`);
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Sucesso: Histórico acessível`);
      console.log(`   📊 Ordens encontradas: ${data.result?.list?.length || 0}`);
      
      if (data.result?.list && data.result.list.length > 0) {
        data.result.list.slice(0, 3).forEach((order, index) => {
          console.log(`      Ordem ${index + 1}: ${order.symbol} - ${order.side}`);
          console.log(`         Status: ${order.orderStatus}`);
          console.log(`         Qty: ${order.qty}`);
          console.log(`         Price: ${order.price}`);
        });
      } else {
        console.log(`      Nenhuma ordem no histórico`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ Falha: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

// Teste 5: Ticker de preços (público)
async function testTickerPrice() {
  try {
    console.log('\n5️⃣ TESTE: Preços de Mercado (Público)');
    
    const response = await fetch(`${WORKING_CONFIG.base_url}/v5/market/tickers?category=linear&symbol=BTCUSDT`);
    const latency = 200; // Estimativa
    
    console.log(`   ⏱️  Latência: ~${latency}ms`);
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Sucesso: Dados públicos acessíveis`);
      
      if (data.result?.list && data.result.list.length > 0) {
        const ticker = data.result.list[0];
        console.log(`   📈 BTCUSDT:`);
        console.log(`      Preço: $${parseFloat(ticker.lastPrice).toLocaleString()}`);
        console.log(`      24h Change: ${ticker.price24hPcnt}%`);
        console.log(`      Volume 24h: ${parseFloat(ticker.volume24h).toLocaleString()}`);
      }
      return true;
    } else {
      console.log(`   ❌ Falha: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

// Função principal
async function runFinalValidation() {
  console.log('\n🚀 INICIANDO VALIDAÇÃO FINAL...\n');
  
  const tests = [
    { name: 'Informações da Conta', func: testAccountInfo },
    { name: 'Informações de Instrumentos', func: testInstrumentInfo },
    { name: 'Posições Ativas', func: testPositions },
    { name: 'Histórico de Ordens', func: testOrderHistory },
    { name: 'Preços de Mercado', func: testTickerPrice }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const success = await test.func();
    results.push({ name: test.name, success });
    
    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumo final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA VALIDAÇÃO FINAL');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`✅ Testes aprovados: ${successful.length}/${results.length}`);
  console.log(`❌ Testes falharam: ${failed.length}/${results.length}`);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  if (successful.length >= 4) {
    console.log(`\n🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`🚀 Sistema pronto para trading automático`);
    console.log(`\n📋 CONFIGURAÇÃO FINAL RECOMENDADA:`);
    console.log(`BYBIT_API_KEY=${WORKING_CONFIG.api_key}`);
    console.log(`BYBIT_SECRET_KEY=${WORKING_CONFIG.secret_key.substring(0, 10)}...`);
    console.log(`RAILWAY_IP=${WORKING_CONFIG.railway_ip}`);
    console.log(`TRADING_ENABLED=true`);
  } else {
    console.log(`\n⚠️  VALIDAÇÃO PARCIAL`);
    console.log(`🔧 Sistema precisa de ajustes antes do trading`);
    console.log(`\n🔍 PROBLEMAS IDENTIFICADOS:`);
    failed.forEach(f => console.log(`   ❌ ${f.name}`));
  }
  
  console.log('\n✅ Validação finalizada!');
}

// Executar validação
runFinalValidation().catch(console.error);
