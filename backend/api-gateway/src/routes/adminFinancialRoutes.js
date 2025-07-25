import express from 'express';
import AdminFinancialController from '../controllers/adminFinancialController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { query, param } from 'express-validator';

const router = express.Router();

/**
 * Middleware de autenticação para todas as rotas
 */
router.use(authenticateToken);

/**
 * @route GET /api/admin/financial/dashboard
 * @desc Obter dashboard financeiro completo
 * @access Admin only
 */
router.get('/dashboard',
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato ISO8601'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato ISO8601'),
    query('currency')
      .optional()
      .isIn(['all', 'BRL', 'USD', 'EUR'])
      .withMessage('Moeda deve ser all, BRL, USD ou EUR')
  ],
  validateRequest,
  AdminFinancialController.getDashboard
);

/**
 * @route GET /api/admin/financial/reconciliation
 * @desc Gerar relatório de reconciliação
 * @access Admin only
 */
router.get('/reconciliation',
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato ISO8601'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato ISO8601')
  ],
  validateRequest,
  AdminFinancialController.getReconciliationReport
);

/**
 * @route GET /api/admin/financial/export
 * @desc Exportar dados financeiros
 * @access Admin only
 */
router.get('/export',
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato ISO8601'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato ISO8601'),
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Formato deve ser json ou csv')
  ],
  validateRequest,
  AdminFinancialController.exportFinancialData
);

/**
 * @route GET /api/admin/financial/realtime
 * @desc Obter métricas em tempo real
 * @access Admin only
 */
router.get('/realtime', AdminFinancialController.getRealtimeMetrics);

/**
 * @route GET /api/admin/financial/advanced-stats
 * @desc Obter estatísticas avançadas com comparação
 * @access Admin only
 */
router.get('/advanced-stats',
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Período deve ser 7d, 30d ou 90d'),
    query('compare_with_previous')
      .optional()
      .isBoolean()
      .withMessage('compare_with_previous deve ser boolean')
  ],
  validateRequest,
  AdminFinancialController.getAdvancedStats
);

/**
 * @route PUT /api/admin/financial/alerts/:id/resolve
 * @desc Resolver alerta do sistema
 * @access Admin only
 */
router.put('/alerts/:id/resolve',
  [
    param('id')
      .isUUID()
      .withMessage('ID do alerta deve ser um UUID válido')
  ],
  validateRequest,
  AdminFinancialController.resolveAlert
);

export default router;
