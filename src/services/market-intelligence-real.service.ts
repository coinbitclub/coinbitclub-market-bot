// ========================================
// MARKETBOT - MARKET INTELLIGENCE SERVICE - INTEGRAÇÃO REAL
// Serviço central de inteligência de mercado com APIs reais
// CoinStats + Binance + OpenAI + Atualizações 15min
// ========================================

import axios from 'axios';
import OpenAI from 'openai';
import database from '../config/database.js';
import {
  FearGreedIndex,
  MarketPulseData,
  BinanceCoinData,
  BTCDominance,
  MarketDecision,
  AIAnalysisRequest,
  AIAnalysisResponse,
  MarketDataSource,
  TradingConfig,
  MarketDataSnapshot,
  AIOptimizationConfig,
  CostOptimizationStats
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
  private aiOptimizationInterval: NodeJS.Timeout | null = null;
  
  // ========================================
  // SISTEMA DE OTIMIZAÇÃO DE CUSTOS IA
  // ========================================
  private lastMarketSnapshot: MarketDataSnapshot | null = null;
  private aiOptimizationStats: CostOptimizationStats = {
    totalAICalls: 0,
    aiCallsSavedByCache: 0,
    aiCallsSavedByThreshold: 0,
    costSavingPercentage: 0,
    lastAIAnalysis: null,
    nextScheduledAnalysis: null
  };
  
  private aiOptimizationConfig: AIOptimizationConfig = {
    enableSmartAnalysis: true,
    significantChangeThreshold: 3, // 3% mudança para triggerar IA extra
    maxAICallsPerHour: 8,         // Máximo 8 calls por hora (permitir 1 a cada 15min + extras)
    forceAIOnExtremes: true,      // Força IA em Fear/Greed extremos
    emergencyOverride: false      // Override para emergências
  };
  
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
      maxTokens: 800, // Reduzido para economizar
      temperature: 0.1,
      fallbackToAlgorithmic: true,
      smartAnalysisEnabled: true, // Nova funcionalidade
      onlyAnalyzeOnSignificantChange: true // Só analisa se houver mudança significativa
    },
    cacheConfig: {
      fearGreedCacheMinutes: 15,
      marketPulseCacheMinutes: 15,
      btcDominanceCacheMinutes: 15,
      binanceDataCacheMinutes: 15,
      aiAnalysisCacheMinutes: 15, // Cache específico para análise IA
      smartCacheEnabled: true // Cache inteligente
    },
    updateSchedule: {
      marketDataIntervalMinutes: 15, // Dados de mercado a cada 15min
      aiAnalysisIntervalMinutes: 15,  // IA executada junto com dados a cada 15min
      onlyUpdateOnChange: false,      // IA sempre executa a cada 15min
      significantChangeThreshold: 3   // Mudança mínima para análise IA adicional (%)
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
    
    // Iniciar sistema de otimização de IA
    this.initializeAIOptimization();
  }

  // ========================================
  // FUNÇÕES PARA SALVAR NO BANCO DE DADOS
  // ========================================

  private async saveFearGreedToDatabase(data: FearGreedIndex): Promise<void> {
    try {
      await database.query(`
        INSERT INTO market_fear_greed_history (
          value, classification, source, raw_data
        ) VALUES ($1, $2, $3, $4)
      `, [
        data.value,
        data.classification,
        data.source,
        JSON.stringify(data)
      ]);
      console.log('💾 Fear & Greed Index salvo no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao salvar Fear & Greed no banco:', error);
    }
  }

  private async saveMarketPulseToDatabase(data: MarketPulseData): Promise<void> {
    try {
      await database.query(`
        INSERT INTO market_pulse_history (
          total_coins, positive_coins, negative_coins, neutral_coins,
          positive_percentage, negative_percentage, volume_weighted_delta,
          trend, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        data.totalCoins,
        data.positiveCoins,
        data.negativeCoins,
        data.neutralCoins,
        data.positivePercentage,
        data.negativePercentage,
        data.volumeWeightedDelta,
        data.trend,
        JSON.stringify(data)
      ]);
      console.log('💾 Market Pulse salvo no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao salvar Market Pulse no banco:', error);
    }
  }

  private async saveBTCDominanceToDatabase(data: BTCDominance): Promise<void> {
    try {
      await database.query(`
        INSERT INTO market_btc_dominance_history (
          dominance, trend, recommendation, source, raw_data
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        data.dominance,
        data.trend,
        data.recommendation,
        'COINSTATS',
        JSON.stringify(data)
      ]);
      console.log('💾 BTC Dominance salvo no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao salvar BTC Dominance no banco:', error);
    }
  }

  private async saveMarketDecisionToDatabase(data: MarketDecision): Promise<void> {
    try {
      await database.query(`
        INSERT INTO market_decisions (
          allow_long, allow_short, confidence, 
          fear_greed_influence, market_pulse_influence, btc_dominance_influence,
          reasons, ai_analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        data.allowLong,
        data.allowShort,
        data.confidence,
        data.fearGreedInfluence,
        data.marketPulseInfluence,
        data.btcDominanceInfluence,
        data.reasons,
        data.aiAnalysis || null
      ]);
      console.log('💾 Market Decision salva no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao salvar Market Decision no banco:', error);
    }
  }

  static getInstance(): RealMarketIntelligenceService {
    if (!RealMarketIntelligenceService.instance) {
      RealMarketIntelligenceService.instance = new RealMarketIntelligenceService();
    }
    return RealMarketIntelligenceService.instance;
  }

  // ========================================
  // SISTEMA DE OTIMIZAÇÃO DE CUSTOS IA
  // ========================================

  private initializeAIOptimization(): void {
    console.log('🤖 Inicializando sistema de otimização de custos IA...');
    
    // Agendar próxima análise IA para 15 minutos (junto com dados de mercado)
    this.aiOptimizationStats.nextScheduledAnalysis = new Date(Date.now() + 15 * 60 * 1000);
    
    console.log('✅ Sistema de otimização IA configurado - análise a cada 15min junto com dados');
  }

  private async checkAndRunAIAnalysis(): Promise<void> {
    if (!this.openai || !this.config.aiConfig.enabled) {
      return;
    }

    try {
      // Obter dados atuais de mercado
      const currentMarketData = await this.getCurrentMarketSnapshot();
      
      // Verificar se deve executar análise IA
      const shouldRunAI = this.shouldRunAIAnalysis(currentMarketData);
      
      if (shouldRunAI.run) {
        console.log(`🤖 Executando análise IA: ${shouldRunAI.reason}`);
        
        // Executar análise IA e atualizar estatísticas
        await this.performAIAnalysisWithOptimization(currentMarketData);
        
        this.aiOptimizationStats.totalAICalls++;
        this.aiOptimizationStats.lastAIAnalysis = new Date();
      } else {
        console.log(`⏭️ Pulando análise IA: ${shouldRunAI.reason}`);
        this.aiOptimizationStats.aiCallsSavedByThreshold++;
      }
      
      // Atualizar próxima análise agendada
      this.aiOptimizationStats.nextScheduledAnalysis = new Date(Date.now() + 15 * 60 * 1000);
      
      // Calcular economia de custos
      this.updateCostSavingStats();
      
    } catch (error) {
      console.error('❌ Erro na verificação de análise IA:', error);
    }
  }

  private async getCurrentMarketSnapshot(): Promise<MarketDataSnapshot> {
    const [fearGreed, marketPulse, btcDominance] = await Promise.all([
      this.getFearGreedIndex(),
      this.getMarketPulse(),
      this.getBTCDominance()
    ]);

    return {
      fearGreedValue: fearGreed.value,
      marketPulsePositive: marketPulse.positivePercentage,
      btcDominance: btcDominance.dominance,
      timestamp: new Date()
    };
  }

  private shouldRunAIAnalysis(currentData: MarketDataSnapshot): { run: boolean; reason: string } {
    // Verificar se está em override de emergência
    if (this.aiOptimizationConfig.emergencyOverride) {
      return { run: true, reason: 'Override de emergência ativo' };
    }

    // Verificar limite de calls por hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (this.aiOptimizationStats.lastAIAnalysis && 
        this.aiOptimizationStats.lastAIAnalysis > oneHourAgo &&
        this.aiOptimizationStats.totalAICalls >= this.aiOptimizationConfig.maxAICallsPerHour) {
      return { run: false, reason: 'Limite de calls por hora atingido' };
    }

    // SEMPRE EXECUTAR IA A CADA 15 MINUTOS (agendamento regular)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (!this.aiOptimizationStats.lastAIAnalysis || 
        this.aiOptimizationStats.lastAIAnalysis < fifteenMinutesAgo) {
      this.lastMarketSnapshot = currentData;
      return { run: true, reason: 'Análise IA agendada a cada 15 minutos' };
    }

    // Forçar IA em valores extremos de Fear & Greed (análise adicional)
    if (this.aiOptimizationConfig.forceAIOnExtremes) {
      if (currentData.fearGreedValue <= 25 || currentData.fearGreedValue >= 75) {
        return { run: true, reason: `Fear & Greed extremo: ${currentData.fearGreedValue} - análise adicional` };
      }
    }

    // Verificar se não há snapshot anterior (primeira execução)
    if (!this.lastMarketSnapshot) {
      this.lastMarketSnapshot = currentData;
      return { run: true, reason: 'Primeira análise do ciclo' };
    }

    // Análise adicional para mudanças significativas (além da regular de 15min)
    const fearGreedChange = Math.abs(currentData.fearGreedValue - this.lastMarketSnapshot.fearGreedValue);
    const marketPulseChange = Math.abs(currentData.marketPulsePositive - this.lastMarketSnapshot.marketPulsePositive);
    const btcDominanceChange = Math.abs(currentData.btcDominance - this.lastMarketSnapshot.btcDominance);

    const significantChange = 
      fearGreedChange >= this.aiOptimizationConfig.significantChangeThreshold ||
      marketPulseChange >= this.aiOptimizationConfig.significantChangeThreshold ||
      btcDominanceChange >= this.aiOptimizationConfig.significantChangeThreshold;

    if (significantChange) {
      this.lastMarketSnapshot = currentData;
      return { 
        run: true, 
        reason: `Mudança significativa detectada (adicional): F&G(${fearGreedChange.toFixed(1)}), MP(${marketPulseChange.toFixed(1)}), BTC(${btcDominanceChange.toFixed(1)})` 
      };
    }

    return { run: false, reason: 'Aguardando próximo ciclo de 15 minutos' };
  }

  private async performAIAnalysisWithOptimization(currentData: MarketDataSnapshot): Promise<void> {
    // Cache key específico para análise IA baseado nos dados atuais
    const aiCacheKey = `ai_analysis_${currentData.fearGreedValue}_${Math.round(currentData.marketPulsePositive)}_${Math.round(currentData.btcDominance)}`;
    
    // Verificar cache primeiro
    const cachedAnalysis = this.cache.get<AIAnalysisResponse>(aiCacheKey);
    if (cachedAnalysis) {
      console.log('🤖 Análise IA obtida do cache');
      this.aiOptimizationStats.aiCallsSavedByCache++;
      return;
    }

    // Executar análise IA real
    const [fearGreed, marketPulse, btcDominance] = await Promise.all([
      this.getFearGreedIndex(),
      this.getMarketPulse(),
      this.getBTCDominance()
    ]);

    const aiRequest: AIAnalysisRequest = {
      fearGreedIndex: fearGreed,
      marketPulse,
      btcDominance,
      recentTrends: {
        fearGreed15min: currentData.fearGreedValue,
        fearGreed30min: currentData.fearGreedValue,
        marketPulse15min: marketPulse,
        marketPulse30min: marketPulse
      }
    };

    const aiAnalysis = await this.getAIAnalysis(aiRequest);
    
    if (aiAnalysis) {
      // Cache a análise por 15 minutos
      this.cache.set(aiCacheKey, aiAnalysis, this.config.cacheConfig.aiAnalysisCacheMinutes! * 60);
      console.log('🤖 Nova análise IA executada e cacheada');
    }
  }

  private updateCostSavingStats(): void {
    const totalPossibleCalls = this.aiOptimizationStats.totalAICalls + 
                             this.aiOptimizationStats.aiCallsSavedByCache + 
                             this.aiOptimizationStats.aiCallsSavedByThreshold;
    
    if (totalPossibleCalls > 0) {
      const callsSaved = this.aiOptimizationStats.aiCallsSavedByCache + 
                        this.aiOptimizationStats.aiCallsSavedByThreshold;
      this.aiOptimizationStats.costSavingPercentage = (callsSaved / totalPossibleCalls) * 100;
    }
  }

  // ========================================
  // SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA - OTIMIZADO
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
      
      console.log('✅ Dados de mercado atualizados');
      
      // EXECUTAR ANÁLISE IA APÓS ATUALIZAÇÃO DOS DADOS (A CADA 15MIN)
      console.log('🤖 Iniciando análise IA agendada (15min)...');
      await this.checkAndRunAIAnalysis();
      
      console.log('✅ Ciclo de atualização completo (dados + IA)');
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
    
    if (this.aiOptimizationInterval) {
      clearInterval(this.aiOptimizationInterval);
      this.aiOptimizationInterval = null;
      console.log('⏹️ Sistema de otimização IA parado');
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
      
      // Fonte primária: CoinStats API (endpoint correto)
      const response = await axios.get('https://openapiv1.coinstats.app/insights/fear-and-greed', {
        headers: {
          'X-API-KEY': process.env.COINSTATS_API_KEY!,
          'accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('📈 Resposta CoinStats Fear & Greed:', response.data);

      const data = response.data;
      let fearGreed: FearGreedIndex;

      // Adaptar estrutura da resposta CoinStats insights/fear-and-greed
      if (data.now && data.now.value !== undefined) {
        fearGreed = {
          value: parseInt(data.now.value),
          classification: data.now.value_classification || this.classifyFearGreed(parseInt(data.now.value)),
          timestamp: new Date(),
          source: MarketDataSource.COINSTATS
        };
      } else if (data.value !== undefined) {
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
      
      // Salvar no banco de dados
      await this.saveFearGreedToDatabase(fearGreed);
      
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
        
        // Salvar no banco de dados
        await this.saveFearGreedToDatabase(fearGreed);
        
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
      
      // Salvar no banco de dados
      await this.saveMarketPulseToDatabase(marketPulse);
      
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
      
      // CoinStats API para BTC Dominance (endpoint correto com parâmetro)
      const response = await axios.get('https://openapiv1.coinstats.app/insights/btc-dominance?type=24h', {
        headers: {
          'X-API-KEY': process.env.COINSTATS_API_KEY!,
          'accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('₿ Resposta CoinStats BTC Dominance:', response.data);

      let dominanceValue = 0;
      const data = response.data;

      // Extrair dominância do endpoint insights/btc-dominance (retorna array de [timestamp, value])
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        // Pegar o valor mais recente (último item do array)
        const latestData = data.data[data.data.length - 1];
        if (Array.isArray(latestData) && latestData.length >= 2) {
          dominanceValue = parseFloat(latestData[1]); // latestData[0] é timestamp, latestData[1] é o valor
        }
      } else if (data.dominance !== undefined) {
        dominanceValue = parseFloat(data.dominance);
      } else if (data.value !== undefined) {
        dominanceValue = parseFloat(data.value);
      } else {
        throw new Error('Formato de resposta inesperado da CoinStats BTC Dominance');
      }

      // Se não conseguiu obter dominância, usar fallback CoinGecko
      if (dominanceValue === 0 || isNaN(dominanceValue)) {
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
      
      // Salvar no banco de dados
      await this.saveBTCDominanceToDatabase(btcDominance);
      
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
  // ANÁLISE OPENAI OTIMIZADA PARA REDUZIR CUSTOS
  // ========================================

  async getAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> {
    if (!this.openai || !this.config.aiConfig.enabled) {
      console.log('⚠️ OpenAI não configurado - pulando análise IA');
      return null;
    }

    // Verificar cache baseado em hash dos dados de entrada
    const inputHash = this.generateInputHash(request);
    const cacheKey = `ai_analysis_${inputHash}`;
    const cachedResult = this.cache.get<AIAnalysisResponse>(cacheKey);
    
    if (cachedResult) {
      console.log('🤖 Análise IA obtida do cache (economia de custo)');
      this.aiOptimizationStats.aiCallsSavedByCache++;
      return cachedResult;
    }

    try {
      console.log('🤖 Executando análise OpenAI otimizada...');
      
      // Prompt otimizado e mais conciso para reduzir tokens
      const optimizedPrompt = this.buildOptimizedAIPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: this.config.aiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Expert crypto analyst. Respond in JSON only. Be concise.'
          },
          {
            role: 'user',
            content: optimizedPrompt
          }
        ],
        max_tokens: this.config.aiConfig.maxTokens, // Reduzido para 800
        temperature: this.config.aiConfig.temperature
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Resposta vazia da OpenAI');
      }

      // Parse da resposta
      const analysis = this.parseAIResponse(aiResponse);
      
      // Cache por 15 minutos para economizar custos
      this.cache.set(cacheKey, analysis, this.config.cacheConfig.aiAnalysisCacheMinutes! * 60);
      
      console.log(`✅ Análise OpenAI concluída: ${analysis.confidence}% confiança (cached por 15min)`);
      return analysis;

    } catch (error) {
      console.error('❌ Erro na análise OpenAI:', error);
      return null;
    }
  }

  private generateInputHash(request: AIAnalysisRequest): string {
    // Gerar hash simples baseado nos dados de entrada para cache inteligente
    const key = `${request.fearGreedIndex.value}_${Math.round(request.marketPulse.positivePercentage)}_${Math.round(request.btcDominance.dominance)}`;
    return key;
  }

  private buildOptimizedAIPrompt(request: AIAnalysisRequest): string {
    // Prompt otimizado e mais conciso para reduzir custos
    return `Analyze crypto market data and respond with JSON only:

Data:
- Fear/Greed: ${request.fearGreedIndex.value} (${request.fearGreedIndex.classification})
- Market: ${request.marketPulse.positivePercentage.toFixed(0)}% positive, ${request.marketPulse.trend}
- BTC Dom: ${request.btcDominance.dominance.toFixed(1)}% (${request.btcDominance.trend})

Required JSON format:
{
  "decision": "LONG_ONLY|SHORT_ONLY|BOTH|NONE",
  "confidence": number(0-100),
  "reasoning": "brief analysis",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendedPositionSize": number(10-50),
  "timeframe": "SHORT|MEDIUM|LONG"
}

Rules: Fear<30=LONG favor, Fear>70=SHORT favor, Market>60% bullish=LONG, BTC Dom falling=ALT favor.`;
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
  // DECISÃO FINAL DE MERCADO - OTIMIZADA
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

      // Análise algorítmica (sempre executada)
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

      // ========================================
      // ANÁLISE IA OTIMIZADA (SÓ QUANDO NECESSÁRIO)
      // ========================================
      let aiAnalysis: AIAnalysisResponse | null = null;
      
      if (this.openai && this.config.aiConfig.smartAnalysisEnabled) {
        // Verificar se há análise IA em cache primeiro
        const currentSnapshot = {
          fearGreedValue: fearGreed.value,
          marketPulsePositive: marketPulse.positivePercentage,
          btcDominance: btcDominance.dominance,
          timestamp: new Date()
        };
        
        const inputHash = this.generateInputHash({
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
        
        const aiCacheKey = `ai_analysis_${inputHash}`;
        aiAnalysis = this.cache.get<AIAnalysisResponse>(aiCacheKey) || null;
        
        if (!aiAnalysis) {
          // Verificar se deve executar nova análise IA
          const shouldRunAI = this.shouldRunAIAnalysis(currentSnapshot);
          
          if (shouldRunAI.run) {
            console.log(`🤖 Executando análise IA: ${shouldRunAI.reason}`);
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
            
            if (aiAnalysis) {
              this.aiOptimizationStats.totalAICalls++;
              this.aiOptimizationStats.lastAIAnalysis = new Date();
            }
          } else {
            console.log(`💰 Economia IA: ${shouldRunAI.reason}`);
            this.aiOptimizationStats.aiCallsSavedByThreshold++;
          }
        } else {
          console.log('💰 Análise IA obtida do cache (economia de custo)');
          this.aiOptimizationStats.aiCallsSavedByCache++;
        }
      }

      // Aplicar análise IA se disponível (sem sobrescrever Fear & Greed extremos)
      if (aiAnalysis) {
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
        reasons.push(`IA: ${aiAnalysis.reasoning}`);
      }

      // Atualizar estatísticas de economia
      this.updateCostSavingStats();

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

      // Salvar decisão no banco de dados
      await this.saveMarketDecisionToDatabase(decision);

      console.log(`🎯 Decisão final: LONG=${allowLong}, SHORT=${allowShort}, Confiança=${confidence}%`);
      console.log(`💰 Economia IA: ${this.aiOptimizationStats.costSavingPercentage.toFixed(1)}% dos custos salvos`);
      
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
  // UTILITÁRIOS E CACHE - OTIMIZADO
  // ========================================

  getCacheStats() {
    return {
      ...this.cache.getStats(),
      aiOptimization: this.aiOptimizationStats,
      aiConfig: this.aiOptimizationConfig
    };
  }

  getAIOptimizationStats(): CostOptimizationStats {
    return { ...this.aiOptimizationStats };
  }

  getAIOptimizationConfig(): AIOptimizationConfig {
    return { ...this.aiOptimizationConfig };
  }

  updateAIOptimizationConfig(config: Partial<AIOptimizationConfig>): void {
    this.aiOptimizationConfig = { ...this.aiOptimizationConfig, ...config };
    console.log('⚙️ Configuração de otimização IA atualizada:', config);
  }

  setEmergencyOverride(enabled: boolean): void {
    this.aiOptimizationConfig.emergencyOverride = enabled;
    console.log(`🚨 Override de emergência IA: ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache de market intelligence limpo');
  }

  clearAIOptimizationStats(): void {
    this.aiOptimizationStats = {
      totalAICalls: 0,
      aiCallsSavedByCache: 0,
      aiCallsSavedByThreshold: 0,
      costSavingPercentage: 0,
      lastAIAnalysis: null,
      nextScheduledAnalysis: new Date(Date.now() + 15 * 60 * 1000)
    };
    console.log('📊 Estatísticas de otimização IA resetadas');
  }

  stopAllIntervals(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.aiOptimizationInterval) {
      clearInterval(this.aiOptimizationInterval);
      this.aiOptimizationInterval = null;
    }
    
    console.log('⏹️ Todos os intervalos de atualização parados');
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
