// ========================================
// MARKETBOT - MARKET INTELLIGENCE ROUTES
// Rotas para sistema de inteligência de mercado
// ========================================

import express from 'express';
import {
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
} from '../controllers/market.controller.js';

const router = express.Router();

// Middleware simples de autenticação (temporário)
const authenticate = (req: any, res: any, next: any) => {
  // Por enquanto, simula um usuário autenticado
  req.user = { id: 'temp-user-id', userType: 'ADMIN' };
  next();
};

// Rate limiter simples
const rateLimiter = (maxRequests: number, windowMinutes: number) => {
  return (req: any, res: any, next: any) => {
    // Por enquanto, passa direto
    next();
  };
};

// ========================================
// ROTAS PÚBLICAS (COM AUTENTICAÇÃO)
// ========================================

// Fear & Greed Index
router.get('/fear-greed', 
  rateLimiter(60, 15), // 60 requests per 15 minutes
  authenticate, 
  getFearGreedIndex
);

// Market Pulse TOP 100
router.get('/pulse', 
  rateLimiter(60, 15),
  authenticate, 
  getMarketPulse
);

// BTC Dominance
router.get('/btc-dominance', 
  rateLimiter(60, 15),
  authenticate, 
  getBTCDominance
);

// Decisão de Mercado
router.get('/decision', 
  rateLimiter(60, 15),
  authenticate, 
  getMarketDecision
);

// Overview Completo
router.get('/overview', 
  rateLimiter(30, 15), // Mais restritivo pois faz múltiplas chamadas
  authenticate, 
  getMarketOverview
);

// ========================================
// ROTAS ADMINISTRATIVAS
// ========================================

// Obter configurações (apenas admin)
router.get('/config', 
  rateLimiter(30, 15),
  authenticate, 
  getMarketConfig
);

// Atualizar configurações (apenas admin)
router.put('/config', 
  rateLimiter(10, 15), // Muito restritivo
  authenticate, 
  updateMarketConfig
);

// Limpar cache (apenas admin)
router.delete('/cache', 
  rateLimiter(5, 15), // Extremamente restritivo
  authenticate, 
  clearMarketCache
);

// Estatísticas do cache (apenas admin)
router.get('/cache/stats', 
  rateLimiter(30, 15),
  authenticate, 
  getCacheStats
);

// ========================================
// ROTAS DE TESTE
// ========================================

// Teste completo do sistema
router.get('/test', 
  rateLimiter(5, 15), // Muito restritivo pois é pesado
  authenticate, 
  testMarketIntelligence
);

export default router;
