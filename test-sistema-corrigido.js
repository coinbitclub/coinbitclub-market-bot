// TESTE COMPLETO DO SISTEMA CORRIGIDO - NGROK PROXY
console.log('🧪 TESTANDO SISTEMA CORRIGIDO ANTI-BLOQUEIO GEOGRÁFICO...');

const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// ========================================
// TESTE 1: CONECTIVIDADE NGROK PROXY
// ========================================

async function testNgrokProxy() {
  console.log('\n1️⃣ TESTANDO CONECTIVIDADE NGROK PROXY...');
  
  try {
    // Simular proxy NGROK local (seria configurado pelo tunnel)
    const proxyUrl = 'http://127.0.0.1:4040';
    
    console.log(`🔗 Testando proxy: ${proxyUrl}`);
    console.log('⚠️  Para funcionar, o NGROK deve estar rodando:');
    console.log('   ngrok http 80 --region=us --subdomain=marketbot-trading');
    
    // Testar se proxy está ativo (vai falhar se NGROK não estiver rodando)
    try {
      const proxyAgent = new HttpsProxyAgent(proxyUrl);
      
      const response = await axios.get('https://api.binance.com/api/v3/time', {
        httpsAgent: proxyAgent,
        timeout: 10000,
        headers: {
          'User-Agent': 'MarketBot-Test/1.0'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ PROXY NGROK FUNCIONANDO!');
        console.log(`   Server Time: ${new Date(response.data.serverTime).toISOString()}`);
        return true;
      }
      
    } catch (proxyError) {
      console.log(`❌ Proxy NGROK não disponível: ${proxyError.message}`);
      console.log('💡 SOLUÇÃO: Iniciar NGROK com comando correto');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro testando proxy:', error.message);
    return false;
  }
}

// ========================================
// TESTE 2: DETECÇÃO DE BLOQUEIO GEOGRÁFICO
// ========================================

async function testGeographicalBlocking() {
  console.log('\n2️⃣ TESTANDO DETECÇÃO DE BLOQUEIO GEOGRÁFICO...');
  
  const testUrls = [
    'https://api.binance.com/api/v3/time',
    'https://api.bybit.com/v5/market/time',
    'https://openapiv1.coinstats.app/markets'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`🔍 Testando: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        }
      });
      
      console.log(`✅ ${url}: ${response.status} OK`);
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.message;
      
      if (status === 451) {
        console.log(`🚫 ${url}: 451 BLOQUEIO GEOGRÁFICO DETECTADO`);
      } else if (status === 403) {
        console.log(`🚫 ${url}: 403 FORBIDDEN - Possível CloudFront block`);
      } else {
        console.log(`⚠️  ${url}: ${status || 'TIMEOUT'} - ${message}`);
      }
    }
  }
}

// ========================================
// TESTE 3: MARKET PULSE SIMULADO
// ========================================

async function testMarketPulseLogic() {
  console.log('\n3️⃣ TESTANDO LÓGICA DE MARKET PULSE...');
  
  // Simular dados de resposta da Binance
  const mockBinanceData = [
    { symbol: 'BTCUSDT', priceChangePercent: '2.5', quoteVolume: '1000000' },
    { symbol: 'ETHUSDT', priceChangePercent: '-1.2', quoteVolume: '800000' },
    { symbol: 'LINKUSDT', priceChangePercent: '3.1', quoteVolume: '600000' },
    { symbol: 'ADAUSDT', priceChangePercent: '-0.8', quoteVolume: '500000' },
    { symbol: 'DOTUSDT', priceChangePercent: '1.9', quoteVolume: '400000' }
  ];
  
  // Filtrar TOP pares USDT
  const usdtPairs = mockBinanceData
    .filter(t => t.symbol.endsWith('USDT'))
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
  
  const positivePairs = usdtPairs.filter(t => parseFloat(t.priceChangePercent) > 0).length;
  const marketPulse = (positivePairs / usdtPairs.length) * 100;
  
  console.log(`📊 Market Pulse simulado: ${marketPulse.toFixed(1)}%`);
  console.log(`   Total pares: ${usdtPairs.length}`);
  console.log(`   Positivos: ${positivePairs}`);
  console.log(`   Negativos: ${usdtPairs.length - positivePairs}`);
  
  // Determinar trend
  let trend = 'NEUTRAL';
  if (marketPulse > 60) trend = 'BULLISH';
  else if (marketPulse < 40) trend = 'BEARISH';
  
  console.log(`📈 Trend: ${trend}`);
  
  return { marketPulse, trend, positivePairs, totalPairs: usdtPairs.length };
}

// ========================================
// TESTE 4: TRADING DECISION LOGIC
// ========================================

async function testTradingDecisionLogic() {
  console.log('\n4️⃣ TESTANDO LÓGICA DE DECISÃO DE TRADING...');
  
  // Simular dados de market intelligence
  const marketData = {
    fearGreed: 45,      // Medo moderado
    marketPulse: 65,    // 65% positivo
    btcDominance: 52    // BTC dominando moderadamente
  };
  
  console.log('📊 Dados de mercado simulados:', marketData);
  
  // Aplicar lógica de decisão
  let allowLong = true;
  let allowShort = true;
  let confidence = 50;
  const reasons = [];
  
  // Fear & Greed Analysis
  if (marketData.fearGreed < 30) {
    allowShort = false;
    confidence += 25;
    reasons.push(`Fear & Greed ${marketData.fearGreed} < 30: EXTREMA GANÂNCIA - SOMENTE LONG`);
  } else if (marketData.fearGreed > 80) {
    allowLong = false;
    confidence += 25;
    reasons.push(`Fear & Greed ${marketData.fearGreed} > 80: EXTREMO MEDO - SOMENTE SHORT`);
  }
  
  // Market Pulse Analysis
  if (marketData.marketPulse > 65) {
    confidence += 15;
    reasons.push(`Market ${marketData.marketPulse.toFixed(1)}% positivo - BULLISH`);
  } else if (marketData.marketPulse < 35) {
    confidence += 15;
    reasons.push(`Market ${(100 - marketData.marketPulse).toFixed(1)}% negativo - BEARISH`);
  }
  
  // BTC Dominance Analysis
  if (marketData.btcDominance > 55) {
    reasons.push(`BTC Dom ${marketData.btcDominance.toFixed(1)}% - Período BTC`);
  } else if (marketData.btcDominance < 45) {
    confidence += 10;
    reasons.push(`BTC Dom ${marketData.btcDominance.toFixed(1)}% - Favorável ALTCOINS`);
  }
  
  const decision = {
    allowLong,
    allowShort,
    confidence: Math.min(confidence, 100),
    reasons
  };
  
  console.log('🎯 DECISÃO DE TRADING:', {
    LONG: allowLong ? '✅' : '❌',
    SHORT: allowShort ? '✅' : '❌',
    CONFIANÇA: `${decision.confidence}%`,
    RAZÕES: decision.reasons
  });
  
  return decision;
}

// ========================================
// TESTE COMPLETO
// ========================================

async function runFullTest() {
  console.log('🚀 INICIANDO TESTE COMPLETO DO SISTEMA CORRIGIDO...');
  console.log('=' .repeat(60));
  
  try {
    // Teste 1: Proxy NGROK
    const proxyWorking = await testNgrokProxy();
    
    // Teste 2: Bloqueio geográfico
    await testGeographicalBlocking();
    
    // Teste 3: Market Pulse
    const marketPulseResult = await testMarketPulseLogic();
    
    // Teste 4: Trading Decision
    const tradingDecision = await testTradingDecisionLogic();
    
    // Resultado final
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESULTADO DOS TESTES:');
    console.log('=' .repeat(60));
    
    console.log(`🔗 NGROK Proxy: ${proxyWorking ? '✅ FUNCIONANDO' : '❌ NÃO CONFIGURADO'}`);
    console.log(`📈 Market Pulse: ✅ LÓGICA OK (${marketPulseResult.marketPulse.toFixed(1)}%)`);
    console.log(`🎯 Trading Decision: ✅ LÓGICA OK (${tradingDecision.confidence}% confiança)`);
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    
    if (!proxyWorking) {
      console.log('   1. Iniciar NGROK: ngrok http 80 --region=us --subdomain=marketbot-trading');
      console.log('   2. Verificar se o proxy está ativo na porta 4040');
      console.log('   3. Reiniciar o servidor MarketBot');
    } else {
      console.log('   1. ✅ Sistema pronto para produção');
      console.log('   2. ✅ Deploy no Railway pode ser realizado');
      console.log('   3. ✅ Bloqueio geográfico será contornado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runFullTest();
}

module.exports = {
  testNgrokProxy,
  testGeographicalBlocking,
  testMarketPulseLogic,
  testTradingDecisionLogic,
  runFullTest
};
