// ========================================
// MARKETBOT - MARKET INTELLIGENCE TYPES
// Tipos para sistema de inteligência de mercado
// ========================================

export interface FearGreedIndex {
  value: number;
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: Date;
  source: string;
}

export interface MarketPulseData {
  totalCoins: number;
  positiveCoins: number;
  negativeCoins: number;
  neutralCoins: number;
  positivePercentage: number;
  negativePercentage: number;
  volumeWeightedDelta: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timestamp: Date;
}

export interface BinanceCoinData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  timestamp: Date;
}

export interface BTCDominance {
  dominance: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  recommendation: 'LONG_ALTCOINS' | 'SHORT_ALTCOINS' | 'NEUTRAL';
  timestamp: Date;
}

export interface MarketDecision {
  allowLong: boolean;
  allowShort: boolean;
  confidence: number;
  reasons: string[];
  fearGreedInfluence: string;
  marketPulseInfluence: string;
  btcDominanceInfluence: string;
  aiAnalysis?: string | undefined;
  timestamp: Date;
}

export interface AIAnalysisRequest {
  fearGreedIndex: FearGreedIndex;
  marketPulse: MarketPulseData;
  btcDominance: BTCDominance;
  recentTrends: {
    fearGreed15min: number;
    fearGreed30min: number;
    marketPulse15min: MarketPulseData;
    marketPulse30min: MarketPulseData;
  };
}

export interface AIAnalysisResponse {
  decision: 'LONG_ONLY' | 'SHORT_ONLY' | 'BOTH' | 'NONE';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedPositionSize: number;
  timeframe: string;
}

// ========================================
// OTIMIZAÇÃO DE CUSTOS IA
// ========================================

export interface MarketDataSnapshot {
  fearGreedValue: number;
  marketPulsePositive: number;
  btcDominance: number;
  timestamp: Date;
}

export interface AIOptimizationConfig {
  enableSmartAnalysis: boolean;
  significantChangeThreshold: number; // % mudança para triggerar IA
  maxAICallsPerHour: number;         // Limite de calls por hora
  forceAIOnExtremes: boolean;        // Força IA em valores extremos
  emergencyOverride: boolean;        // Override para situações críticas
}

export interface CostOptimizationStats {
  totalAICalls: number;
  aiCallsSavedByCache: number;
  aiCallsSavedByThreshold: number;
  costSavingPercentage: number;
  lastAIAnalysis: Date | null;
  nextScheduledAnalysis: Date | null;
}

export enum MarketDataSource {
  COINSTATS = 'COINSTATS',
  ALTERNATIVE_ME = 'ALTERNATIVE_ME',
  BINANCE = 'BINANCE',
  COINMARKETCAP = 'COINMARKETCAP'
}

export interface MarketDataCache {
  fearGreed: {
    data: FearGreedIndex;
    cachedAt: Date;
    expiresAt: Date;
  };
  marketPulse: {
    data: MarketPulseData;
    cachedAt: Date;
    expiresAt: Date;
  };
  btcDominance: {
    data: BTCDominance;
    cachedAt: Date;
    expiresAt: Date;
  };
  binanceTop100: {
    data: BinanceCoinData[];
    cachedAt: Date;
    expiresAt: Date;
  };
}

export interface TradingConfig {
  fearGreedThresholds: {
    extremeFear: number;      // < 30
    extremeGreed: number;     // > 80
  };
  marketPulseThresholds: {
    bullishPositive: number;  // >= 60%
    bearishNegative: number;  // >= 60%
    volumeDeltaPositive: number; // > +0.5%
    volumeDeltaNegative: number; // < -0.5%
  };
  btcDominanceThresholds: {
    highDominance: number;    // >= 50%
    lowDominance: number;     // <= 45%
  };
  aiConfig: {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
    fallbackToAlgorithmic: boolean;
    smartAnalysisEnabled?: boolean;     // Nova funcionalidade para análise inteligente
    onlyAnalyzeOnSignificantChange?: boolean; // Só analisa se mudança significativa
  };
  cacheConfig: {
    fearGreedCacheMinutes: number;     // 15 min
    marketPulseCacheMinutes: number;   // 15 min
    btcDominanceCacheMinutes: number;  // 15 min
    binanceDataCacheMinutes: number;   // 15 min
    aiAnalysisCacheMinutes?: number;   // Cache específico para análise IA
    smartCacheEnabled?: boolean;       // Cache inteligente baseado em mudanças
  };
  updateSchedule?: {
    marketDataIntervalMinutes: number; // Intervalo de atualização dos dados
    aiAnalysisIntervalMinutes: number; // Intervalo de análise IA
    onlyUpdateOnChange: boolean;       // Só atualiza se dados mudaram
    significantChangeThreshold: number; // % de mudança para triggerar IA
  };
}
