// ========================================
// MARKETBOT - MARKET INTELLIGENCE SERVICE - INTEGRAÇÃO REAL
// Serviço central de inteligência de mercado com APIs reais
// CoinStats + Binance + OpenAI + Atualizações 15min
// ========================================

import axios from 'axios';
import OpenAI from 'openai';
import {
  FearGreedIndex,
  MarketPulseData,
  BinanceCoinData,
  BTCDominance,
  MarketDecision,
  AIAnalysisRequest,
  AIAnalysisResponse,
  MarketDataSource,
  TradingConfig
} from '../types/market.types.js';

// Cache simples interno
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, value: T, ttlSeconds: number = 900): void { // 15min default
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { keys: number; totalSize: string } {
    const totalBytes = JSON.stringify([...this.cache.entries()]).length;
    return {
      keys: this.cache.size,
      totalSize: `${(totalBytes / 1024).toFixed(2)} KB`
    };
  }
}

class RealMarketIntelligenceService {
  private static instance: RealMarketIntelligenceService;
  private cache: SimpleCache;
  private openai: OpenAI | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  
  private config: TradingConfig = {
    fearGreedThresholds: {
      extremeFear: 30,
      extremeGreed: 80
    },
    marketPulseThresholds: {
      bullishPositive: 60,
      bearishNegative: 60,
      volumeDeltaPositive: 0.5,
      volumeDeltaNegative: -0.5
    },
    btcDominanceThresholds: {
      highDominance: 50,
      lowDominance: 45
    },
    aiConfig: {
      enabled: true,
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.1,
      fallbackToAlgorithmic: true
    },
    cacheConfig: {
      fearGreedCacheMinutes: 15,
      marketPulseCacheMinutes: 15,
      btcDominanceCacheMinutes: 15,
      binanceDataCacheMinutes: 15
    }
  };

  private constructor() {
    this.cache = new SimpleCache();
    
    // Inicializar OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI inicializado para análise de mercado');
    } else {
      console.log('⚠️ OpenAI não configurado - usando apenas análise algorítmica');
    }

    // Iniciar sistema de atualização automática a cada 15 minutos
    this.startAutoUpdate();
  }

  static getInstance(): RealMarketIntelligenceService {
    if (!RealMarketIntelligenceService.instance) {
      RealMarketIntelligenceService.instance = new RealMarketIntelligenceService();
    }
    return RealMarketIntelligenceService.instance;
  }

  // ========================================
  // SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA
  // ========================================

  private startAutoUpdate(): void {
    console.log('🔄 Iniciando sistema de atualização automática (15min)...');
    
    // Primeira atualização imediata
    this.updateAllMarketData();
    
    // Configurar atualização a cada 15 minutos
    this.updateInterval = setInterval(() => {
      console.log('⏰ Executando atualização automática de 15min...');
      this.updateAllMarketData();
    }, 15 * 60 * 1000); // 15 minutos
  }

  private async updateAllMarketData(): Promise<void> {
    try {
      console.log('🔄 Atualizando todos os dados de mercado...');
      
      // Atualizar todos os dados em paralelo
      await Promise.allSettled([
        this.getFearGreedIndex(),
        this.getMarketPulse(),
        this.getBTCDominance()
      ]);
      
      console.log('✅ Atualização automática concluída');
    } catch (error) {
      console.error('❌ Erro na atualização automática:', error);
    }
  }

  public stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Sistema de atualização automática parado');
    }
  }

  // ========================================
  // FEAR & GREED INDEX - COINSTATS API
  // ========================================

  async getFearGreedIndex(): Promise<FearGreedIndex> {
    const cacheKey = 'fear_greed_index';
    const cached = this.cache.get<FearGreedIndex>(cacheKey);
    
    if (cached) {
      console.log('📊 Fear & Greed Index (cache):', cached.value, cached.classification);
      return cached;
    }

    try {
      console.log('🔄 Buscando Fear & Greed Index na CoinStats...');
      
      // Fonte primária: CoinStats API
      const response = await axios.get(process.env.COINSTATS_FEAR_GREED_URL!, {
        headers: {
          'X-API-KEY': process.env.COINSTATS_API_KEY!,
          'accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('📈 Resposta CoinStats Fear & Greed:', response.data);

      const data = response.data;
      let fearGreed: FearGreedIndex;

      // Adaptar estrutura da resposta CoinStats
      if (data.value !== undefined) {
        fearGreed = {
          value: parseInt(data.value),
          classification: this.classifyFearGreed(parseInt(data.value)),
          timestamp: new Date(),
          source: MarketDataSource.COINSTATS
        };
      } else if (data.data && data.data.length > 0) {
        const fgData = data.data[0];
        fearGreed = {
          value: parseInt(fgData.value || fgData.fgi || fgData.index),
          classification: fgData.classification || this.classifyFearGreed(parseInt(fgData.value || fgData.fgi || fgData.index)),
          timestamp: new Date(),
          source: MarketDataSource.COINSTATS
        };
      } else {
        throw new Error('Formato de resposta inesperado da CoinStats');
      }

      // Cache por 15 minutos
      this.cache.set(cacheKey, fearGreed, this.config.cacheConfig.fearGreedCacheMinutes * 60);
      
      console.log('✅ Fear & Greed Index atualizado:', fearGreed.value, fearGreed.classification);
      return fearGreed;

    } catch (error) {
      console.error('❌ Erro ao buscar Fear & Greed Index:', error);
      
      // Fallback para Alternative.me se CoinStats falhar
      try {
        console.log('🔄 Tentando fallback Alternative.me...');
        const fallbackResponse = await axios.get('https://api.alternative.me/fng/', {
          timeout: 10000
        });

        const fallbackData = fallbackResponse.data.data[0];
        const fearGreed: FearGreedIndex = {
          value: parseInt(fallbackData.value),
          classification: fallbackData.value_classification,
          timestamp: new Date(),
          source: MarketDataSource.ALTERNATIVE_ME
        };

        this.cache.set(cacheKey, fearGreed, this.config.cacheConfig.fearGreedCacheMinutes * 60);
        console.log('✅ Fear & Greed Index (fallback):', fearGreed.value, fearGreed.classification);
        return fearGreed;

      } catch (fallbackError) {
        console.error('❌ Erro no fallback Alternative.me:', fallbackError);
        
        // Retornar valor neutro como último recurso
        return {
          value: 50,
          classification: 'Neutral',
          timestamp: new Date(),
          source: MarketDataSource.COINSTATS
        };
      }
    }
  }

  private classifyFearGreed(value: number): 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed' {
    if (value <= 25) return 'Extreme Fear';
    if (value <= 45) return 'Fear';
    if (value <= 55) return 'Neutral';
    if (value <= 75) return 'Greed';
    return 'Extreme Greed';
  }

  // ========================================
  // MARKET PULSE TOP 100 BINANCE - ATUALIZADO
  // ========================================

  async getMarketPulse(): Promise<MarketPulseData> {
    const cacheKey = 'market_pulse';
    const cached = this.cache.get<MarketPulseData>(cacheKey);
    
    if (cached) {
      console.log('🔄 Market Pulse (cache):', cached.positivePercentage.toFixed(1) + '% pos');
      return cached;
    }

    try {
      console.log('🔄 Buscando Market Pulse da Binance...');
      
      // Obter TOP 100 moedas por volume (USDT pairs) com chave API real
      const response = await axios.get(`${process.env.BINANCE_BASE_URL}/api/v3/ticker/24hr`, {
        headers: {
          'X-MBX-APIKEY': process.env.BINANCE_API_KEY
        },
        timeout: 15000
      });

      // Filtrar apenas pares USDT e ordenar por volume
      const usdtPairs = response.data
        .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 100); // TOP 100

      console.log(`📊 Analisando ${usdtPairs.length} pares USDT da Binance`);

      const totalCoins = usdtPairs.length;
      let positiveCoins = 0;
      let negativeCoins = 0;
      let neutralCoins = 0;
      let totalVolumeWeighted = 0;
      let totalVolume = 0;

      usdtPairs.forEach((ticker: any) => {
        const change = parseFloat(ticker.priceChangePercent);
        const volume = parseFloat(ticker.quoteVolume);
        
        if (change > 0.1) {
          positiveCoins++;
        } else if (change < -0.1) {
          negativeCoins++;
        } else {
          neutralCoins++;
        }

        totalVolumeWeighted += change * volume;
        totalVolume += volume;
      });

      const positivePercentage = (positiveCoins / totalCoins) * 100;
      const negativePercentage = (negativeCoins / totalCoins) * 100;
      const volumeWeightedDelta = totalVolume > 0 ? totalVolumeWeighted / totalVolume : 0;

      // Determinar tendência
      let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      
      if (positivePercentage >= this.config.marketPulseThresholds.bullishPositive && 
          volumeWeightedDelta > this.config.marketPulseThresholds.volumeDeltaPositive) {
        trend = 'BULLISH';
      } else if (negativePercentage >= this.config.marketPulseThresholds.bearishNegative && 
                 volumeWeightedDelta < this.config.marketPulseThresholds.volumeDeltaNegative) {
        trend = 'BEARISH';
      }

      const marketPulse: MarketPulseData = {
        totalCoins,
        positiveCoins,
        negativeCoins,
        neutralCoins,
        positivePercentage,
        negativePercentage,
        volumeWeightedDelta,
        trend,
        timestamp: new Date()
      };

      // Cache por 15 minutos
      this.cache.set(cacheKey, marketPulse, this.config.cacheConfig.marketPulseCacheMinutes * 60);
      
      console.log(`✅ Market Pulse atualizado: ${positivePercentage.toFixed(1)}% pos, ${trend}`);
      return marketPulse;

    } catch (error) {
      console.error('❌ Erro ao obter Market Pulse:', error);
      
      // Fallback para estado neutro
      const fallback: MarketPulseData = {
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
      
      this.cache.set(cacheKey, fallback, 60);
      return fallback;
    }
  }

  // ========================================
  // BTC DOMINANCE - COINSTATS API
  // ========================================

  async getBTCDominance(): Promise<BTCDominance> {
    const cacheKey = 'btc_dominance';
    const cached = this.cache.get<BTCDominance>(cacheKey);
    
    if (cached) {
      console.log('₿ BTC Dominance (cache):', cached.dominance.toFixed(1) + '%');
      return cached;
    }

    try {
      console.log('🔄 Buscando BTC Dominance na CoinStats...');
      
      // CoinStats API para BTC Dominance
      const response = await axios.get(`${process.env.COINSTATS_MARKETS_URL}/bitcoin`, {
        headers: {
          'X-API-KEY': process.env.COINSTATS_API_KEY!,
          'accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('₿ Resposta CoinStats BTC:', response.data);

      let dominanceValue = 0;
      const data = response.data;

      // Tentar extrair dominância de diferentes campos possíveis
      if (data.dominance !== undefined) {
        dominanceValue = parseFloat(data.dominance);
      } else if (data.marketCapDominance !== undefined) {
        dominanceValue = parseFloat(data.marketCapDominance);
      } else if (data.data && data.data.dominance !== undefined) {
        dominanceValue = parseFloat(data.data.dominance);
      } else if (data.coin && data.coin.dominance !== undefined) {
        dominanceValue = parseFloat(data.coin.dominance);
      } else {
        // Se não encontrar dominância, vamos tentar calcular via market cap global
        console.log('🔄 Tentando método alternativo para BTC Dominance...');
        const globalResponse = await axios.get(`${process.env.COINSTATS_MARKETS_URL}`, {
          headers: {
            'X-API-KEY': process.env.COINSTATS_API_KEY!,
            'accept': 'application/json'
          },
          params: {
            limit: 10
          },
          timeout: 15000
        });

        if (globalResponse.data && globalResponse.data.coins) {
          const btcCoin = globalResponse.data.coins.find((coin: any) => 
            coin.symbol === 'BTC' || coin.id === 'bitcoin'
          );
          
          if (btcCoin && btcCoin.marketCap) {
            const totalMarketCap = globalResponse.data.coins.reduce((sum: number, coin: any) => 
              sum + (parseFloat(coin.marketCap) || 0), 0
            );
            dominanceValue = (parseFloat(btcCoin.marketCap) / totalMarketCap) * 100;
          }
        }
      }

      // Se ainda não conseguiu obter, usar fallback CoinGecko
      if (dominanceValue === 0) {
        console.log('🔄 Fallback para CoinGecko...');
        const fallbackResponse = await axios.get('https://api.coingecko.com/api/v3/global', {
          timeout: 10000
        });
        
        dominanceValue = fallbackResponse.data.data.market_cap_percentage.btc;
      }

      // Determinar tendência baseada em mudanças recentes
      const previousKey = 'btc_dominance_previous';
      const previousDominance = this.cache.get<number>(previousKey) || dominanceValue;
      
      let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
      let recommendation: 'LONG_ALTCOINS' | 'SHORT_ALTCOINS' | 'NEUTRAL' = 'NEUTRAL';

      const changePercent = ((dominanceValue - previousDominance) / previousDominance) * 100;
      
      if (Math.abs(changePercent) > 0.5) {
        trend = changePercent > 0 ? 'RISING' : 'FALLING';
        
        // Recomendações baseadas na dominância e tendência
        if (dominanceValue >= this.config.btcDominanceThresholds.highDominance && trend === 'RISING') {
          recommendation = 'SHORT_ALTCOINS';
        } else if (dominanceValue <= this.config.btcDominanceThresholds.lowDominance && trend === 'FALLING') {
          recommendation = 'LONG_ALTCOINS';
        }
      }

      const btcDominance: BTCDominance = {
        dominance: dominanceValue,
        trend,
        recommendation,
        timestamp: new Date()
      };

      // Cache por 15 minutos
      this.cache.set(cacheKey, btcDominance, this.config.cacheConfig.btcDominanceCacheMinutes * 60);
      this.cache.set(previousKey, dominanceValue, 60 * 60); // Manter por 1 hora para comparação
      
      console.log(`✅ BTC Dominance atualizado: ${dominanceValue.toFixed(1)}% (${trend})`);
      return btcDominance;

    } catch (error) {
      console.error('❌ Erro ao obter BTC Dominance:', error);
      
      // Fallback para valor médio histórico
      const fallback: BTCDominance = {
        dominance: 50.0,
        trend: 'STABLE',
        recommendation: 'NEUTRAL',
        timestamp: new Date()
      };
      
      this.cache.set(cacheKey, fallback, 60);
      return fallback;
    }
  }

  // ========================================
  // ANÁLISE OPENAI PARA MARKET INTELLIGENCE
  // ========================================

  async getAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> {
    if (!this.openai || !this.config.aiConfig.enabled) {
      console.log('⚠️ OpenAI não configurado - pulando análise IA');
      return null;
    }

    try {
      console.log('🤖 Iniciando análise OpenAI...');
      
      const prompt = this.buildAIPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: this.config.aiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um analista expert em mercados financeiros e criptomoedas. Forneça análises precisas e objetivas baseadas nos dados fornecidos. Responda SEMPRE em formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.aiConfig.maxTokens,
        temperature: this.config.aiConfig.temperature
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Resposta vazia da OpenAI');
      }

      // Tentar extrair análise estruturada
      const analysis = this.parseAIResponse(aiResponse);
      
      console.log('✅ Análise OpenAI concluída:', analysis.confidence + '% confiança');
      return analysis;

    } catch (error) {
      console.error('❌ Erro na análise OpenAI:', error);
      return null;
    }
  }

  private buildAIPrompt(request: AIAnalysisRequest): string {
    return `
Analise os seguintes dados de mercado de criptomoedas e forneça uma decisão de trading estruturada:

FEAR & GREED INDEX: ${request.fearGreedIndex.value} (${request.fearGreedIndex.classification})
MARKET PULSE: ${request.marketPulse.positivePercentage.toFixed(1)}% positivo, ${request.marketPulse.trend}
BTC DOMINANCE: ${request.btcDominance.dominance.toFixed(1)}% (${request.btcDominance.trend})

Com base nestes indicadores, forneça sua análise em formato JSON:
{
  "decision": "LONG_ONLY|SHORT_ONLY|BOTH|NONE",
  "confidence": number (0-100),
  "reasoning": "análise detalhada",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendedPositionSize": number (10-50),
  "timeframe": "SHORT|MEDIUM|LONG"
}

Critérios:
- Fear & Greed < 30: Favorece LONG
- Fear & Greed > 70: Favorece SHORT
- Market Pulse > 60% BULLISH: Favorece LONG
- Market Pulse > 60% BEARISH: Favorece SHORT
- BTC Dominance em queda: Favorece ALTCOINS (LONG)
- BTC Dominance em alta: Favorece BTC (SHORT altcoins)
`;
  }

  private parseAIResponse(response: string): AIAnalysisResponse {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          decision: parsed.decision || 'BOTH',
          confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence) || 50)),
          reasoning: parsed.reasoning || 'Análise IA disponível',
          riskLevel: parsed.riskLevel || 'MEDIUM',
          recommendedPositionSize: parsed.recommendedPositionSize || 30,
          timeframe: parsed.timeframe || 'MEDIUM'
        };
      }
    } catch (error) {
      console.error('Erro ao parsear resposta IA:', error);
    }

    // Fallback se não conseguir parsear
    return {
      decision: 'BOTH',
      confidence: 50,
      reasoning: 'Análise IA indisponível - usando padrão',
      riskLevel: 'MEDIUM',
      recommendedPositionSize: 30,
      timeframe: 'MEDIUM'
    };
  }

  // ========================================
  // DECISÃO FINAL DE MERCADO
  // ========================================

  async getMarketDecision(): Promise<MarketDecision> {
    console.log('🎯 Calculando decisão final de mercado...');
    
    try {
      // Obter todos os dados de mercado
      const [fearGreed, marketPulse, btcDominance] = await Promise.all([
        this.getFearGreedIndex(),
        this.getMarketPulse(),
        this.getBTCDominance()
      ]);

      // Análise algorítmica
      let allowLong = true;
      let allowShort = true;
      let confidence = 50;
      const reasons: string[] = [];
      
      // Fear & Greed tem PRIORIDADE ABSOLUTA
      if (fearGreed.value < this.config.fearGreedThresholds.extremeFear) {
        allowShort = false; // SOMENTE LONG
        confidence += 20;
        reasons.push(`Fear & Greed ${fearGreed.value} < ${this.config.fearGreedThresholds.extremeFear}: SOMENTE LONG`);
      } else if (fearGreed.value > this.config.fearGreedThresholds.extremeGreed) {
        allowLong = false; // SOMENTE SHORT
        confidence += 20;
        reasons.push(`Fear & Greed ${fearGreed.value} > ${this.config.fearGreedThresholds.extremeGreed}: SOMENTE SHORT`);
      }

      // Market Pulse Analysis
      if (marketPulse.trend === 'BULLISH') {
        confidence += 10;
        reasons.push(`Market ${marketPulse.positivePercentage.toFixed(1)}% bullish`);
      } else if (marketPulse.trend === 'BEARISH') {
        confidence += 10;
        reasons.push(`Market ${marketPulse.negativePercentage.toFixed(1)}% bearish`);
      }

      // BTC Dominance influence
      if (btcDominance.recommendation === 'LONG_ALTCOINS') {
        confidence += 5;
        reasons.push(`BTC Dom favorável altcoins`);
      } else if (btcDominance.recommendation === 'SHORT_ALTCOINS') {
        confidence += 5;
        reasons.push(`BTC Dom desfavorável altcoins`);
      }

      // Tentar análise IA
      let aiAnalysis: AIAnalysisResponse | null = null;
      if (this.openai) {
        aiAnalysis = await this.getAIAnalysis({
          fearGreedIndex: fearGreed,
          marketPulse,
          btcDominance,
          recentTrends: {
            fearGreed15min: fearGreed.value,
            fearGreed30min: fearGreed.value,
            marketPulse15min: marketPulse,
            marketPulse30min: marketPulse
          }
        });
      }

      // Aplicar análise IA se disponível
      if (aiAnalysis) {
        // IA pode refinar, mas não sobrescrever Fear & Greed extremos
        if (fearGreed.value >= this.config.fearGreedThresholds.extremeFear && 
            fearGreed.value <= this.config.fearGreedThresholds.extremeGreed) {
          
          // Converter decisão IA para allowLong/allowShort
          switch (aiAnalysis.decision) {
            case 'LONG_ONLY':
              allowLong = true;
              allowShort = false;
              break;
            case 'SHORT_ONLY':
              allowLong = false;
              allowShort = true;
              break;
            case 'BOTH':
              allowLong = true;
              allowShort = true;
              break;
            case 'NONE':
              allowLong = false;
              allowShort = false;
              break;
          }
        }
        
        confidence = Math.min(100, Math.max(confidence, aiAnalysis.confidence));
        reasons.push(aiAnalysis.reasoning);
      }

      const decision: MarketDecision = {
        allowLong,
        allowShort,
        confidence: Math.min(100, confidence),
        reasons,
        fearGreedInfluence: `${fearGreed.classification} ${fearGreed.value}`,
        marketPulseInfluence: `${marketPulse.trend} ${marketPulse.positivePercentage.toFixed(1)}%`,
        btcDominanceInfluence: `${btcDominance.trend} ${btcDominance.dominance.toFixed(1)}%`,
        aiAnalysis: aiAnalysis ? JSON.stringify(aiAnalysis) : undefined,
        timestamp: new Date()
      };

      console.log(`🎯 Decisão final: LONG=${allowLong}, SHORT=${allowShort}, Confiança=${confidence}%`);
      return decision;

    } catch (error) {
      console.error('❌ Erro ao calcular decisão de mercado:', error);
      
      // Fallback para posição neutra
      return {
        allowLong: true,
        allowShort: true,
        confidence: 30,
        reasons: ['Erro na análise - posição neutra'],
        fearGreedInfluence: 'Indisponível',
        marketPulseInfluence: 'Indisponível',
        btcDominanceInfluence: 'Indisponível',
        timestamp: new Date()
      };
    }
  }

  // ========================================
  // OVERVIEW COMPLETO
  // ========================================

  async getMarketOverview() {
    const [fearGreed, marketPulse, btcDominance, decision] = await Promise.all([
      this.getFearGreedIndex(),
      this.getMarketPulse(),
      this.getBTCDominance(),
      this.getMarketDecision()
    ]);

    return {
      fearGreed,
      marketPulse,
      btcDominance,
      decision,
      cache: this.cache.getStats(),
      lastUpdate: new Date(),
      nextUpdate: new Date(Date.now() + 15 * 60 * 1000) // +15min
    };
  }

  // ========================================
  // UTILITÁRIOS E CACHE
  // ========================================

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache de market intelligence limpo');
  }

  getConfig(): TradingConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<TradingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração de market intelligence atualizada');
  }
}

// Exportar instância singleton
export const realMarketIntelligence = RealMarketIntelligenceService.getInstance();
export default RealMarketIntelligenceService;
