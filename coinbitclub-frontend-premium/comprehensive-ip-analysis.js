#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔍 MAPEAMENTO COMPLETO - CENÁRIOS IP FIXO EXCHANGES');
console.log('=' .repeat(80));
console.log('📅 Data:', new Date().toISOString());
console.log('🌐 IP Railway Target:', '132.255.160.140');
console.log('=' .repeat(80));

// Configurações de teste para diferentes cenários
const TEST_SCENARIOS = {
  // Cenário 1: Chaves sem IP whitelist (baseline)
  NO_IP_RESTRICTION: {
    name: 'SEM RESTRIÇÃO IP',
    description: 'Chaves que funcionam sem whitelist IP',
    users: [
      {
        name: 'PALOMA AMARAL',
        exchange: 'bybit',
        environment: 'production',
        api_key: 'AfFEGdxLuYPnSFaXEJ',
        secret_key: 'kxCAy7yDenRFKKrPVp93hIZhcRNw4FNZknmvRk16Wb',
        has_ip_whitelist: false
      }
    ]
  },
  
  // Cenário 2: Chaves com possível IP whitelist
  POTENTIAL_IP_RESTRICTED: {
    name: 'POSSÍVEL RESTRIÇÃO IP',
    description: 'Chaves que podem ter whitelist configurado',
    users: [
      {
        name: 'ERICA ANDRADE',
        exchange: 'bybit',
        environment: 'production',
        api_key: 'dtbi5nXnYURm7uHnxA',
        secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
        has_ip_whitelist: true
      }
    ]
  },
  
  // Cenário 3: Ambiente testnet
  TESTNET_ENVIRONMENT: {
    name: 'AMBIENTE TESTNET',
    description: 'Testes em ambiente de teste',
    users: [
      {
        name: 'MAURO ALVES',
        exchange: 'bybit',
        environment: 'testnet',
        api_key: 'JQVNAD0aCqNqPLvo25',
        secret_key: 'rQ1Qle81XBKeL5NRzAzfDLZfnrbZ7wA0dYk',
        has_ip_whitelist: false
      }
    ]
  }
};

// URLs das exchanges para diferentes ambientes
const EXCHANGE_URLS = {
  bybit: {
    production: 'https://api.bybit.com',
    testnet: 'https://api-testnet.bybit.com'
  },
  binance: {
    production: 'https://api.binance.com',
    testnet: 'https://testnet.binance.vision'
  }
};

// Endpoints de teste para cada exchange
const TEST_ENDPOINTS = {
  bybit: {
    public: '/v5/market/time',
    account: '/v5/account/wallet-balance?accountType=UNIFIED',
    positions: '/v5/position/list',
    balance: '/v5/account/wallet-balance'
  },
  binance: {
    public: '/api/v3/ping',
    account: '/api/v3/account',
    balance: '/api/v3/account',
    futures: '/fapi/v1/account'
  }
};

// Função para verificar IP atual de múltiplas fontes
async function checkCurrentIPFromMultipleSources() {
  console.log('\n🌐 VERIFICAÇÃO DE IP - MÚLTIPLAS FONTES');
  console.log('-'.repeat(50));
  
  const ipSources = [
    { name: 'ipify.org', url: 'https://api.ipify.org?format=json', field: 'ip' },
    { name: 'httpbin.org', url: 'https://httpbin.org/ip', field: 'origin' },
    { name: 'icanhazip.com', url: 'https://icanhazip.com/', field: null },
    { name: 'ipecho.net', url: 'https://ipecho.net/plain', field: null }
  ];
  
  const results = [];
  
  for (const source of ipSources) {
    try {
      console.log(`📡 Consultando ${source.name}...`);
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'CoinBitClub-Railway-IPCheck/1.0'
        }
      });
      
      if (response.ok) {
        const data = source.field ? await response.json() : await response.text();
        const ip = source.field ? data[source.field] : data.trim();
        
        console.log(`✅ ${source.name}: ${ip}`);
        results.push({ source: source.name, ip, success: true });
      } else {
        console.log(`❌ ${source.name}: HTTP ${response.status}`);
        results.push({ source: source.name, error: response.status, success: false });
      }
    } catch (error) {
      console.log(`❌ ${source.name}: ${error.message}`);
      results.push({ source: source.name, error: error.message, success: false });
    }
  }
  
  // Análise de consistência
  const successfulResults = results.filter(r => r.success);
  const uniqueIPs = [...new Set(successfulResults.map(r => r.ip))];
  
  console.log('\n📊 ANÁLISE DE CONSISTÊNCIA:');
  console.log(`✅ Fontes funcionais: ${successfulResults.length}/${ipSources.length}`);
  console.log(`🔍 IPs únicos detectados: ${uniqueIPs.length}`);
  
  if (uniqueIPs.length === 1) {
    console.log(`✅ IP CONSISTENTE: ${uniqueIPs[0]}`);
    return uniqueIPs[0];
  } else if (uniqueIPs.length > 1) {
    console.log(`⚠️  IPs INCONSISTENTES: ${uniqueIPs.join(', ')}`);
    return uniqueIPs[0]; // Retorna o primeiro
  } else {
    console.log(`❌ FALHA: Nenhum IP detectado`);
    return null;
  }
}

// Função para testar conectividade pública das exchanges
async function testPublicConnectivity() {
  console.log('\n🔗 TESTE DE CONECTIVIDADE PÚBLICA');
  console.log('-'.repeat(50));
  
  const publicTests = [
    { exchange: 'bybit', env: 'production', url: EXCHANGE_URLS.bybit.production + TEST_ENDPOINTS.bybit.public },
    { exchange: 'bybit', env: 'testnet', url: EXCHANGE_URLS.bybit.testnet + TEST_ENDPOINTS.bybit.public },
    { exchange: 'binance', env: 'production', url: EXCHANGE_URLS.binance.production + TEST_ENDPOINTS.binance.public },
    { exchange: 'binance', env: 'testnet', url: EXCHANGE_URLS.binance.testnet + TEST_ENDPOINTS.binance.public }
  ];
  
  const results = [];
  
  for (const test of publicTests) {
    try {
      console.log(`📡 Testando ${test.exchange} (${test.env})...`);
      const start = Date.now();
      const response = await fetch(test.url, {
        headers: {
          'User-Agent': 'CoinBitClub-Railway/1.0',
          'Accept': 'application/json'
        }
      });
      const latency = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.exchange} (${test.env}): OK (${latency}ms)`);
        results.push({ ...test, success: true, latency, data });
      } else {
        console.log(`❌ ${test.exchange} (${test.env}): HTTP ${response.status}`);
        results.push({ ...test, success: false, status: response.status });
      }
    } catch (error) {
      console.log(`❌ ${test.exchange} (${test.env}): ${error.message}`);
      results.push({ ...test, success: false, error: error.message });
    }
  }
  
  return results;
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

// Função para gerar assinatura Binance
function generateBinanceSignature(apiSecret, queryString) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

// Função para testar autenticação com diferentes estratégias de IP
async function testAuthenticationStrategies(user, currentIP) {
  console.log(`\n🔐 TESTE DE AUTENTICAÇÃO: ${user.name}`);
  console.log('-'.repeat(50));
  console.log(`🏢 Exchange: ${user.exchange}`);
  console.log(`🌐 Ambiente: ${user.environment}`);
  console.log(`🔑 API Key: ${user.api_key.substring(0, 8)}...${user.api_key.slice(-4)}`);
  
  const baseUrl = EXCHANGE_URLS[user.exchange][user.environment];
  const endpoint = TEST_ENDPOINTS[user.exchange].account;
  
  // Estratégias de headers para identificação de IP
  const strategies = [
    {
      name: 'STRATEGY_1_BASIC',
      description: 'Headers básicos apenas',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Railway/1.0'
      }
    },
    {
      name: 'STRATEGY_2_IP_FORWARD',
      description: 'IP forwarding headers',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Railway/1.0',
        'X-Forwarded-For': '132.255.160.140',
        'X-Real-IP': '132.255.160.140'
      }
    },
    {
      name: 'STRATEGY_3_CUSTOM_HEADERS',
      description: 'Headers customizados de identificação',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Railway/1.0',
        'X-Source-IP': '132.255.160.140',
        'X-Railway-Service': 'coinbitclub-market-bot',
        'X-Origin-IP': currentIP
      }
    },
    {
      name: 'STRATEGY_4_FULL_DISCLOSURE',
      description: 'Divulgação completa de IPs',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Railway/1.0',
        'X-Forwarded-For': '132.255.160.140',
        'X-Real-IP': '132.255.160.140',
        'X-Source-IP': '132.255.160.140',
        'X-Railway-Service': 'coinbitclub-market-bot',
        'X-Origin-IP': currentIP,
        'CF-Connecting-IP': '132.255.160.140'
      }
    }
  ];
  
  const results = [];
  
  for (const strategy of strategies) {
    try {
      console.log(`\n🧪 Testando ${strategy.name}:`);
      console.log(`   📝 ${strategy.description}`);
      
      const timestamp = Date.now().toString();
      let signature, authHeaders;
      
      if (user.exchange === 'bybit') {
        signature = generateBybitSignature(user.api_key, user.secret_key, timestamp, {});
        authHeaders = {
          'X-BAPI-API-KEY': user.api_key,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-SIGN-TYPE': '2',
          'X-BAPI-RECV-WINDOW': '5000'
        };
      } else if (user.exchange === 'binance') {
        const queryString = `timestamp=${timestamp}`;
        signature = generateBinanceSignature(user.secret_key, queryString);
        authHeaders = {
          'X-MBX-APIKEY': user.api_key
        };
      }
      
      const finalHeaders = { ...strategy.headers, ...authHeaders };
      
      console.log(`   📡 Headers enviados: ${Object.keys(finalHeaders).length} headers`);
      
      const start = Date.now();
      const url = user.exchange === 'binance' 
        ? `${baseUrl}${endpoint}?timestamp=${timestamp}&signature=${signature}`
        : `${baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: finalHeaders
      });
      
      const latency = Date.now() - start;
      
      console.log(`   ⏱️  Latência: ${latency}ms`);
      console.log(`   📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCESSO: Autenticação realizada!`);
        
        // Análise da resposta para extrair informações úteis
        if (user.exchange === 'bybit' && data.result) {
          if (data.result.list && data.result.list.length > 0) {
            console.log(`   💰 Carteiras detectadas: ${data.result.list.length}`);
          }
        } else if (user.exchange === 'binance' && data.balances) {
          const nonZeroBalances = data.balances.filter(b => parseFloat(b.free) > 0);
          console.log(`   💰 Ativos com saldo: ${nonZeroBalances.length}`);
        }
        
        results.push({
          strategy: strategy.name,
          user: user.name,
          success: true,
          latency,
          status: response.status,
          hasData: !!data
        });
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FALHA: HTTP ${response.status}`);
        
        // Análise específica de erros
        if (response.status === 401) {
          console.log(`   🔐 Erro de autenticação: Chave inválida ou sem permissões`);
        } else if (response.status === 403) {
          console.log(`   🚫 Erro de autorização: Possível restrição de IP`);
        } else if (response.status === 429) {
          console.log(`   ⏰ Rate limit: Muitas requisições`);
        }
        
        results.push({
          strategy: strategy.name,
          user: user.name,
          success: false,
          status: response.status,
          error: errorText
        });
      }
      
      // Pausa entre estratégias para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ ERRO DE REDE: ${error.message}`);
      results.push({
        strategy: strategy.name,
        user: user.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Função para testar diferentes endpoints
async function testMultipleEndpoints(user, currentIP, workingStrategy) {
  if (!workingStrategy) return [];
  
  console.log(`\n🎯 TESTE DE MÚLTIPLOS ENDPOINTS: ${user.name}`);
  console.log('-'.repeat(50));
  
  const baseUrl = EXCHANGE_URLS[user.exchange][user.environment];
  const endpoints = TEST_ENDPOINTS[user.exchange];
  
  const results = [];
  
  for (const [endpointName, endpointPath] of Object.entries(endpoints)) {
    if (endpointName === 'public') continue; // Pular endpoints públicos
    
    try {
      console.log(`📡 Testando endpoint: ${endpointName}`);
      
      const timestamp = Date.now().toString();
      let signature, authHeaders, url;
      
      if (user.exchange === 'bybit') {
        signature = generateBybitSignature(user.api_key, user.secret_key, timestamp, {});
        authHeaders = {
          'X-BAPI-API-KEY': user.api_key,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-SIGN-TYPE': '2',
          'X-BAPI-RECV-WINDOW': '5000'
        };
        url = `${baseUrl}${endpointPath}`;
      } else if (user.exchange === 'binance') {
        const queryString = `timestamp=${timestamp}`;
        signature = generateBinanceSignature(user.secret_key, queryString);
        authHeaders = {
          'X-MBX-APIKEY': user.api_key
        };
        url = `${baseUrl}${endpointPath}?timestamp=${timestamp}&signature=${signature}`;
      }
      
      const finalHeaders = { ...workingStrategy.headers, ...authHeaders };
      
      const start = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: finalHeaders
      });
      const latency = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpointName}: OK (${latency}ms)`);
        results.push({
          endpoint: endpointName,
          success: true,
          latency,
          dataReceived: !!data
        });
      } else {
        console.log(`❌ ${endpointName}: HTTP ${response.status}`);
        results.push({
          endpoint: endpointName,
          success: false,
          status: response.status
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`❌ ${endpointName}: ${error.message}`);
      results.push({
        endpoint: endpointName,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Função principal de análise
async function runComprehensiveAnalysis() {
  console.log('\n🚀 INICIANDO ANÁLISE ABRANGENTE...\n');
  
  // 1. Verificação de IP
  const currentIP = await checkCurrentIPFromMultipleSources();
  
  // 2. Teste de conectividade pública
  const publicResults = await testPublicConnectivity();
  
  // 3. Análise de cada cenário
  const allAuthResults = [];
  const allEndpointResults = [];
  
  for (const [scenarioKey, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(`\n📋 CENÁRIO: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log('='.repeat(60));
    
    for (const user of scenario.users) {
      // Teste de autenticação com diferentes estratégias
      const authResults = await testAuthenticationStrategies(user, currentIP);
      allAuthResults.push(...authResults);
      
      // Se alguma estratégia funcionou, testar múltiplos endpoints
      const workingStrategy = authResults.find(r => r.success);
      if (workingStrategy) {
        const endpointResults = await testMultipleEndpoints(user, currentIP, workingStrategy);
        allEndpointResults.push(...endpointResults.map(r => ({ ...r, user: user.name })));
      }
    }
  }
  
  // 4. Relatório final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL - ANÁLISE COMPLETA');
  console.log('='.repeat(80));
  
  console.log(`\n🌐 IP ATUAL: ${currentIP || 'NÃO DETECTADO'}`);
  console.log(`🎯 IP RAILWAY TARGET: 132.255.160.140`);
  console.log(`✅ IP MATCH: ${currentIP === '132.255.160.140' ? 'SIM' : 'NÃO'}`);
  
  console.log('\n🔗 CONECTIVIDADE PÚBLICA:');
  publicResults.forEach(result => {
    const status = result.success ? `✅ OK (${result.latency}ms)` : '❌ FALHOU';
    console.log(`   ${result.exchange} (${result.env}): ${status}`);
  });
  
  console.log('\n🔐 AUTENTICAÇÃO - RESUMO POR USUÁRIO:');
  const userResults = {};
  allAuthResults.forEach(result => {
    if (!userResults[result.user]) {
      userResults[result.user] = { working: [], failed: [] };
    }
    if (result.success) {
      userResults[result.user].working.push(result.strategy);
    } else {
      userResults[result.user].failed.push(result.strategy);
    }
  });
  
  for (const [user, results] of Object.entries(userResults)) {
    console.log(`\n👤 ${user}:`);
    console.log(`   ✅ Estratégias funcionais: ${results.working.length}/4`);
    console.log(`   ❌ Estratégias falharam: ${results.failed.length}/4`);
    if (results.working.length > 0) {
      console.log(`   🎯 Melhores estratégias: ${results.working.join(', ')}`);
    }
  }
  
  console.log('\n🎯 ENDPOINTS FUNCIONAIS:');
  if (allEndpointResults.length > 0) {
    allEndpointResults.forEach(result => {
      const status = result.success ? `✅ OK (${result.latency}ms)` : '❌ FALHOU';
      console.log(`   ${result.user} - ${result.endpoint}: ${status}`);
    });
  } else {
    console.log('   ❌ Nenhum endpoint autenticado funcionou');
  }
  
  // 5. Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  
  const workingUsers = Object.keys(userResults).filter(user => userResults[user].working.length > 0);
  
  if (workingUsers.length > 0) {
    console.log('✅ SUCESSO: Encontramos configurações funcionais!');
    workingUsers.forEach(user => {
      const userConfig = Object.values(TEST_SCENARIOS)
        .flatMap(s => s.users)
        .find(u => u.name === user);
      console.log(`\n📋 CONFIGURAÇÃO RECOMENDADA - ${user}:`);
      console.log(`   Exchange: ${userConfig.exchange}`);
      console.log(`   Ambiente: ${userConfig.environment}`);
      console.log(`   API Key: ${userConfig.api_key}`);
      console.log(`   Secret: ${userConfig.secret_key.substring(0, 10)}...`);
      console.log(`   Estratégias: ${userResults[user].working.join(', ')}`);
    });
  } else {
    console.log('❌ NENHUMA CONFIGURAÇÃO FUNCIONOU');
    console.log('🔧 AÇÕES NECESSÁRIAS:');
    console.log('   1. Verificar whitelist IP nas exchanges');
    console.log('   2. Validar permissões das chaves API');
    console.log('   3. Confirmar que as chaves são reais (não demo)');
    console.log('   4. Verificar se as chaves não expiraram');
  }
  
  console.log('\n✅ ANÁLISE COMPLETA FINALIZADA!');
  
  return {
    currentIP,
    publicResults,
    authResults: allAuthResults,
    endpointResults: allEndpointResults,
    workingUsers
  };
}

// Executar análise completa
runComprehensiveAnalysis().catch(console.error);
