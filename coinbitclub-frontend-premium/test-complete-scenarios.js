#!/usr/bin/env node

const crypto = require('crypto');

// CENÁRIOS COMPLETOS DE TESTE - IP FIXO RAILWAY
const SCENARIOS = {
  RAILWAY_IP: '132.255.160.140',
  
  // Chaves existentes no banco
  DATABASE_KEYS: [
    {
      name: 'ERICA ANDRADE',
      source: 'user_api_keys',
      api_key: 'dtbi5nXnYURm7uHnxA',
      secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
      exchange: 'bybit',
      environment: 'production'
    },
    {
      name: 'ERICA ANDRADE',
      source: 'credentials (demo)',
      api_key: 'BybitRealKey2025_ERICA_PRODUCTION_API_KEY_COINBITCLUB',
      secret_key: 'BybitRealSecret2025_ERICA_PRODUCTION_SECRET_COINBITCLUB',
      exchange: 'bybit',
      environment: 'production'
    },
    {
      name: 'PALOMA AMARAL',
      source: 'credentials',
      api_key: 'AfFEGdxLuYPnSFaXEJ',
      secret_key: 'kxCAy7yDenRFKKrPVp93hIZhcRNw4FNZknmvRk16Wb',
      exchange: 'bybit',
      environment: 'production'
    },
    {
      name: 'MAURO ALVES',
      source: 'credentials (testnet)',
      api_key: 'JQVNAD0aCqNqPLvo25',
      secret_key: 'rQ1Qle81XBKeL5NRzAzfDLZfnrbZ7wA0dYk',
      exchange: 'bybit',
      environment: 'testnet'
    }
  ],
  
  // Nova chave da imagem (parece ser real)
  NEW_KEYS_FROM_IMAGE: [
    {
      name: 'NOVA CHAVE (da imagem)',
      source: 'interface_bybit',
      api_key: 'WJvYtDnUb3XpUYN',
      secret_key: 'qUDXNmCSUqaqkTUb7PLAZZqsNtHaeBqQ',
      exchange: 'bybit',
      environment: 'production',
      permissions: ['Contratos', 'Orders', 'Posições', 'Trading Unificado', 'Trade', 'Spot', 'Marginals']
    }
  ],
  
  // URLs de teste para diferentes ambientes
  ENDPOINTS: {
    bybit_production: 'https://api.bybit.com',
    bybit_testnet: 'https://api-testnet.bybit.com',
    binance_production: 'https://api.binance.com',
    binance_testnet: 'https://testnet.binance.vision'
  }
};

console.log('🔍 ANÁLISE COMPLETA - TODOS OS CENÁRIOS DE IP FIXO');
console.log('=' .repeat(80));
console.log(`🌐 IP Railway: ${SCENARIOS.RAILWAY_IP}`);
console.log(`📅 Data: ${new Date().toISOString()}`);
console.log('=' .repeat(80));

// Verificar IP atual
async function checkCurrentIP() {
  try {
    console.log('\n🌍 VERIFICANDO IP ATUAL...');
    
    const services = [
      { name: 'ipify.org', url: 'https://api.ipify.org?format=json' },
      { name: 'httpbin.org', url: 'https://httpbin.org/ip' },
      { name: 'icanhazip.com', url: 'https://icanhazip.com' }
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service.url);
        const data = service.url.includes('icanhazip') 
          ? { ip: (await response.text()).trim() }
          : await response.json();
        
        const detectedIP = data.ip || data.origin;
        console.log(`✅ ${service.name}: ${detectedIP}`);
        
        if (detectedIP === SCENARIOS.RAILWAY_IP) {
          console.log(`   🎯 MATCH com Railway!`);
        } else {
          console.log(`   ⚠️  Diferente do Railway (${SCENARIOS.RAILWAY_IP})`);
        }
      } catch (error) {
        console.log(`❌ ${service.name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Erro geral na verificação de IP: ${error.message}`);
  }
}

// Testar conectividade básica
async function testBasicConnectivity() {
  console.log('\n🔌 TESTE DE CONECTIVIDADE BÁSICA...');
  
  const endpoints = [
    { name: 'Bybit Production', url: 'https://api.bybit.com/v5/market/time' },
    { name: 'Bybit Testnet', url: 'https://api-testnet.bybit.com/v5/market/time' },
    { name: 'Binance Production', url: 'https://api.binance.com/api/v3/ping' },
    { name: 'Binance Testnet', url: 'https://testnet.binance.vision/api/v3/ping' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(endpoint.url);
      const latency = Date.now() - start;
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: OK (${latency}ms)`);
      } else {
        console.log(`❌ ${endpoint.name}: ${response.status} (${latency}ms)`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

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

// Testar chave específica
async function testSpecificKey(keyData) {
  try {
    console.log(`\n👤 TESTANDO: ${keyData.name}`);
    console.log(`📊 Fonte: ${keyData.source}`);
    console.log(`🔑 API Key: ${keyData.api_key.substring(0, 8)}...${keyData.api_key.slice(-6)}`);
    console.log(`🔐 Secret: ${keyData.secret_key.substring(0, 6)}...${keyData.secret_key.slice(-6)}`);
    console.log(`🌐 Ambiente: ${keyData.environment.toUpperCase()}`);
    
    if (keyData.permissions) {
      console.log(`🔓 Permissões: ${keyData.permissions.join(', ')}`);
    }
    
    const timestamp = Date.now().toString();
    const signature = generateBybitSignature(keyData.api_key, keyData.secret_key, timestamp, {});
    
    const baseUrl = keyData.environment === 'testnet' 
      ? 'https://api-testnet.bybit.com' 
      : 'https://api.bybit.com';
    
    const headers = {
      'X-BAPI-API-KEY': keyData.api_key,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-RECV-WINDOW': '5000',
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Trading-Bot/2.0',
      'X-Source-IP': SCENARIOS.RAILWAY_IP,
      'X-Railway-Service': 'coinbitclub-market-bot'
    };
    
    // Teste 1: Informações da conta
    console.log(`📡 Testando conta...`);
    const start1 = Date.now();
    const accountResponse = await fetch(
      `${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`,
      { method: 'GET', headers: headers }
    );
    const latency1 = Date.now() - start1;
    
    console.log(`⏱️  Latência: ${latency1}ms`);
    console.log(`📊 Status: ${accountResponse.status}`);
    
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log(`✅ CONTA: Autenticada com sucesso!`);
      
      if (accountData.result && accountData.result.list) {
        console.log(`💰 Carteiras: ${accountData.result.list.length}`);
        accountData.result.list.forEach((wallet, index) => {
          if (wallet.coin && wallet.coin.length > 0) {
            const balances = wallet.coin.filter(c => parseFloat(c.walletBalance) > 0);
            if (balances.length > 0) {
              console.log(`   💳 Carteira ${index + 1} (${wallet.accountType}):`);
              balances.slice(0, 5).forEach(coin => {
                const balance = parseFloat(coin.walletBalance);
                if (balance > 0.001) {
                  console.log(`      ${coin.coin}: ${balance.toFixed(8)}`);
                }
              });
            }
          }
        });
      }
      
      // Teste 2: Posições abertas
      console.log(`📈 Testando posições...`);
      const positionsResponse = await fetch(
        `${baseUrl}/v5/position/list?category=linear`,
        { method: 'GET', headers: headers }
      );
      
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        console.log(`✅ POSIÇÕES: ${positionsData.result?.list?.length || 0} encontradas`);
      }
      
      // Teste 3: Histórico de ordens
      console.log(`📋 Testando histórico...`);
      const ordersResponse = await fetch(
        `${baseUrl}/v5/order/history?category=linear&limit=5`,
        { method: 'GET', headers: headers }
      );
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log(`✅ ORDENS: ${ordersData.result?.list?.length || 0} no histórico`);
      }
      
      return {
        success: true,
        key: keyData.name,
        latency: latency1,
        hasBalance: accountData.result?.list?.some(w => 
          w.coin?.some(c => parseFloat(c.walletBalance) > 0)
        ) || false,
        environment: keyData.environment
      };
      
    } else {
      const errorText = await accountResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.log(`❌ FALHOU: ${accountResponse.status}`);
      console.log(`📝 Erro: ${errorData.retMsg || errorData.message || 'Erro desconhecido'}`);
      
      // Análise do erro
      if (accountResponse.status === 403) {
        console.log(`🚫 ANÁLISE: IP ${SCENARIOS.RAILWAY_IP} provavelmente não está na whitelist`);
      } else if (accountResponse.status === 401) {
        console.log(`🔐 ANÁLISE: Chave inválida, sem permissões ou expirada`);
      } else if (accountResponse.status === 429) {
        console.log(`⏰ ANÁLISE: Rate limit atingido`);
      }
      
      return {
        success: false,
        key: keyData.name,
        status: accountResponse.status,
        error: errorData.retMsg || errorData.message,
        environment: keyData.environment
      };
    }
    
  } catch (error) {
    console.error(`❌ Erro de rede: ${error.message}`);
    return {
      success: false,
      key: keyData.name,
      error: error.message,
      environment: keyData.environment
    };
  }
}

// Função principal
async function runCompleteAnalysis() {
  console.log('\n🚀 INICIANDO ANÁLISE COMPLETA...\n');
  
  // 1. Verificar IP
  await checkCurrentIP();
  
  // 2. Testar conectividade básica
  await testBasicConnectivity();
  
  // 3. Testar todas as chaves
  const allKeys = [
    ...SCENARIOS.DATABASE_KEYS,
    ...SCENARIOS.NEW_KEYS_FROM_IMAGE
  ];
  
  console.log(`\n🔑 TESTANDO ${allKeys.length} CHAVES API...\n`);
  
  const results = [];
  for (const keyData of allKeys) {
    const result = await testSpecificKey(keyData);
    results.push(result);
    
    // Aguardar entre testes para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 4. Análise dos resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANÁLISE FINAL - TODOS OS CENÁRIOS');
  console.log('='.repeat(80));
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`✅ Funcionando: ${working.length}/${results.length}`);
  console.log(`❌ Com problemas: ${failed.length}/${results.length}`);
  
  if (working.length > 0) {
    console.log(`\n🎉 CHAVES FUNCIONAIS ENCONTRADAS:`);
    working.forEach(w => {
      const key = allKeys.find(k => k.name === w.key);
      console.log(`\n✅ ${w.key}`);
      console.log(`   📊 Latência: ${w.latency}ms`);
      console.log(`   🌐 Ambiente: ${w.environment.toUpperCase()}`);
      console.log(`   💰 Tem saldo: ${w.hasBalance ? 'SIM' : 'NÃO'}`);
      console.log(`   🔑 API Key: ${key.api_key}`);
      console.log(`   🔐 Secret: ${key.secret_key.substring(0, 10)}...`);
      console.log(`   📋 Fonte: ${key.source}`);
    });
    
    console.log(`\n💡 RECOMENDAÇÕES:`);
    const prodKeys = working.filter(w => w.environment === 'production');
    const testKeys = working.filter(w => w.environment === 'testnet');
    
    if (prodKeys.length > 0) {
      console.log(`🥇 USAR PARA PRODUÇÃO: ${prodKeys[0].key}`);
      console.log(`   Motivo: Ambiente de produção com autenticação válida`);
    }
    
    if (testKeys.length > 0) {
      console.log(`🧪 USAR PARA TESTES: ${testKeys[0].key}`);
      console.log(`   Motivo: Ambiente de teste para desenvolvimento`);
    }
    
  } else {
    console.log(`\n❌ PROBLEMAS IDENTIFICADOS:`);
    
    // Análise por tipo de erro
    const ipErrors = failed.filter(f => f.status === 403);
    const authErrors = failed.filter(f => f.status === 401);
    const networkErrors = failed.filter(f => f.error && !f.status);
    
    if (ipErrors.length > 0) {
      console.log(`🚫 Erros de IP (403): ${ipErrors.length}`);
      console.log(`   Solução: Adicionar ${SCENARIOS.RAILWAY_IP} na whitelist das exchanges`);
    }
    
    if (authErrors.length > 0) {
      console.log(`🔐 Erros de autenticação (401): ${authErrors.length}`);
      console.log(`   Solução: Verificar validade e permissões das chaves API`);
    }
    
    if (networkErrors.length > 0) {
      console.log(`🌐 Erros de rede: ${networkErrors.length}`);
      console.log(`   Solução: Verificar conectividade e DNS`);
    }
  }
  
  console.log(`\n🎯 PRÓXIMOS PASSOS:`);
  console.log(`1. Configurar chaves funcionais no sistema`);
  console.log(`2. Adicionar IP ${SCENARIOS.RAILWAY_IP} nas whitelists`);
  console.log(`3. Implementar monitoramento contínuo`);
  console.log(`4. Configurar alertas de falha`);
  
  console.log('\n✅ Análise completa finalizada!');
}

// Executar análise
runCompleteAnalysis().catch(console.error);
