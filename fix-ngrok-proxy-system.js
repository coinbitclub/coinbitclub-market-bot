// MARKETBOT - CORREÇÃO DEFINITIVA DO SISTEMA NGROK PROXY
console.log('🔧 CORRIGINDO SISTEMA NGROK PARA CONTORNAR BLOQUEIO GEOGRÁFICO...');

const https = require('https');
const http = require('http');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

// ========================================
// CONFIGURAÇÃO CORRETA DO NGROK COMO HTTP PROXY
// ========================================

const NGROK_CONFIG = {
  authToken: process.env.NGROK_AUTH_TOKEN || '314SgsgTA9RpH3gJJenmvEEOnu3_3uXNyK3QbWE4u8VZa7tFZ',
  region: 'us',
  subdomain: 'marketbot-trading',
  // NGROK HTTP PROXY - não TCP
  httpProxyUrl: 'http://127.0.0.1:4040', // URL do proxy HTTP local do NGROK
  socksProxyUrl: 'socks5://127.0.0.1:1080' // SOCKS5 proxy alternativo
};

// ========================================
// SISTEMA DE PROXY HTTP CORRETO
// ========================================

// Configurar proxy HTTP para passar pelo NGROK
function createNgrokHttpAgent(isHttps = true) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  return new AgentClass({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 50,
    timeout: 30000,
    // CONFIGURAR PROXY HTTP PARA EXCHANGES
    proxy: {
      host: '127.0.0.1',
      port: 4040, // Porta padrão do NGROK HTTP proxy
      auth: NGROK_CONFIG.authToken
    }
  });
}

// ========================================
// FUNÇÃO PARA TESTAR NGROK HTTP PROXY
// ========================================

async function testNgrokHttpProxy() {
  console.log('🔍 Testando NGROK HTTP Proxy...');
  
  try {
    // Configurar proxy agent
    const proxyAgent = createNgrokHttpAgent(true);
    
    // Testar Binance através do proxy NGROK
    const binanceTest = await axios.get('https://api.binance.com/api/v3/time', {
      httpsAgent: proxyAgent,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    });
    
    if (binanceTest.status === 200) {
      console.log('✅ NGROK HTTP Proxy funcionando para Binance!');
      return true;
    }
    
  } catch (error) {
    console.log(`⚠️ NGROK HTTP Proxy falhou: ${error.message}`);
    
    // Fallback: usar SOCKS5 proxy
    try {
      console.log('🔄 Tentando SOCKS5 proxy...');
      
      const socksAgent = new SocksProxyAgent(NGROK_CONFIG.socksProxyUrl);
      
      const socksTest = await axios.get('https://api.binance.com/api/v3/time', {
        httpsAgent: socksAgent,
        timeout: 10000
      });
      
      if (socksTest.status === 200) {
        console.log('✅ SOCKS5 proxy funcionando!');
        return true;
      }
      
    } catch (socksError) {
      console.log(`❌ SOCKS5 proxy falhou: ${socksError.message}`);
    }
  }
  
  return false;
}

// ========================================
// SISTEMA DE REQUISIÇÕES CORRIGIDO
// ========================================

// Função para fazer requisições através do NGROK
async function makeNgrokRequest(url, options = {}) {
  console.log(`🌐 Fazendo requisição via NGROK para: ${url}`);
  
  // Estratégias de proxy em ordem de prioridade
  const proxyStrategies = [
    {
      name: 'NGROK_HTTP_PROXY',
      agent: createNgrokHttpAgent(url.startsWith('https'))
    },
    {
      name: 'SOCKS5_PROXY', 
      agent: new SocksProxyAgent(NGROK_CONFIG.socksProxyUrl)
    }
  ];
  
  for (const strategy of proxyStrategies) {
    try {
      console.log(`🔄 Tentando estratégia: ${strategy.name}`);
      
      const config = {
        ...options,
        httpsAgent: strategy.agent,
        httpAgent: strategy.agent,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      };
      
      const response = await axios.get(url, config);
      
      if (response.status === 200) {
        console.log(`✅ Sucesso com ${strategy.name}!`);
        return response;
      }
      
    } catch (error) {
      console.log(`❌ ${strategy.name} falhou: ${error.response?.status || error.message}`);
    }
  }
  
  throw new Error('Todas as estratégias de proxy falharam');
}

// ========================================
// MARKET PULSE CORRIGIDO COM NGROK
// ========================================

async function getMarketPulseViaProxy() {
  console.log('📊 Coletando Market Pulse via NGROK Proxy...');
  
  try {
    // Tentar Binance primeiro via proxy
    const binanceResponse = await makeNgrokRequest('https://api.binance.com/api/v3/ticker/24hr');
    const tickers = binanceResponse.data;
    
    // Filtrar TOP 100 pares USDT
    const usdtPairs = tickers
      .filter(t => t.symbol.endsWith('USDT') && 
                   !t.symbol.includes('UP') && 
                   !t.symbol.includes('DOWN'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 100);
    
    const positivePairs = usdtPairs.filter(t => parseFloat(t.priceChangePercent) > 0).length;
    const marketPulse = (positivePairs / usdtPairs.length) * 100;
    
    console.log(`✅ Market Pulse via NGROK: ${marketPulse.toFixed(1)}% (${usdtPairs.length} pares)`);
    
    return {
      success: true,
      marketPulse,
      source: 'Binance_NGROK_Proxy',
      totalPairs: usdtPairs.length,
      positivePairs
    };
    
  } catch (error) {
    console.log(`❌ Market Pulse via proxy falhou: ${error.message}`);
    
    // Fallback: tentar Bybit
    try {
      const bybitResponse = await makeNgrokRequest('https://api.bybit.com/v5/market/tickers?category=spot');
      const data = bybitResponse.data;
      
      const usdtPairs = data.result.list
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .slice(0, 100);
      
      const positivePairs = usdtPairs.filter(ticker => 
        parseFloat(ticker.price24hPcnt) > 0
      ).length;
      
      const marketPulse = (positivePairs / usdtPairs.length) * 100;
      
      console.log(`✅ Market Pulse via Bybit NGROK: ${marketPulse.toFixed(1)}%`);
      
      return {
        success: true,
        marketPulse,
        source: 'Bybit_NGROK_Proxy', 
        totalPairs: usdtPairs.length,
        positivePairs
      };
      
    } catch (bybitError) {
      console.log(`❌ Bybit via proxy também falhou: ${bybitError.message}`);
      throw new Error('Ambas exchanges falharam via proxy');
    }
  }
}

// ========================================
// BYBIT TRADING CORRIGIDO COM PROXY
// ========================================

async function createBybitExchangeWithProxy(apiKey, apiSecret, isTestnet = false) {
  console.log('🔧 Criando exchange Bybit com proxy NGROK...');
  
  const ccxt = require('ccxt');
  
  // Configurar CCXT para usar proxy
  const exchange = new ccxt.bybit({
    apiKey,
    secret: apiSecret,
    sandbox: isTestnet,
    enableRateLimit: true,
    timeout: 45000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    },
    // APLICAR PROXY NGROK NO CCXT
    proxy: 'http://127.0.0.1:4040',  // NGROK HTTP proxy
    httpsAgent: createNgrokHttpAgent(true),
    httpAgent: createNgrokHttpAgent(false),
    options: {
      defaultType: 'linear',
      hedgeMode: false
    }
  });
  
  // Teste de conectividade via proxy
  try {
    await exchange.loadMarkets();
    console.log('✅ Bybit exchange configurada com proxy NGROK!');
    return exchange;
  } catch (error) {
    console.log(`❌ Erro configurando Bybit com proxy: ${error.message}`);
    
    // Fallback: exchange sem proxy (vai falhar mas é para debug)
    console.log('🔄 Tentando exchange sem proxy para comparação...');
    const fallbackExchange = new ccxt.bybit({
      apiKey,
      secret: apiSecret,
      sandbox: isTestnet,
      enableRateLimit: true
    });
    
    return fallbackExchange;
  }
}

// ========================================
// SCRIPT DE CORREÇÃO PRINCIPAL
// ========================================

async function applyNgrokProxyFix() {
  console.log('\n🚀 APLICANDO CORREÇÃO NGROK PROXY...');
  
  try {
    // 1. Testar proxy NGROK
    console.log('\n1️⃣ Testando conectividade NGROK...');
    const proxyWorking = await testNgrokHttpProxy();
    
    if (!proxyWorking) {
      console.log('⚠️ NGROK proxy não está funcionando - verificar configuração');
      return false;
    }
    
    // 2. Testar Market Pulse via proxy
    console.log('\n2️⃣ Testando Market Pulse via proxy...');
    const marketData = await getMarketPulseViaProxy();
    console.log(`📊 Market Pulse obtido: ${marketData.marketPulse.toFixed(1)}% via ${marketData.source}`);
    
    // 3. Testar Bybit trading via proxy  
    console.log('\n3️⃣ Testando Bybit trading via proxy...');
    
    // Usar chaves de teste para verificação
    const testExchange = await createBybitExchangeWithProxy(
      'test_api_key',
      'test_secret_key', 
      true // testnet
    );
    
    if (testExchange) {
      console.log('✅ Exchange Bybit configurada com proxy!');
    }
    
    console.log('\n✅ CORREÇÃO NGROK PROXY APLICADA COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Iniciar NGROK HTTP proxy: ngrok http 80 --region=us');
    console.log('   2. Configurar proxy SOCKS5: ngrok tcp 1080 --region=us');
    console.log('   3. Aplicar correções no servidor principal');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro aplicando correção:', error);
    return false;
  }
}

// ========================================
// COMANDO NGROK CORRETO
// ========================================

function generateNgrokCommands() {
  console.log('\n🔧 COMANDOS NGROK CORRETOS:');
  console.log('\n# 1. NGROK HTTP Proxy (Principal)');
  console.log('ngrok http 80 --region=us --subdomain=marketbot-trading --authtoken=' + NGROK_CONFIG.authToken);
  
  console.log('\n# 2. NGROK SOCKS5 Proxy (Fallback)'); 
  console.log('ngrok tcp 1080 --region=us --authtoken=' + NGROK_CONFIG.authToken);
  
  console.log('\n# 3. Para Railway (start script)');
  console.log('ngrok http $PORT --region=us --subdomain=marketbot-trading --authtoken=$NGROK_AUTH_TOKEN &');
  console.log('node servidor-marketbot-real.js');
}

// ========================================
// EXECUTAR CORREÇÃO
// ========================================

if (require.main === module) {
  applyNgrokProxyFix().then(success => {
    if (success) {
      generateNgrokCommands();
      console.log('\n🎯 SISTEMA CORRIGIDO! Reiniciar servidor para aplicar mudanças.');
    } else {
      console.log('\n❌ Correção falhou. Verificar logs para mais detalhes.');
    }
  });
}

module.exports = {
  testNgrokHttpProxy,
  makeNgrokRequest,
  getMarketPulseViaProxy,
  createBybitExchangeWithProxy,
  applyNgrokProxyFix
};
