// ========================================
// MARKETBOT - OPTIMIZATION CONTROLLER
// Controller para monitoramento e controle de otimização de custos IA
// ========================================

import { Request, Response } from 'express';
import { realMarketIntelligence } from '../services/market-intelligence-real.service.js';

class OptimizationController {
  
  // ========================================
  // ESTATÍSTICAS DE OTIMIZAÇÃO IA
  // ========================================
  
  async getAIOptimizationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = realMarketIntelligence.getAIOptimizationStats();
      const cacheStats = realMarketIntelligence.getCacheStats();
      
      res.json({
        success: true,
        data: {
          optimization: stats,
          cache: cacheStats,
          message: `💰 Economia de ${stats.costSavingPercentage.toFixed(1)}% nos custos IA`
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas de otimização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
  
  // ========================================
  // CONFIGURAÇÃO DE OTIMIZAÇÃO
  // ========================================
  
  async getAIOptimizationConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = realMarketIntelligence.getAIOptimizationConfig();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Erro ao obter configuração de otimização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
  
  async updateAIOptimizationConfig(req: Request, res: Response): Promise<void> {
    try {
      const {
        enableSmartAnalysis,
        significantChangeThreshold,
        maxAICallsPerHour,
        forceAIOnExtremes,
        emergencyOverride
      } = req.body;
      
      const updateConfig: any = {};
      
      if (enableSmartAnalysis !== undefined) updateConfig.enableSmartAnalysis = enableSmartAnalysis;
      if (significantChangeThreshold !== undefined) updateConfig.significantChangeThreshold = significantChangeThreshold;
      if (maxAICallsPerHour !== undefined) updateConfig.maxAICallsPerHour = maxAICallsPerHour;
      if (forceAIOnExtremes !== undefined) updateConfig.forceAIOnExtremes = forceAIOnExtremes;
      if (emergencyOverride !== undefined) updateConfig.emergencyOverride = emergencyOverride;
      
      realMarketIntelligence.updateAIOptimizationConfig(updateConfig);
      
      res.json({
        success: true,
        message: 'Configuração de otimização IA atualizada',
        data: realMarketIntelligence.getAIOptimizationConfig()
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração de otimização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
  
  // ========================================
  // CONTROLES DE EMERGÊNCIA
  // ========================================
  
  async setEmergencyOverride(req: Request, res: Response): Promise<void> {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'Parâmetro "enabled" deve ser boolean'
        });
        return;
      }
      
      realMarketIntelligence.setEmergencyOverride(enabled);
      
      res.json({
        success: true,
        message: `Override de emergência ${enabled ? 'ATIVADO' : 'DESATIVADO'}`,
        data: {
          emergencyOverride: enabled,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Erro ao configurar override de emergência:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
  
  // ========================================
  // RELATÓRIO DE ECONOMIA
  // ========================================
  
  async getCostSavingReport(req: Request, res: Response): Promise<void> {
    try {
      const stats = realMarketIntelligence.getAIOptimizationStats();
      const config = realMarketIntelligence.getAIOptimizationConfig();
      
      // Calcular estimativas de custo
      const estimatedCostPerCall = 0.02; // $0.02 por call (estimativa)
      const totalPossibleCalls = stats.totalAICalls + stats.aiCallsSavedByCache + stats.aiCallsSavedByThreshold;
      const callsSaved = stats.aiCallsSavedByCache + stats.aiCallsSavedByThreshold;
      const costSaved = callsSaved * estimatedCostPerCall;
      const totalPotentialCost = totalPossibleCalls * estimatedCostPerCall;
      
      const report = {
        period: 'Desde o início',
        totalPossibleCalls,
        actualCalls: stats.totalAICalls,
        callsSaved,
        costSavingPercentage: stats.costSavingPercentage,
        estimatedCostSaved: `$${costSaved.toFixed(4)}`,
        estimatedTotalCost: `$${(stats.totalAICalls * estimatedCostPerCall).toFixed(4)}`,
        estimatedPotentialCost: `$${totalPotentialCost.toFixed(4)}`,
        breakdown: {
          savedByCache: stats.aiCallsSavedByCache,
          savedByThreshold: stats.aiCallsSavedByThreshold
        },
        configuration: {
          smartAnalysisEnabled: config.enableSmartAnalysis,
          changeThreshold: `${config.significantChangeThreshold}%`,
          maxCallsPerHour: config.maxAICallsPerHour
        },
        lastAnalysis: stats.lastAIAnalysis,
        nextScheduled: stats.nextScheduledAnalysis
      };
      
      res.json({
        success: true,
        data: report,
        message: `💰 Economia total de ${stats.costSavingPercentage.toFixed(1)}% nos custos IA`
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de economia:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
  
  // ========================================
  // RESET DE ESTATÍSTICAS
  // ========================================
  
  async resetOptimizationStats(req: Request, res: Response): Promise<void> {
    try {
      realMarketIntelligence.clearAIOptimizationStats();
      
      res.json({
        success: true,
        message: 'Estatísticas de otimização resetadas',
        data: realMarketIntelligence.getAIOptimizationStats()
      });
    } catch (error) {
      console.error('Erro ao resetar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new OptimizationController();
