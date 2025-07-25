import express from 'express';
import FinancialStatementController from '../controllers/financialStatementController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';

const router = express.Router();

/**
 * Middleware de autenticação para todas as rotas
 */
router.use(authenticateToken);

/**
 * @route GET /api/financial/statement/user
 * @desc Obter extrato completo do usuário
 * @access Private
 */
router.get('/statement/user',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número maior que 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato ISO8601'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato ISO8601'),
    query('transaction_type')
      .optional()
      .isIn(['all', 'debit', 'credit', 'commission'])
      .withMessage('Tipo de transação inválido'),
    query('currency')
      .optional()
      .isIn(['all', 'USD', 'BRL', 'EUR'])
      .withMessage('Moeda inválida')
  ],
  validateRequest,
  FinancialStatementController.getUserStatement
);

/**
 * @route GET /api/financial/statement/affiliate
 * @desc Obter extrato de comissões do afiliado
 * @access Private (Affiliates only)
 */
router.get('/statement/affiliate',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número maior que 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato ISO8601'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato ISO8601'),
    query('status')
      .optional()
      .isIn(['all', 'paid', 'pending', 'cancelled'])
      .withMessage('Status inválido'),
    query('currency')
      .optional()
      .isIn(['all', 'USD', 'BRL', 'EUR'])
      .withMessage('Moeda inválida')
  ],
  validateRequest,
  FinancialStatementController.getAffiliateStatement
);

/**
 * @route GET /api/financial/statement/export
 * @desc Exportar extrato em diferentes formatos
 * @access Private
 */
router.get('/statement/export',
  [
    query('type')
      .isIn(['user', 'affiliate'])
      .withMessage('Tipo deve ser user ou affiliate'),
    query('format')
      .isIn(['json', 'csv', 'pdf'])
      .withMessage('Formato deve ser json, csv ou pdf'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato ISO8601'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato ISO8601'),
    query('transaction_type')
      .optional()
      .isIn(['all', 'debit', 'credit', 'commission'])
      .withMessage('Tipo de transação inválido'),
    query('currency')
      .optional()
      .isIn(['all', 'USD', 'BRL', 'EUR'])
      .withMessage('Moeda inválida')
  ],
  validateRequest,
  FinancialStatementController.exportStatement
);

/**
 * @route GET /api/financial/summary
 * @desc Obter resumo financeiro rápido do usuário
 * @access Private
 */
router.get('/summary',
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Período deve ser 7d, 30d, 90d ou 1y')
  ],
  validateRequest,
  FinancialStatementController.getFinancialSummary
);

/**
 * @route GET /api/financial/transaction/:id
 * @desc Obter detalhes de uma transação específica
 * @access Private
 */
router.get('/transaction/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID da transação deve ser um UUID válido'),
    query('type')
      .isIn(['payment', 'operation', 'withdrawal', 'prepaid', 'commission'])
      .withMessage('Tipo de transação inválido')
  ],
  validateRequest,
  FinancialStatementController.getTransactionDetails
);

/**
 * @route GET /api/financial/admin/stats
 * @desc Obter estatísticas financeiras para administradores
 * @access Admin only
 */
router.get('/admin/stats',
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y', 'all'])
      .withMessage('Período inválido'),
    query('user_id')
      .optional()
      .isUUID()
      .withMessage('ID do usuário deve ser um UUID válido')
  ],
  validateRequest,
  FinancialStatementController.getAdminFinancialStats
);

export default router;
