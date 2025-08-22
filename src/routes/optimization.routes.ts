import { Router } from 'express';
import OptimizationController from '../controllers/optimization.controller.js';
// Removendo importação específica - será implementada diretamente nas rotas

const router = Router();

// ========================================
// ROTAS DE OTIMIZAÇÃO IA (PÚBLICAS POR ENQUANTO)
// TODO: Implementar autenticação específica
// ========================================

// Estatísticas de otimização
router.get('/stats', OptimizationController.getAIOptimizationStats);

// Relatório de economia de custos
router.get('/cost-report', OptimizationController.getCostSavingReport);

// Configuração de otimização
router.get('/config', OptimizationController.getAIOptimizationConfig);
router.put('/config', OptimizationController.updateAIOptimizationConfig);

// Controles de emergência
router.post('/emergency-override', OptimizationController.setEmergencyOverride);

// Reset de estatísticas
router.post('/reset-stats', OptimizationController.resetOptimizationStats);

export default router;
