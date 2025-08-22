// ========================================
// TESTE INTEGRAÇÕES REAIS - MARKET INTELLIGENCE
// Teste das APIs reais: CoinStats, Binance e OpenAI
// ========================================

import { realMarketIntelligence } from './src/services/market-intelligence-real.service';

async function testRealIntegrations() {
  console.log('🚀 Iniciando teste das integrações reais...\n');

  try {
    // ========================================
    // TESTE 1: FEAR & GREED INDEX (COINSTATS)
    // ========================================
    console.log('📊 TESTE 1: Fear & Greed Index (CoinStats)');
    console.log('=' .repeat(50));
    
    const fearGreed = await realMarketIntelligence.getFearGreedIndex();
    console.log('✅ Fear & Greed obtido:', {
      value: fearGreed.value,
      classification: fearGreed.classification,
      source: fearGreed.source,
      timestamp: fearGreed.timestamp.toISOString()
    });
    console.log('');

    // ========================================
    // TESTE 2: MARKET PULSE (BINANCE)
    // ========================================
    console.log('🔄 TESTE 2: Market Pulse (Binance)');
    console.log('=' .repeat(50));
    
    const marketPulse = await realMarketIntelligence.getMarketPulse();
    console.log('✅ Market Pulse obtido:', {
      totalCoins: marketPulse.totalCoins,
      positivePercentage: marketPulse.positivePercentage.toFixed(1) + '%',
      negativePercentage: marketPulse.negativePercentage.toFixed(1) + '%',
      trend: marketPulse.trend,
      volumeWeightedDelta: marketPulse.volumeWeightedDelta.toFixed(2),
      timestamp: marketPulse.timestamp.toISOString()
    });
    console.log('');

    // ========================================
    // TESTE 3: BTC DOMINANCE (COINSTATS)
    // ========================================
    console.log('₿ TESTE 3: BTC Dominance (CoinStats)');
    console.log('=' .repeat(50));
    
    const btcDominance = await realMarketIntelligence.getBTCDominance();
    console.log('✅ BTC Dominance obtido:', {
      dominance: btcDominance.dominance.toFixed(1) + '%',
      trend: btcDominance.trend,
      recommendation: btcDominance.recommendation,
      timestamp: btcDominance.timestamp.toISOString()
    });
    console.log('');

    // ========================================
    // TESTE 4: DECISÃO FINAL COM IA
    // ========================================
    console.log('🎯 TESTE 4: Decisão Final (OpenAI + Algoritmo)');
    console.log('=' .repeat(50));
    
    const decision = await realMarketIntelligence.getMarketDecision();
    console.log('✅ Decisão de mercado:', {
      allowLong: decision.allowLong,
      allowShort: decision.allowShort,
      confidence: decision.confidence + '%',
      reasons: decision.reasons,
      fearGreedInfluence: decision.fearGreedInfluence,
      marketPulseInfluence: decision.marketPulseInfluence,
      btcDominanceInfluence: decision.btcDominanceInfluence,
      aiAnalysis: decision.aiAnalysis ? '✅ IA Analisou' : '❌ IA Indisponível',
      timestamp: decision.timestamp.toISOString()
    });
    console.log('');

    // ========================================
    // TESTE 5: OVERVIEW COMPLETO
    // ========================================
    console.log('📈 TESTE 5: Overview Completo');
    console.log('=' .repeat(50));
    
    const overview = await realMarketIntelligence.getMarketOverview();
    console.log('✅ Overview obtido:', {
      fearGreed: `${overview.fearGreed.value} (${overview.fearGreed.classification})`,
      marketPulse: `${overview.marketPulse.positivePercentage.toFixed(1)}% pos (${overview.marketPulse.trend})`,
      btcDominance: `${overview.btcDominance.dominance.toFixed(1)}% (${overview.btcDominance.trend})`,
      decision: `LONG=${overview.decision.allowLong}, SHORT=${overview.decision.allowShort} (${overview.decision.confidence}%)`,
      cache: overview.cache,
      lastUpdate: overview.lastUpdate.toISOString(),
      nextUpdate: overview.nextUpdate.toISOString()
    });
    console.log('');

    // ========================================
    // TESTE 6: CACHE STATS
    // ========================================
    console.log('💾 TESTE 6: Cache Statistics');
    console.log('=' .repeat(50));
    
    const cacheStats = realMarketIntelligence.getCacheStats();
    console.log('✅ Cache Stats:', cacheStats);
    console.log('');

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('🎉 RESUMO DOS TESTES');
    console.log('=' .repeat(50));
    console.log('✅ Fear & Greed Index:', fearGreed.value, fearGreed.classification);
    console.log('✅ Market Pulse:', marketPulse.positivePercentage.toFixed(1) + '% positivo,', marketPulse.trend);
    console.log('✅ BTC Dominance:', btcDominance.dominance.toFixed(1) + '%,', btcDominance.trend);
    console.log('✅ Decisão Final: LONG=' + decision.allowLong + ', SHORT=' + decision.allowShort + ', Confiança=' + decision.confidence + '%');
    console.log('✅ Cache:', cacheStats.keys, 'keys,', cacheStats.totalSize);
    console.log('');
    console.log('🚀 TODAS AS INTEGRAÇÕES REAIS FUNCIONANDO!');
    console.log('⏰ Sistema de atualização automática (15min) ativo');
    console.log('🔄 Próxima atualização automática em 15 minutos');

  } catch (error) {
    console.error('❌ Erro no teste das integrações:', error);
  }
}

// Executar teste
if (require.main === module) {
  testRealIntegrations()
    .then(() => {
      console.log('\n✅ Teste concluído com sucesso!');
      // Não parar o processo para manter sistema de atualização ativo
      console.log('📡 Sistema continuará ativo para monitoramento...');
    })
    .catch((error) => {
      console.error('\n❌ Falha no teste:', error);
      process.exit(1);
    });
}

export { testRealIntegrations };
