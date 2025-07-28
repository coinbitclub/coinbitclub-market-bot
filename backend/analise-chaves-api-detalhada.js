// 🔍 ANÁLISE DETALHADA DAS CHAVES API - VERIFICAÇÃO DE AUTENTICIDADE
// Diagnóstico completo das integrações externas com chaves reais

const axios = require('axios');

console.log('🔐 ANÁLISE DETALHADA DAS CHAVES API');
console.log('=' .repeat(60));
console.log('⏰ Análise iniciada:', new Date().toISOString());
console.log('');

// ===== ANÁLISE INDIVIDUAL DAS CHAVES =====

async function analyzeOpenAI() {
  console.log('🤖 ANÁLISE OPENAI API');
  console.log('-'.repeat(40));
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('   ❌ Chave não configurada');
    return { status: 'not_configured' };
  }
  
  console.log(`   🔑 Chave: ${apiKey.substring(0, 7)}...${apiKey.slice(-4)}`);
  console.log(`   📏 Tamanho: ${apiKey.length} caracteres`);
  
  // Verificar formato da chave
  if (apiKey.startsWith('sk-')) {
    if (apiKey.includes('test')) {
      console.log('   🧪 Tipo: CHAVE DE TESTE');
    } else {
      console.log('   🏭 Tipo: CHAVE DE PRODUÇÃO');
    }
  } else {
    console.log('   ⚠️  Formato: Chave não parece ser válida (não começa com sk-)');
  }
  
  try {
    // Testar listagem de modelos
    const response = await axios({
      method: 'GET',
      url: 'https://api.openai.com/v1/models',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      const models = response.data.data || [];
      console.log(`   ✅ Status: FUNCIONANDO`);
      console.log(`   📊 Modelos disponíveis: ${models.length}`);
      
      const gptModels = models.filter(m => m.id.includes('gpt')).slice(0, 3);
      if (gptModels.length > 0) {
        console.log(`   🤖 Modelos GPT: ${gptModels.map(m => m.id).join(', ')}`);
      }
      
      return { status: 'working', models: models.length };
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      console.log(`   ❌ Status: ERRO HTTP ${status}`);
      
      if (status === 401) {
        console.log('   🔑 Problema: Chave inválida ou expirada');
        console.log('   💡 Solução: Verificar/regenerar chave no dashboard OpenAI');
      } else if (status === 429) {
        console.log('   ⏱️  Problema: Rate limit excedido');
        console.log('   💡 Solução: Aguardar ou upgradar plano');
      } else if (status === 403) {
        console.log('   🚫 Problema: Sem permissão para esta API');
        console.log('   💡 Solução: Verificar permissões da chave');
      }
      
      return { status: 'error', error_code: status };
    } else {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
      return { status: 'connection_error', error: error.message };
    }
  }
  
  console.log('');
}

async function analyzeStripe() {
  console.log('💳 ANÁLISE STRIPE API');
  console.log('-'.repeat(40));
  
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    console.log('   ❌ Chave não configurada');
    return { status: 'not_configured' };
  }
  
  console.log(`   🔑 Chave: ${apiKey.substring(0, 7)}...${apiKey.slice(-4)}`);
  console.log(`   📏 Tamanho: ${apiKey.length} caracteres`);
  
  // Verificar tipo de chave
  if (apiKey.startsWith('sk_test_')) {
    console.log('   🧪 Tipo: CHAVE DE TESTE');
  } else if (apiKey.startsWith('sk_live_')) {
    console.log('   🏭 Tipo: CHAVE DE PRODUÇÃO (LIVE)');
  } else {
    console.log('   ⚠️  Formato: Chave não reconhecida');
  }
  
  try {
    // Testar acesso à conta
    const response = await axios({
      method: 'GET',
      url: 'https://api.stripe.com/v1/account',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      const account = response.data;
      console.log(`   ✅ Status: FUNCIONANDO`);
      console.log(`   🏢 Conta: ${account.business_profile?.name || 'N/A'}`);
      console.log(`   🌍 País: ${account.country || 'N/A'}`);
      console.log(`   💰 Moeda padrão: ${(account.default_currency || 'N/A').toUpperCase()}`);
      console.log(`   📧 Email: ${account.email || 'N/A'}`);
      
      // Verificar se pode receber pagamentos
      if (account.charges_enabled) {
        console.log('   💳 Cobrança: HABILITADA');
      } else {
        console.log('   ⚠️  Cobrança: DESABILITADA');
      }
      
      if (account.payouts_enabled) {
        console.log('   💸 Pagamentos: HABILITADOS');
      } else {
        console.log('   ⚠️  Pagamentos: DESABILITADOS');
      }
      
      return { 
        status: 'working', 
        account_name: account.business_profile?.name,
        country: account.country,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      };
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      console.log(`   ❌ Status: ERRO HTTP ${status}`);
      
      if (status === 401) {
        console.log('   🔑 Problema: Chave inválida');
        console.log('   💡 Solução: Verificar chave no dashboard Stripe');
      } else if (status === 403) {
        console.log('   🚫 Problema: Chave sem permissão');
        console.log('   💡 Solução: Verificar escopo da chave');
      }
      
      return { status: 'error', error_code: status };
    } else {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
      return { status: 'connection_error', error: error.message };
    }
  }
  
  console.log('');
}

async function analyzeBinance() {
  console.log('💱 ANÁLISE BINANCE API');
  console.log('-'.repeat(40));
  
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  
  if (!apiKey) {
    console.log('   ❌ Chave não configurada');
    return { status: 'not_configured' };
  }
  
  console.log(`   🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
  console.log(`   📏 Tamanho: ${apiKey.length} caracteres`);
  console.log(`   🔐 Secret: ${apiSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
  
  try {
    // Teste público (não precisa de auth)
    const pingResponse = await axios.get('https://api.binance.com/api/v3/ping');
    console.log('   ✅ Conectividade: OK');
    
    // Obter informações do servidor
    const timeResponse = await axios.get('https://api.binance.com/api/v3/time');
    const serverTime = new Date(timeResponse.data.serverTime);
    const localTime = new Date();
    const timeDiff = Math.abs(serverTime.getTime() - localTime.getTime());
    
    console.log(`   ⏰ Tempo servidor: ${serverTime.toISOString()}`);
    console.log(`   🕐 Diferença local: ${timeDiff}ms`);
    
    if (timeDiff > 5000) {
      console.log('   ⚠️  AVISO: Diferença de tempo > 5s pode causar problemas de auth');
    }
    
    // Teste de dados de mercado
    const tickerResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    const btcData = tickerResponse.data;
    
    console.log(`   ₿ BTC/USDT: $${parseFloat(btcData.lastPrice).toLocaleString()}`);
    console.log(`   📈 24h Change: ${parseFloat(btcData.priceChangePercent).toFixed(2)}%`);
    console.log(`   📊 Volume 24h: ${parseFloat(btcData.volume).toLocaleString()} BTC`);
    
    // Se tiver chave + secret, testar conta
    if (apiKey && apiSecret && !apiKey.includes('demo')) {
      try {
        const crypto = require('crypto');
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
          .createHmac('sha256', apiSecret)
          .update(queryString)
          .digest('hex');
        
        const accountResponse = await axios({
          method: 'GET',
          url: `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
          headers: {
            'X-MBX-APIKEY': apiKey
          }
        });
        
        if (accountResponse.status === 200) {
          const account = accountResponse.data;
          console.log('   🏦 Conta: AUTENTICADA');
          console.log(`   💰 Saldos disponíveis: ${account.balances.filter(b => parseFloat(b.free) > 0).length}`);
          
          // Mostrar alguns saldos principais
          const mainCoins = ['BTC', 'ETH', 'USDT', 'BNB'];
          const mainBalances = account.balances.filter(b => 
            mainCoins.includes(b.asset) && parseFloat(b.free) > 0
          );
          
          if (mainBalances.length > 0) {
            console.log('   📊 Saldos principais:');
            mainBalances.forEach(balance => {
              console.log(`      ${balance.asset}: ${parseFloat(balance.free).toFixed(8)}`);
            });
          }
        }
        
      } catch (authError) {
        console.log('   🔑 Autenticação: FALHOU');
        if (authError.response && authError.response.status === 401) {
          console.log('   💡 Chave/Secret inválidos ou sem permissão');
        }
      }
    } else {
      console.log('   🔑 Autenticação: NÃO TESTADA (chave demo ou secret faltando)');
    }
    
    return { 
      status: 'working', 
      btc_price: parseFloat(btcData.lastPrice),
      time_sync: timeDiff < 5000 
    };
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { status: 'error', error: error.message };
  }
  
  console.log('');
}

async function analyzeBybit() {
  console.log('🔄 ANÁLISE BYBIT API');
  console.log('-'.repeat(40));
  
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;
  
  if (!apiKey) {
    console.log('   ❌ Chave não configurada');
    return { status: 'not_configured' };
  }
  
  console.log(`   🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
  console.log(`   📏 Tamanho: ${apiKey.length} caracteres`);
  console.log(`   🔐 Secret: ${apiSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
  
  try {
    // Teste de conectividade pública
    const timeResponse = await axios.get('https://api.bybit.com/v5/market/time');
    
    if (timeResponse.data && timeResponse.data.result) {
      console.log('   ✅ Conectividade: OK');
      const serverTime = new Date(parseInt(timeResponse.data.result.timeSecond) * 1000);
      console.log(`   ⏰ Tempo servidor: ${serverTime.toISOString()}`);
    }
    
    // Teste de dados de mercado
    const tickerResponse = await axios.get(
      'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT'
    );
    
    if (tickerResponse.data && tickerResponse.data.result && tickerResponse.data.result.list) {
      const btcData = tickerResponse.data.result.list[0];
      if (btcData) {
        console.log(`   ₿ BTC/USDT: $${parseFloat(btcData.lastPrice).toLocaleString()}`);
        console.log(`   📈 24h Change: ${parseFloat(btcData.price24hPcnt * 100).toFixed(2)}%`);
        console.log(`   📊 Volume 24h: ${parseFloat(btcData.volume24h).toLocaleString()}`);
      }
    }
    
    // Se tiver chave + secret, testar conta
    if (apiKey && apiSecret && !apiKey.includes('demo')) {
      try {
        const crypto = require('crypto');
        const timestamp = Date.now();
        const params = { timestamp };
        const queryString = Object.keys(params)
          .sort()
          .map(key => `${key}=${params[key]}`)
          .join('&');
        
        const signature = crypto
          .createHmac('sha256', apiSecret)
          .update(timestamp + apiKey + '5000' + queryString)
          .digest('hex');
        
        const accountResponse = await axios({
          method: 'GET',
          url: `https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED`,
          headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': '5000'
          }
        });
        
        if (accountResponse.status === 200) {
          console.log('   🏦 Conta: AUTENTICADA');
          // Processar dados da conta se disponíveis
        }
        
      } catch (authError) {
        console.log('   🔑 Autenticação: FALHOU');
        if (authError.response) {
          console.log(`   💡 Erro HTTP ${authError.response.status}`);
        }
      }
    } else {
      console.log('   🔑 Autenticação: NÃO TESTADA (chave demo ou secret faltando)');
    }
    
    return { status: 'working' };
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { status: 'error', error: error.message };
  }
  
  console.log('');
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runDetailedAnalysis() {
  const results = {
    openai: null,
    stripe: null,
    binance: null,
    bybit: null,
    summary: {
      working_apis: 0,
      total_apis: 4,
      real_keys: 0,
      test_keys: 0
    }
  };
  
  results.openai = await analyzeOpenAI();
  results.stripe = await analyzeStripe();
  results.binance = await analyzeBinance();
  results.bybit = await analyzeBybit();
  
  // Compilar estatísticas
  Object.values(results).forEach(result => {
    if (result && result.status === 'working') {
      results.summary.working_apis++;
    }
  });
  
  // Verificar tipos de chave
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  
  if (openaiKey.includes('test') || stripeKey.startsWith('sk_test_')) {
    results.summary.test_keys++;
  }
  if (!openaiKey.includes('test') && openaiKey.startsWith('sk-') && openaiKey.length > 20) {
    results.summary.real_keys++;
  }
  if (stripeKey.startsWith('sk_live_')) {
    results.summary.real_keys++;
  }
  
  // ===== RESUMO FINAL =====
  console.log('📊 RESUMO DA ANÁLISE DETALHADA');
  console.log('=' .repeat(60));
  
  console.log(`🔗 APIs Funcionando: ${results.summary.working_apis}/${results.summary.total_apis}`);
  console.log(`🏭 Chaves Reais: ${results.summary.real_keys}`);
  console.log(`🧪 Chaves de Teste: ${results.summary.test_keys}`);
  
  console.log('');
  console.log('📋 Status Detalhado:');
  console.log(`   🤖 OpenAI: ${getStatusEmoji(results.openai?.status)} ${results.openai?.status || 'unknown'}`);
  console.log(`   💳 Stripe: ${getStatusEmoji(results.stripe?.status)} ${results.stripe?.status || 'unknown'}`);
  console.log(`   💱 Binance: ${getStatusEmoji(results.binance?.status)} ${results.binance?.status || 'unknown'}`);
  console.log(`   🔄 Bybit: ${getStatusEmoji(results.bybit?.status)} ${results.bybit?.status || 'unknown'}`);
  
  const successRate = (results.summary.working_apis / results.summary.total_apis * 100);
  console.log('');
  console.log(`🎯 TAXA DE SUCESSO: ${successRate.toFixed(1)}%`);
  
  // Recomendações específicas
  console.log('');
  console.log('💡 RECOMENDAÇÕES ESPECÍFICAS:');
  
  if (results.openai?.status === 'error' && results.openai?.error_code === 401) {
    console.log('   🤖 OpenAI: Regenerar chave API no dashboard');
  }
  
  if (results.stripe?.status === 'error' && results.stripe?.error_code === 401) {
    console.log('   💳 Stripe: Verificar chave secreta no dashboard');
  }
  
  if (results.binance?.status === 'working') {
    console.log('   💱 Binance: Funcionando - dados de mercado disponíveis');
  }
  
  if (results.bybit?.status === 'working') {
    console.log('   🔄 Bybit: Funcionando - exchange alternativa disponível');
  }
  
  if (successRate >= 50) {
    console.log('   ✅ Sistema funcional para operações básicas');
  } else {
    console.log('   ⚠️  Sistema precisa de atenção nas integrações');
  }
  
  console.log('');
  console.log('⏰ Análise finalizada:', new Date().toISOString());
  
  return {
    success_rate: successRate,
    working_apis: results.summary.working_apis,
    results
  };
}

function getStatusEmoji(status) {
  switch (status) {
    case 'working': return '✅';
    case 'error': return '❌';
    case 'auth_error': return '🔑';
    case 'not_configured': return '⚠️';
    default: return '❓';
  }
}

// ===== EXECUÇÃO =====

if (require.main === module) {
  runDetailedAnalysis()
    .then(result => {
      console.log(`\n🏆 Análise concluída com ${result.working_apis} APIs funcionando`);
      process.exit(result.success_rate >= 50 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro durante análise:', error);
      process.exit(1);
    });
}

module.exports = { runDetailedAnalysis };
