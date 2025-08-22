// ========================================
// MARKETBOT - TRADING ROUTES
// Rotas para funcionalidades de trading
// ========================================

import { Router } from 'express';
import tradingController from '../controllers/trading.controller.js';

const router = Router();

// Middleware simples de autenticação (temporário)
const authenticate = (req: any, res: any, next: any) => {
  // Por enquanto, simula um usuário autenticado
  req.user = { id: 'temp-user-id' };
  next();
};

// ========================================
// EXCHANGE ACCOUNTS ROUTES
// ========================================

// POST /api/v1/trading/accounts - Adicionar conta de exchange
router.post('/accounts', 
  authenticate, 
  tradingController.addExchangeAccount
);

// GET /api/v1/trading/accounts - Listar contas de exchange do usuário
router.get('/accounts', 
  authenticate, 
  tradingController.getUserExchangeAccounts
);

// GET /api/v1/trading/accounts/:accountId/balance - Obter saldo da conta
router.get('/accounts/:accountId/balance', 
  authenticate, 
  tradingController.getExchangeBalance
);

// POST /api/v1/trading/accounts/:accountId/test - Testar conexão
router.post('/accounts/:accountId/test', 
  authenticate, 
  tradingController.testExchangeConnection
);

// DELETE /api/v1/trading/accounts/:accountId - Remover conta de exchange
router.delete('/accounts/:accountId', 
  authenticate, 
  tradingController.removeExchangeAccount
);

// ========================================
// SIGNALS ROUTES
// ========================================

// POST /api/v1/trading/signals - Criar sinal manual
router.post('/signals', 
  authenticate, 
  tradingController.createSignal
);

// GET /api/v1/trading/signals - Listar sinais do usuário
router.get('/signals', 
  authenticate, 
  tradingController.getUserSignals
);

// GET /api/v1/trading/signals/:signalId - Obter sinal específico
router.get('/signals/:signalId', 
  authenticate, 
  tradingController.getSignal
);

// ========================================
// POSITIONS ROUTES
// ========================================

// GET /api/v1/trading/positions - Listar posições do usuário
router.get('/positions', 
  authenticate, 
  tradingController.getUserPositions
);

// POST /api/v1/trading/positions/:positionId/close - Fechar posição
router.post('/positions/:positionId/close', 
  authenticate, 
  tradingController.closePosition
);

// ========================================
// ORDERS ROUTES
// ========================================

// POST /api/v1/trading/orders - Criar ordem manual
router.post('/orders', 
  authenticate, 
  tradingController.createOrder
);

// ========================================
// WEBHOOKS ROUTES (SEM AUTENTICAÇÃO)
// ========================================

// POST /api/v1/trading/webhook/tradingview - Webhook do TradingView
router.post('/webhook/tradingview', 
  tradingController.tradingViewWebhook
);

// ========================================
// HEALTH CHECK
// ========================================

// GET /api/v1/trading/health - Health check do sistema de trading
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sistema de trading operacional',
    timestamp: new Date().toISOString(),
    services: {
      trading: 'OK',
      exchanges: 'OK',
      signals: 'OK',
      positions: 'OK',
      orders: 'OK'
    }
  });
});

export default router;
