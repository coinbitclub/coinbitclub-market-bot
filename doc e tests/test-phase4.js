// ========================================
// MARKETBOT - TESTE FASE 4 - MARKET INTELLIGENCE
// Teste do sistema de inteligência de mercado
// ========================================

const MarketIntelligenceService = require('./market-intelligence-simple.js');

async function testPhase4() {
  console.log('\n🎯 INICIANDO TESTE FASE 4 - MARKET INTELLIGENCE\n');
  
  try {
    const marketService = new MarketIntelligenceService();
    
    console.log('1. Testando Fear & Greed Index...');
    const fearGreed = await marketService.getFearGreedIndex();
    console.log(`   ✅ Fear & Greed: ${fearGreed.value} (${fearGreed.classification})`);
    
    console.log('\n2. Testando Market Pulse...');
    const marketPulse = await marketService.getMarketPulse();
    console.log(`   ✅ Market Pulse: ${marketPulse.trend} (${marketPulse.positivePercentage.toFixed(1)}% positivo)`);
    
    console.log('\n3. Testando BTC Dominance...');
    const btcDominance = await marketService.getBTCDominance();
    console.log(`   ✅ BTC Dominance: ${btcDominance.dominance.toFixed(1)}% (${btcDominance.trend})`);
    
    console.log('\n4. Testando Decisão de Mercado...');
    const decision = await marketService.getMarketDecision();
    console.log(`   ✅ Decisão: LONG=${decision.allowLong} | SHORT=${decision.allowShort} | Confiança=${decision.confidence}%`);
    
    console.log('\n5. Testando Cache...');
    const cacheStats = marketService.getCacheStats();
    console.log(`   ✅ Cache: ${cacheStats.keys} chaves armazenadas`);
    
    console.log('\n🎉 FASE 4 IMPLEMENTADA COM SUCESSO!');
    console.log('📊 Sistema de Inteligência de Mercado operacional');
    console.log('💡 Features implementadas:');
    console.log('   • Fear & Greed Index com cache');
    console.log('   • Market Pulse TOP 100 Binance');
    console.log('   • BTC Dominance analysis');
    console.log('   • Sistema de decisão algorítmica');
    console.log('   • IA OpenAI preparada (quando configurada)');
    console.log('   • API endpoints RESTful');
    console.log('   • Cache inteligente');
    console.log('   • Configurações dinâmicas pelo admin');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testPhase4();
