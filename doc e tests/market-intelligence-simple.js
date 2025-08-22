// ========================================
// MARKETBOT - MARKET INTELLIGENCE SIMPLIFIED
// Versão simplificada sem OpenAI para teste
// ========================================

const axios = require('axios');

class MarketIntelligenceServiceSimple {
  constructor() {
    this.cache = new Map();
    console.log('📊 Market Intelligence Service iniciado (versão simplificada)');
  }

  // Cache simples
  setCache(key, value, ttlMinutes = 5) {
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, { data: value, expiresAt });
  }

  getCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  // Fear & Greed Index
  async getFearGreedIndex() {
    const cacheKey = 'fear_greed_index';
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log('📊 Fear & Greed Index (cache):', cached.value, cached.classification);
      return cached;
    }

    try {
      const response = await axios.get('https://api.alternative.me/fng/', {
        timeout: 10000
      });

      const data = response.data.data[0];
      const fearGreed = {
        value: parseInt(data.value),
        classification: data.value_classification,
        timestamp: new Date(),
        source: 'ALTERNATIVE_ME'
      };

      this.setCache(cacheKey, fearGreed, 5);
      console.log('📊 Fear & Greed Index (API):', fearGreed.value, fearGreed.classification);
      return fearGreed;

    } catch (error) {
      console.error('❌ Erro ao obter Fear & Greed Index:', error.message);
      
      const fallback = {
        value: 50,
        classification: 'Neutral',
        timestamp: new Date(),
        source: 'FALLBACK'
      };
      
      this.setCache(cacheKey, fallback, 1);
      return fallback;
    }
  }

  // Market Pulse
  async getMarketPulse() {
    const cacheKey = 'market_pulse';
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log('🔄 Market Pulse (cache):', cached.positivePercentage.toFixed(1) + '% pos');
      return cached;
    }

    try {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        timeout: 15000
      });

      const usdtPairs = response.data
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 100);

      const totalCoins = usdtPairs.length;
      let positiveCoins = 0;
      let negativeCoins = 0;
      let totalVolumeWeighted = 0;
      let totalVolume = 0;

      usdtPairs.forEach(ticker => {
        const change = parseFloat(ticker.priceChangePercent);
        const volume = parseFloat(ticker.quoteVolume);
        
        if (change > 0.1) {
          positiveCoins++;
        } else if (change < -0.1) {
          negativeCoins++;
        }

        totalVolumeWeighted += change * volume;
        totalVolume += volume;
      });

      const positivePercentage = (positiveCoins / totalCoins) * 100;
      const negativePercentage = (negativeCoins / totalCoins) * 100;
      const volumeWeightedDelta = totalVolume > 0 ? totalVolumeWeighted / totalVolume : 0;

      let trend = 'NEUTRAL';
      if (positivePercentage >= 60 && volumeWeightedDelta > 0.5) {
        trend = 'BULLISH';
      } else if (negativePercentage >= 60 && volumeWeightedDelta < -0.5) {
        trend = 'BEARISH';
      }

      const marketPulse = {
        totalCoins,
        positiveCoins,
        negativeCoins,
        neutralCoins: totalCoins - positiveCoins - negativeCoins,
        positivePercentage,
        negativePercentage,
        volumeWeightedDelta,
        trend,
        timestamp: new Date()
      };

      this.setCache(cacheKey, marketPulse, 2);
      console.log(`🔄 Market Pulse (API): ${positivePercentage.toFixed(1)}% pos, ${trend}`);
      return marketPulse;

    } catch (error) {
      console.error('❌ Erro ao obter Market Pulse:', error.message);
      
      const fallback = {
        totalCoins: 100,
        positiveCoins: 50,
        negativeCoins: 50,
        neutralCoins: 0,
        positivePercentage: 50,
        negativePercentage: 50,
        volumeWeightedDelta: 0,
        trend: 'NEUTRAL',
        timestamp: new Date()
      };
      
      this.setCache(cacheKey, fallback, 1);
      return fallback;
    }
  }

  // BTC Dominance
  async getBTCDominance() {
    const cacheKey = 'btc_dominance';
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log('₿ BTC Dominance (cache):', cached.dominance.toFixed(1) + '%');
      return cached;
    }

    try {
      // Usando API alternativa público
      const response = await axios.get('https://api.coinmarketcap.com/data-api/v3/global-metrics/quotes/latest', {
        timeout: 10000
      });

      const dominance = response.data.data.btcDominance;
      
      const btcDominance = {
        dominance,
        trend: 'STABLE',
        recommendation: 'NEUTRAL',
        timestamp: new Date()
      };

      this.setCache(cacheKey, btcDominance, 10);
      console.log(`₿ BTC Dominance (API): ${dominance.toFixed(1)}%`);
      return btcDominance;

    } catch (error) {
      console.error('❌ Erro ao obter BTC Dominance:', error.message);
      
      const fallback = {
        dominance: 50,
        trend: 'STABLE',
        recommendation: 'NEUTRAL',
        timestamp: new Date()
      };
      
      this.setCache(cacheKey, fallback, 1);
      return fallback;
    }
  }

  // Decisão de Mercado
  async getMarketDecision() {
    console.log('\n🎯 INICIANDO ANÁLISE DE MERCADO...\n');
    
    try {
      const [fearGreed, marketPulse, btcDominance] = await Promise.all([
        this.getFearGreedIndex(),
        this.getMarketPulse(),
        this.getBTCDominance()
      ]);

      let allowLong = true;
      let allowShort = true;
      const reasons = [];
      let confidence = 50;

      // REGRA 1: Fear & Greed Index (prevalece sempre)
      if (fearGreed.value < 30) {
        allowShort = false;
        reasons.push(`Fear & Greed ${fearGreed.value} < 30: SOMENTE LONG`);
        confidence += 20;
      } else if (fearGreed.value > 80) {
        allowLong = false;
        reasons.push(`Fear & Greed ${fearGreed.value} > 80: SOMENTE SHORT`);
        confidence += 20;
      } else {
        reasons.push(`Fear & Greed ${fearGreed.value}: NEUTRO`);
      }

      // REGRA 2: Market Pulse
      if (marketPulse.trend === 'BULLISH') {
        reasons.push(`Market Pulse: ${marketPulse.positivePercentage.toFixed(1)}% positivo - BULLISH`);
        confidence += 10;
      } else if (marketPulse.trend === 'BEARISH') {
        reasons.push(`Market Pulse: ${marketPulse.negativePercentage.toFixed(1)}% negativo - BEARISH`);
        confidence += 10;
      } else {
        reasons.push(`Market Pulse: NEUTRO`);
      }

      // REGRA 3: BTC Dominance (informativo)
      if (btcDominance.dominance >= 50) {
        reasons.push(`BTC Dom ${btcDominance.dominance.toFixed(1)}%: Alta`);
      } else if (btcDominance.dominance <= 45) {
        reasons.push(`BTC Dom ${btcDominance.dominance.toFixed(1)}%: Baixa - Favorável ALTCOINS`);
        confidence += 5;
      }

      const decision = {
        allowLong,
        allowShort,
        confidence: Math.min(Math.max(confidence, 0), 100),
        reasons,
        fearGreedInfluence: `${fearGreed.value} (${fearGreed.classification})`,
        marketPulseInfluence: `${marketPulse.trend} (${marketPulse.positivePercentage.toFixed(1)}% pos)`,
        btcDominanceInfluence: `${btcDominance.dominance.toFixed(1)}% (${btcDominance.trend})`,
        timestamp: new Date()
      };

      console.log('\n📊 DECISÃO FINAL:');
      console.log(`   LONG: ${allowLong ? '✅' : '❌'} | SHORT: ${allowShort ? '✅' : '❌'}`);
      console.log(`   Confiança: ${confidence}%`);
      console.log(`   Razões: ${reasons.join(' | ')}\n`);

      return decision;

    } catch (error) {
      console.error('❌ Erro na análise de mercado:', error);
      
      return {
        allowLong: true,
        allowShort: true,
        confidence: 25,
        reasons: ['Erro na análise - usando configuração padrão'],
        fearGreedInfluence: 'N/A',
        marketPulseInfluence: 'N/A',
        btcDominanceInfluence: 'N/A',
        timestamp: new Date()
      };
    }
  }

  getCacheStats() {
    return {
      keys: this.cache.size,
      stats: {
        keys: this.cache.size,
        ksize: this.cache.size,
        vsize: 0
      }
    };
  }
}

module.exports = MarketIntelligenceServiceSimple;
