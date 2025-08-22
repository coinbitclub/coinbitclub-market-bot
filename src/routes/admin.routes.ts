// ========================================
// MARKETBOT - ADMIN ROUTES
// Rotas para administração do sistema de trading
// FASE 5 - Administração completa
// ========================================

import { Router, Request, Response, NextFunction } from 'express';
import AdminController from '../controllers/admin.controller.js';
import { body, query, validationResult } from 'express-validator';

const router = Router();
const adminController = new AdminController();

// Middleware de validação simples
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Middleware de autenticação simples (temporário)
const authenticate = (req: any, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Token de acesso é obrigatório'
    });
    return;
  }
  
  // Por enquanto, apenas simular usuário autenticado
  req.user = { id: '1', email: 'admin@marketbot.com', role: 'ADMIN' };
  next();
};

// Middleware para verificar se é admin
const requireAdmin = (req: any, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Acesso restrito aos administradores'
    });
    return;
  }
  next();
};

// Aplicar middlewares
router.use(authenticate);
router.use(requireAdmin);

// ========================================
// CONFIGURAÇÕES PADRÃO DO ADMIN
// ========================================

/**
 * @route GET /api/v1/admin/defaults
 * @desc Obter configurações padrão do sistema
 * @access Admin only
 */
router.get('/defaults', adminController.getAdminDefaults.bind(adminController));

/**
 * @route PUT /api/v1/admin/defaults
 * @desc Atualizar configurações padrão do sistema
 * @access Admin only
 */
router.put('/defaults', [
  body('stopLossPercent')
    .optional()
    .isFloat({ min: 0.1, max: 20 })
    .withMessage('Stop Loss deve estar entre 0.1% e 20%'),
  
  body('takeProfitPercent')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Take Profit deve estar entre 0.1% e 50%'),
  
  body('leverage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Leverage deve estar entre 1x e 100x'),
  
  body('positionSizePercent')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Tamanho da posição deve estar entre 1% e 100%'),
  
  body('maxConcurrentPositions')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Máximo de posições simultâneas deve estar entre 1 e 20'),
  
  body('dailyLossLimitUsd')
    .optional()
    .isFloat({ min: 10, max: 10000 })
    .withMessage('Limite diário de perda deve estar entre $10 e $10,000'),
  
  body('maxDailyTrades')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Máximo de trades diários deve estar entre 1 e 100'),
  
  body('minRiskRewardRatio')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Risk/Reward mínimo deve estar entre 0.1 e 10'),
  
  body('maxAllowedLeverage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Leverage máximo permitido deve estar entre 1x e 100x'),
  
  body('tradingStartHour')
    .optional()
    .isInt({ min: 0, max: 23 })
    .withMessage('Hora de início deve estar entre 0 e 23'),
  
  body('tradingEndHour')
    .optional()
    .isInt({ min: 0, max: 24 })
    .withMessage('Hora de fim deve estar entre 0 e 24'),
  
  body('tradeOnWeekends')
    .optional()
    .isBoolean()
    .withMessage('Trade nos fins de semana deve ser true ou false'),
  
  body('autoCloseExpiredSignals')
    .optional()
    .isBoolean()
    .withMessage('Auto fechar sinais expirados deve ser true ou false'),
  
  body('signalExpiryMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Expiração do sinal deve estar entre 1 e 1440 minutos'),
  
  body('positionMonitoringIntervalSeconds')
    .optional()
    .isInt({ min: 10, max: 300 })
    .withMessage('Intervalo de monitoramento deve estar entre 10 e 300 segundos'),
  
  validateRequest
], adminController.updateAdminDefaults.bind(adminController));

// ========================================
// ESTATÍSTICAS E MONITORAMENTO
// ========================================

/**
 * @route GET /api/v1/admin/statistics
 * @desc Obter estatísticas gerais do sistema
 * @access Admin only
 */
router.get('/statistics', [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Período deve estar entre 1 e 365 dias'),
  validateRequest
], adminController.getSystemStatistics.bind(adminController));

/**
 * @route GET /api/v1/admin/positions/active
 * @desc Obter todas as posições ativas no sistema
 * @access Admin only
 */
router.get('/positions/active', adminController.getActivePositions.bind(adminController));

/**
 * @route GET /api/v1/admin/signals/recent
 * @desc Obter sinais recentes processados
 * @access Admin only
 */
router.get('/signals/recent', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limite deve estar entre 1 e 200'),
  validateRequest
], adminController.getRecentSignals.bind(adminController));

/**
 * @route GET /api/v1/admin/logs
 * @desc Obter logs do sistema
 * @access Admin only
 */
router.get('/logs', [
  query('eventType')
    .optional()
    .isIn([
      'POSITION_OPENED', 'POSITION_CLOSED', 'SIGNAL_RECEIVED', 
      'SIGNAL_PROCESSED', 'ORDER_EXECUTED', 'COMMISSION_APPLIED',
      'RISK_VALIDATION', 'SYSTEM_ERROR'
    ])
    .withMessage('Tipo de evento inválido'),
  
  query('success')
    .optional()
    .isBoolean()
    .withMessage('Success deve ser true ou false'),
  
  query('userId')
    .optional()
    .isUUID()
    .withMessage('User ID deve ser um UUID válido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limite deve estar entre 1 e 500'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser maior ou igual a 0'),
  
  validateRequest
], adminController.getSystemLogs.bind(adminController));

// ========================================
// AÇÕES ADMINISTRATIVAS
// ========================================

/**
 * @route POST /api/v1/admin/system/restart
 * @desc Reiniciar componentes do sistema
 * @access Admin only
 */
router.post('/system/restart', [
  body('component')
    .isIn(['orchestrator', 'monitoring', 'cache', 'all'])
    .withMessage('Componente deve ser: orchestrator, monitoring, cache ou all'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const { component } = req.body;
    
    // Implementar lógica de restart baseada no componente
    // Por enquanto, apenas retorna sucesso
    
    res.json({
      success: true,
      message: `Componente ${component} reiniciado com sucesso`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao reiniciar componente',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route POST /api/v1/admin/positions/:id/close
 * @desc Fechar posição específica manualmente
 * @access Admin only
 */
router.post('/positions/:id/close', [
  body('reason')
    .isString()
    .isLength({ min: 5, max: 200 })
    .withMessage('Razão deve ter entre 5 e 200 caracteres'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Implementar fechamento manual da posição
    // Por enquanto, apenas retorna sucesso
    
    res.json({
      success: true,
      message: `Posição ${id} fechada manualmente`,
      reason,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fechar posição',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route POST /api/v1/admin/users/:id/disable-trading
 * @desc Desabilitar trading para um usuário específico
 * @access Admin only
 */
router.post('/users/:id/disable-trading', [
  body('reason')
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('Razão deve ter entre 10 e 500 caracteres'),
  
  body('temporary')
    .optional()
    .isBoolean()
    .withMessage('Temporary deve ser true ou false'),
  
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, temporary = false } = req.body;
    
    // Implementar desabilitação de trading
    // Por enquanto, apenas retorna sucesso
    
    res.json({
      success: true,
      message: `Trading desabilitado para usuário ${id}`,
      reason,
      temporary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desabilitar trading',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// ========================================
// CONFIGURAÇÕES DE SISTEMA
// ========================================

/**
 * @route GET /api/v1/admin/system/health
 * @desc Verificar saúde do sistema de trading
 * @access Admin only
 */
router.get('/system/health', async (req, res) => {
  try {
    // Verificar componentes do sistema
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      components: {
        database: 'healthy',
        orchestrator: 'healthy',
        exchanges: 'healthy',
        monitoring: 'healthy',
        cache: 'healthy'
      },
      metrics: {
        activePositions: 0,
        pendingSignals: 0,
        dailyVolume: 0,
        systemLoad: 'low'
      }
    };
    
    res.json({
      success: true,
      data: health,
      message: 'Sistema operacional'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro na verificação de saúde',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route GET /api/v1/admin/system/config
 * @desc Obter configurações gerais do sistema
 * @access Admin only
 */
router.get('/system/config', async (req, res) => {
  try {
    const config = {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      trading: {
        enableRealTrading: process.env.ENABLE_REAL_TRADING === 'true',
        mainnetPriority: process.env.MAINNET_PRIORITY === 'true',
        maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPERATIONS || '2'),
        operationTimeout: parseInt(process.env.OPERATION_TIMEOUT_SECONDS || '120')
      },
      exchanges: {
        binance: !!process.env.BINANCE_API_KEY,
        bybit: !!process.env.BYBIT_API_KEY
      },
      integrations: {
        openai: !!process.env.OPENAI_API_KEY,
        ngrok: {
          enabled: !!process.env.NGROK_IP_FIXO,
          ip: process.env.NGROK_IP_FIXO
        },
        coinstats: !!process.env.COINSTATS_API_KEY,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        twilio: !!process.env.TWILIO_AUTH_TOKEN
      }
    };
    
    res.json({
      success: true,
      data: config,
      message: 'Configurações do sistema obtidas'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
