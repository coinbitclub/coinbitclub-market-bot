// 🧪 TESTE DE INTEGRAÇÃO EXTERNA - APIs TERCEIROS
// Verificação de conectividade com OpenAI, Binance, Bybit e Stripe

const axios = require('axios');
const crypto = require('crypto');

console.log('🌐 INICIANDO TESTE DE INTEGRAÇÕES EXTERNAS');
console.log('=' .repeat(60));
console.log('⏰ Início:', new Date().toISOString());
console.log('');

// ===== CONFIGURAÇÕES DE TESTE =====

const testConfig = {
  timeout: 10000, // 10 segundos
  retries: 3,
  apis: {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      testEndpoint: '/models',
      requiresAuth: true,
      envVar: 'OPENAI_API_KEY'
    },
    binance: {
      name: 'Binance',
      baseUrl: 'https://api.binance.com',
      testEndpoint: '/api/v3/ping',
      requiresAuth: false,
      envVar: 'BINANCE_API_KEY'
    },
    bybit: {
      name: 'Bybit',
      baseUrl: 'https://api.bybit.com',
      testEndpoint: '/v2/public/time',
      requiresAuth: false,
      envVar: 'BYBIT_API_KEY'
    },
    stripe: {
      name: 'Stripe',
      baseUrl: 'https://api.stripe.com/v1',
      testEndpoint: '/account',
      requiresAuth: true,
      envVar: 'STRIPE_SECRET_KEY'
    }
  }
};

// ===== FUNÇÕES DE TESTE =====

async function testAPIConnectivity(apiName, config) {
  console.log(`🔍 Testando ${config.name}...`);
  
  const result = {
    name: config.name,
    status: 'unknown',
    response_time: 0,
    error: null,
    details: {}
  };
  
  try {
    const startTime = Date.now();
    
    // Configurar headers baseado na API
    const headers = {
      'User-Agent': 'CoinBitClub-Market-Bot/3.0.0',
      'Accept': 'application/json'
    };
    
    // Adicionar autenticação se necessária
    if (config.requiresAuth) {
      const apiKey = process.env[config.envVar];
      
      if (!apiKey) {
        result.status = 'missing_key';
        result.error = `Variável ${config.envVar} não configurada`;
        console.log(`   ⚠️  ${config.name}: Chave API não configurada`);
        return result;
      }
      
      if (apiName === 'openai') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (apiName === 'stripe') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }
    
    // Fazer requisição
    const response = await axios({
      method: 'GET',
      url: config.baseUrl + config.testEndpoint,
      headers,
      timeout: testConfig.timeout,
      validateStatus: (status) => status < 500 // Aceitar até 4xx como válido
    });
    
    const endTime = Date.now();
    result.response_time = endTime - startTime;
    
    // Analisar resposta
    if (response.status >= 200 && response.status < 300) {
      result.status = 'success';
      result.details = {
        status_code: response.status,
        response_size: JSON.stringify(response.data).length,
        headers: Object.keys(response.headers).length
      };
      
      console.log(`   ✅ ${config.name}: Conectado (${result.response_time}ms)`);
      console.log(`      Status: ${response.status}, Tamanho: ${result.details.response_size} bytes`);
      
    } else if (response.status === 401) {
      result.status = 'auth_error';
      result.error = 'Erro de autenticação - verifique a chave API';
      console.log(`   🔑 ${config.name}: Erro de autenticação (${response.status})`);
      
    } else if (response.status === 403) {
      result.status = 'permission_error';
      result.error = 'Erro de permissão - chave API sem acesso';
      console.log(`   🚫 ${config.name}: Erro de permissão (${response.status})`);
      
    } else {
      result.status = 'error';
      result.error = `HTTP ${response.status}`;
      console.log(`   ❌ ${config.name}: Erro HTTP ${response.status}`);
    }
    
  } catch (error) {
    result.status = 'error';
    result.response_time = Date.now() - (Date.now() - testConfig.timeout);
    
    if (error.code === 'ENOTFOUND') {
      result.error = 'DNS não resolvido - problema de conectividade';
      console.log(`   🌐 ${config.name}: Erro de DNS`);
    } else if (error.code === 'ECONNREFUSED') {
      result.error = 'Conexão recusada';
      console.log(`   🔌 ${config.name}: Conexão recusada`);
    } else if (error.code === 'ETIMEDOUT') {
      result.error = 'Timeout na conexão';
      console.log(`   ⏰ ${config.name}: Timeout (${testConfig.timeout}ms)`);
    } else {
      result.error = error.message;
      console.log(`   ❌ ${config.name}: ${error.message}`);
    }
  }
  
  console.log('');
  return result;
}

// ===== TESTES ESPECÍFICOS POR API =====

async function testOpenAI() {
  console.log('🤖 TESTE ESPECÍFICO - OPENAI');
  console.log('-'.repeat(40));
  
  const result = {
    basic_connectivity: null,
    models_available: false,
    gpt_models: [],
    error: null
  };
  
  try {
    // Teste básico de conectividade
    result.basic_connectivity = await testAPIConnectivity('openai', testConfig.apis.openai);
    
    if (result.basic_connectivity.status === 'success') {
      // Tentar listar modelos disponíveis
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const response = await axios({
          method: 'GET',
          url: 'https://api.openai.com/v1/models',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          timeout: testConfig.timeout
        });
        
        if (response.data && response.data.data) {
          result.models_available = true;
          result.gpt_models = response.data.data
            .filter(model => model.id.includes('gpt'))
            .map(model => model.id)
            .slice(0, 5); // Primeiros 5 modelos GPT
          
          console.log(`   ✅ Modelos disponíveis: ${response.data.data.length}`);
          console.log(`   🤖 Modelos GPT: ${result.gpt_models.join(', ')}`);
        }
      }
    }
    
  } catch (error) {
    result.error = error.message;
    console.log(`   ❌ Erro no teste OpenAI: ${error.message}`);
  }
  
  console.log('');
  return result;
}

async function testBinance() {
  console.log('💱 TESTE ESPECÍFICO - BINANCE');
  console.log('-'.repeat(40));
  
  const result = {
    basic_connectivity: null,
    server_time: null,
    exchange_info: false,
    btc_price: null,
    error: null
  };
  
  try {
    // Teste básico de conectividade
    result.basic_connectivity = await testAPIConnectivity('binance', testConfig.apis.binance);
    
    if (result.basic_connectivity.status === 'success') {
      // Obter tempo do servidor
      const timeResponse = await axios.get('https://api.binance.com/api/v3/time');
      result.server_time = new Date(timeResponse.data.serverTime).toISOString();
      console.log(`   ⏰ Tempo do servidor: ${result.server_time}`);
      
      // Obter informações do exchange
      const infoResponse = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
      if (infoResponse.data && infoResponse.data.symbols) {
        result.exchange_info = true;
        console.log(`   📊 Pares disponíveis: ${infoResponse.data.symbols.length}`);
      }
      
      // Obter preço do Bitcoin
      const priceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      if (priceResponse.data && priceResponse.data.price) {
        result.btc_price = parseFloat(priceResponse.data.price);
        console.log(`   ₿ Preço BTC/USDT: $${result.btc_price.toLocaleString()}`);
      }
    }
    
  } catch (error) {
    result.error = error.message;
    console.log(`   ❌ Erro no teste Binance: ${error.message}`);
  }
  
  console.log('');
  return result;
}

async function testBybit() {
  console.log('🔄 TESTE ESPECÍFICO - BYBIT');
  console.log('-'.repeat(40));
  
  const result = {
    basic_connectivity: null,
    server_time: null,
    instruments: false,
    btc_price: null,
    error: null
  };
  
  try {
    // Teste básico de conectividade
    result.basic_connectivity = await testAPIConnectivity('bybit', testConfig.apis.bybit);
    
    if (result.basic_connectivity.status === 'success') {
      // Obter tempo do servidor
      const timeResponse = await axios.get('https://api.bybit.com/v2/public/time');
      if (timeResponse.data && timeResponse.data.time_now) {
        result.server_time = new Date(timeResponse.data.time_now * 1000).toISOString();
        console.log(`   ⏰ Tempo do servidor: ${result.server_time}`);
      }
      
      // Tentar obter instrumentos (novo endpoint)
      try {
        const instrumentsResponse = await axios.get('https://api.bybit.com/v5/market/instruments-info?category=spot');
        if (instrumentsResponse.data && instrumentsResponse.data.result) {
          result.instruments = true;
          console.log(`   📊 Instrumentos disponíveis: ${instrumentsResponse.data.result.list?.length || 'N/A'}`);
        }
      } catch (e) {
        console.log(`   ⚠️  Endpoint de instrumentos indisponível`);
      }
      
      // Tentar obter preço do Bitcoin
      try {
        const tickerResponse = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
        if (tickerResponse.data && tickerResponse.data.result && tickerResponse.data.result.list) {
          const btcData = tickerResponse.data.result.list[0];
          if (btcData && btcData.lastPrice) {
            result.btc_price = parseFloat(btcData.lastPrice);
            console.log(`   ₿ Preço BTC/USDT: $${result.btc_price.toLocaleString()}`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️  Preço BTC indisponível`);
      }
    }
    
  } catch (error) {
    result.error = error.message;
    console.log(`   ❌ Erro no teste Bybit: ${error.message}`);
  }
  
  console.log('');
  return result;
}

async function testStripe() {
  console.log('💳 TESTE ESPECÍFICO - STRIPE');
  console.log('-'.repeat(40));
  
  const result = {
    basic_connectivity: null,
    account_info: false,
    webhook_endpoints: 0,
    test_mode: null,
    error: null
  };
  
  try {
    // Teste básico de conectividade
    result.basic_connectivity = await testAPIConnectivity('stripe', testConfig.apis.stripe);
    
    if (result.basic_connectivity.status === 'success') {
      const apiKey = process.env.STRIPE_SECRET_KEY;
      
      if (apiKey) {
        // Verificar se está em modo de teste
        result.test_mode = apiKey.startsWith('sk_test_');
        console.log(`   🔧 Modo: ${result.test_mode ? 'TESTE' : 'PRODUÇÃO'}`);
        
        // Obter informações da conta
        const accountResponse = await axios({
          method: 'GET',
          url: 'https://api.stripe.com/v1/account',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (accountResponse.data) {
          result.account_info = true;
          console.log(`   ✅ Conta: ${accountResponse.data.business_profile?.name || 'N/A'}`);
          console.log(`   🌍 País: ${accountResponse.data.country || 'N/A'}`);
          console.log(`   💰 Moeda: ${accountResponse.data.default_currency?.toUpperCase() || 'N/A'}`);
        }
        
        // Listar webhook endpoints
        try {
          const webhooksResponse = await axios({
            method: 'GET',
            url: 'https://api.stripe.com/v1/webhook_endpoints',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
            }
          });
          
          if (webhooksResponse.data && webhooksResponse.data.data) {
            result.webhook_endpoints = webhooksResponse.data.data.length;
            console.log(`   🔗 Webhooks configurados: ${result.webhook_endpoints}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Webhooks não acessíveis`);
        }
      }
    }
    
  } catch (error) {
    result.error = error.message;
    console.log(`   ❌ Erro no teste Stripe: ${error.message}`);
  }
  
  console.log('');
  return result;
}

// ===== VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE =====

function checkEnvironmentVariables() {
  console.log('🌍 VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE');
  console.log('-'.repeat(40));
  
  const requiredVars = [
    'OPENAI_API_KEY',
    'BINANCE_API_KEY',
    'BYBIT_API_KEY', 
    'STRIPE_SECRET_KEY'
  ];
  
  const results = {};
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = value && value.trim().length > 0;
    
    results[varName] = {
      set: isSet,
      value: isSet ? value.substring(0, 10) + '...' : null
    };
    
    console.log(`   ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
  });
  
  console.log('');
  return results;
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runExternalIntegrationTest() {
  console.log('🧪 EXECUTANDO TESTE COMPLETO DE INTEGRAÇÕES EXTERNAS');
  console.log('');
  
  const results = {
    environment: null,
    apis: {},
    summary: {
      total_apis: 4,
      working_apis: 0,
      apis_with_auth: 0,
      errors: []
    }
  };
  
  // 1. Verificar variáveis de ambiente
  results.environment = checkEnvironmentVariables();
  
  // 2. Testar cada API
  console.log('🔗 TESTANDO CONECTIVIDADE DAS APIs');
  console.log('-'.repeat(40));
  
  results.apis.openai = await testOpenAI();
  results.apis.binance = await testBinance();
  results.apis.bybit = await testBybit();
  results.apis.stripe = await testStripe();
  
  // 3. Compilar estatísticas
  Object.values(results.apis).forEach(api => {
    if (api.basic_connectivity && api.basic_connectivity.status === 'success') {
      results.summary.working_apis++;
    }
    if (api.basic_connectivity && api.basic_connectivity.status === 'auth_error') {
      results.summary.apis_with_auth++;
    }
    if (api.error) {
      results.summary.errors.push(api.error);
    }
  });
  
  // ===== RESUMO FINAL =====
  
  console.log('📊 RESUMO DO TESTE DE INTEGRAÇÕES EXTERNAS');
  console.log('=' .repeat(60));
  
  console.log(`🌐 APIs Funcionando: ${results.summary.working_apis}/${results.summary.total_apis}`);
  console.log(`🔑 APIs com Problema de Auth: ${results.summary.apis_with_auth}`);
  console.log(`❌ Erros Encontrados: ${results.summary.errors.length}`);
  
  // Status individual
  console.log('');
  console.log('📋 Status Individual:');
  console.log(`   🤖 OpenAI: ${getStatusIcon(results.apis.openai.basic_connectivity?.status)} ${results.apis.openai.basic_connectivity?.status || 'unknown'}`);
  console.log(`   💱 Binance: ${getStatusIcon(results.apis.binance.basic_connectivity?.status)} ${results.apis.binance.basic_connectivity?.status || 'unknown'}`);
  console.log(`   🔄 Bybit: ${getStatusIcon(results.apis.bybit.basic_connectivity?.status)} ${results.apis.bybit.basic_connectivity?.status || 'unknown'}`);
  console.log(`   💳 Stripe: ${getStatusIcon(results.apis.stripe.basic_connectivity?.status)} ${results.apis.stripe.basic_connectivity?.status || 'unknown'}`);
  
  // Score geral
  const successRate = (results.summary.working_apis / results.summary.total_apis * 100);
  
  console.log('');
  console.log(`🎯 TAXA DE SUCESSO: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 75) {
    console.log('🏆 INTEGRAÇÕES EXTERNAS FUNCIONANDO CORRETAMENTE!');
    console.log('✅ Maioria das APIs estão respondendo');
  } else if (successRate >= 50) {
    console.log('⚠️ INTEGRAÇÕES PARCIALMENTE FUNCIONANDO');
    console.log('🔧 Algumas APIs precisam de atenção');
  } else {
    console.log('❌ PROBLEMAS CRÍTICOS NAS INTEGRAÇÕES');
    console.log('🚨 Múltiplas APIs não estão respondendo');
  }
  
  // Recomendações
  console.log('');
  console.log('💡 RECOMENDAÇÕES:');
  
  if (results.summary.apis_with_auth > 0) {
    console.log('   🔑 Verificar chaves de API e permissões');
  }
  
  if (results.summary.working_apis < results.summary.total_apis) {
    console.log('   🌐 Verificar conectividade de rede');
    console.log('   🔧 Configurar variáveis de ambiente faltantes');
  }
  
  if (results.apis.stripe.basic_connectivity?.status === 'success') {
    console.log('   💳 Stripe funcionando - pagamentos disponíveis');
  }
  
  if (results.apis.binance.basic_connectivity?.status === 'success' || 
      results.apis.bybit.basic_connectivity?.status === 'success') {
    console.log('   📊 Exchanges funcionando - dados de mercado disponíveis');
  }
  
  console.log('');
  console.log('⏰ Teste finalizado em:', new Date().toISOString());
  
  return {
    success_rate: successRate,
    ready_for_trading: successRate >= 75,
    results
  };
}

// ===== FUNÇÕES AUXILIARES =====

function getStatusIcon(status) {
  switch (status) {
    case 'success': return '✅';
    case 'auth_error': return '🔑';
    case 'permission_error': return '🚫';
    case 'missing_key': return '⚠️';
    case 'error': return '❌';
    default: return '❓';
  }
}

// ===== EXECUÇÃO =====

if (require.main === module) {
  runExternalIntegrationTest()
    .then(result => {
      console.log(`\n💾 Taxa de sucesso: ${result.success_rate.toFixed(1)}%`);
      process.exit(result.ready_for_trading ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro durante teste de integrações:', error);
      process.exit(1);
    });
}

module.exports = { runExternalIntegrationTest };
