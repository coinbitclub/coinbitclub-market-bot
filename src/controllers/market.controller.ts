// ========================================
// MARKETBOT - MARKET INTELLIGENCE CONTROLLERS
// Controladores para sistema de inteligência de mercado
// ========================================

import { Request, Response } from 'express';
import { realMarketIntelligence } from '../services/market-intelligence-real.service.js';
import { z } from 'zod';

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const UpdateConfigSchema = z.object({
  fearGreedThresholds: z.object({
    extremeFear: z.number().min(0).max(100).optional(),
    extremeGreed: z.number().min(0).max(100).optional()
  }).optional(),
  marketPulseThresholds: z.object({
    bullishPositive: z.number().min(0).max(100).optional(),
    bearishNegative: z.number().min(0).max(100).optional(),
    volumeDeltaPositive: z.number().optional(),
    volumeDeltaNegative: z.number().optional()
  }).optional(),
  btcDominanceThresholds: z.object({
    highDominance: z.number().min(0).max(100).optional(),
    lowDominance: z.number().min(0).max(100).optional()
  }).optional(),
  aiConfig: z.object({
    enabled: z.boolean().optional(),
    model: z.string().optional(),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    fallbackToAlgorithmic: z.boolean().optional()
  }).optional(),
  cacheConfig: z.object({
    fearGreedCacheMinutes: z.number().positive().optional(),
    marketPulseCacheMinutes: z.number().positive().optional(),
    btcDominanceCacheMinutes: z.number().positive().optional(),
    binanceDataCacheMinutes: z.number().positive().optional()
  }).optional()
});

// ========================================
// INSTÂNCIA DO SERVIÇO
// ========================================

// Instância do serviço de market intelligence
const marketService = realMarketIntelligence;

// ========================================
// UTILITY FUNCTION
// ========================================

const getUserId = (req: Request): string | null => {
  return (req as any).user?.id || null;
};

const isAdmin = (req: Request): boolean => {
  return (req as any).user?.userType === 'ADMIN';
};

// ========================================
// CONTROLLERS PÚBLICOS
// ========================================

export const getFearGreedIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const fearGreed = await marketService.getFearGreedIndex();

    res.status(200).json({
      success: true,
      message: 'Fear & Greed Index obtido com sucesso',
      data: fearGreed
    });
  } catch (error) {
    console.error('Erro ao obter Fear & Greed Index:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter Fear & Greed Index'
    });
  }
};

export const getMarketPulse = async (req: Request, res: Response): Promise<void> => {
  try {
    const marketPulse = await marketService.getMarketPulse();

    res.status(200).json({
      success: true,
      message: 'Market Pulse obtido com sucesso',
      data: marketPulse
    });
  } catch (error) {
    console.error('Erro ao obter Market Pulse:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter Market Pulse'
    });
  }
};

export const getBTCDominance = async (req: Request, res: Response): Promise<void> => {
  try {
    const btcDominance = await marketService.getBTCDominance();

    res.status(200).json({
      success: true,
      message: 'BTC Dominance obtido com sucesso',
      data: btcDominance
    });
  } catch (error) {
    console.error('Erro ao obter BTC Dominance:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter BTC Dominance'
    });
  }
};

export const getMarketDecision = async (req: Request, res: Response): Promise<void> => {
  try {
    const decision = await marketService.getMarketDecision();

    res.status(200).json({
      success: true,
      message: 'Decisão de mercado obtida com sucesso',
      data: decision
    });
  } catch (error) {
    console.error('Erro ao obter decisão de mercado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter decisão de mercado'
    });
  }
};

export const getMarketOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const [fearGreed, marketPulse, btcDominance, decision] = await Promise.all([
      marketService.getFearGreedIndex(),
      marketService.getMarketPulse(),
      marketService.getBTCDominance(),
      marketService.getMarketDecision()
    ]);

    res.status(200).json({
      success: true,
      message: 'Overview de mercado obtido com sucesso',
      data: {
        fearGreedIndex: fearGreed,
        marketPulse: marketPulse,
        btcDominance: btcDominance,
        decision: decision,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Erro ao obter overview de mercado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter overview de mercado'
    });
  }
};

// ========================================
// CONTROLLERS ADMINISTRATIVOS
// ========================================

export const getMarketConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acesso negado - apenas administradores' });
      return;
    }

    const config = marketService.getConfig();

    res.status(200).json({
      success: true,
      message: 'Configurações de mercado obtidas com sucesso',
      data: config
    });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações'
    });
  }
};

export const updateMarketConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acesso negado - apenas administradores' });
      return;
    }

    const validatedData = UpdateConfigSchema.parse(req.body);

    marketService.updateConfig(validatedData as any);

    const updatedConfig = marketService.getConfig();

    res.status(200).json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações'
    });
  }
};

export const clearMarketCache = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acesso negado - apenas administradores' });
      return;
    }

    marketService.clearCache();

    res.status(200).json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar cache'
    });
  }
};

export const getCacheStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acesso negado - apenas administradores' });
      return;
    }

    const stats = marketService.getCacheStats();

    res.status(200).json({
      success: true,
      message: 'Estatísticas do cache obtidas com sucesso',
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do cache'
    });
  }
};

// ========================================
// CONTROLLER PARA TESTE COMPLETO
// ========================================

export const testMarketIntelligence = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('\n🧪 INICIANDO TESTE COMPLETO DO SISTEMA DE IA...\n');

    const startTime = Date.now();

    // Teste 1: Fear & Greed Index
    console.log('📊 Testando Fear & Greed Index...');
    const fearGreed = await marketService.getFearGreedIndex();
    
    // Teste 2: Market Pulse
    console.log('🔄 Testando Market Pulse...');
    const marketPulse = await marketService.getMarketPulse();
    
    // Teste 3: BTC Dominance
    console.log('₿ Testando BTC Dominance...');
    const btcDominance = await marketService.getBTCDominance();
    
    // Teste 4: Decisão Final
    console.log('🎯 Testando Decisão de Mercado...');
    const decision = await marketService.getMarketDecision();

    // Teste 5: Cache
    console.log('💾 Testando Cache...');
    const cacheStats = marketService.getCacheStats();

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    res.status(200).json({
      success: true,
      message: 'Teste completo do sistema de IA finalizado',
      data: {
        testResults: {
          fearGreedIndex: {
            status: 'OK',
            value: fearGreed.value,
            classification: fearGreed.classification,
            source: fearGreed.source
          },
          marketPulse: {
            status: 'OK',
            trend: marketPulse.trend,
            positivePercentage: marketPulse.positivePercentage,
            volumeWeightedDelta: marketPulse.volumeWeightedDelta
          },
          btcDominance: {
            status: 'OK',
            dominance: btcDominance.dominance,
            trend: btcDominance.trend,
            recommendation: btcDominance.recommendation
          },
          finalDecision: {
            status: 'OK',
            allowLong: decision.allowLong,
            allowShort: decision.allowShort,
            confidence: decision.confidence,
            reasonsCount: decision.reasons.length
          },
          cache: {
            status: 'OK',
            keysCount: cacheStats.keys,
            totalSize: cacheStats.totalSize
          }
        },
        performance: {
          totalTimeMs: totalTime,
          averageResponseTime: `${(totalTime / 4).toFixed(0)}ms`,
          status: totalTime < 10000 ? 'EXCELLENT' : totalTime < 20000 ? 'GOOD' : 'SLOW'
        },
        summary: {
          allSystemsOperational: true,
          recommendation: decision.allowLong && decision.allowShort ? 'SISTEMA NEUTRO - AMBOS PERMITIDOS' :
                          decision.allowLong ? 'APENAS LONG RECOMENDADO' :
                          decision.allowShort ? 'APENAS SHORT RECOMENDADO' : 'TRADING SUSPENSO',
          confidence: decision.confidence,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro no teste do sistema de IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste do sistema de IA',
      error: (error as Error).message
    });
  }
};

// ========================================
// EXPORT DOS CONTROLLERS
// ========================================

export default {
  getFearGreedIndex,
  getMarketPulse,
  getBTCDominance,
  getMarketDecision,
  getMarketOverview,
  getMarketConfig,
  updateMarketConfig,
  clearMarketCache,
  getCacheStats,
  testMarketIntelligence
};
