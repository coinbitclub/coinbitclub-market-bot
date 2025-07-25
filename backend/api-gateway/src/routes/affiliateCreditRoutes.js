import express from 'express';
import AffiliateCreditController from '../controllers/affiliateCreditController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';

const router = express.Router();

/**
 * Middleware de autenticação para todas as rotas
 */
router.use(authenticateToken);

/**
 * @route GET /api/affiliate/credit/balance
 * @desc Obter saldo de crédito disponível do afiliado
 * @access Private (Affiliates only)
 */
router.get('/balance', AffiliateCreditController.getCreditBalance);

/**
 * @route POST /api/affiliate/credit/use
 * @desc Usar comissão como crédito na conta
 * @access Private (Affiliates only)
 */
router.post('/use',
  [
    body('amount')
      .isFloat({ min: 10 })
      .withMessage('Valor deve ser pelo menos R$ 10,00'),
    body('description')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Descrição deve ter no máximo 255 caracteres')
  ],
  validateRequest,
  AffiliateCreditController.useCredit
);

/**
 * @route POST /api/affiliate/credit/simulate
 * @desc Simular conversão de crédito BRL para USD
 * @access Private (Affiliates only)
 */
router.post('/simulate',
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser positivo')
  ],
  validateRequest,
  AffiliateCreditController.simulateConversion
);

/**
 * @route GET /api/affiliate/credit/history
 * @desc Obter histórico de uso de crédito
 * @access Private (Affiliates only)
 */
router.get('/history',
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
      .isIn(['all', 'pending', 'completed', 'cancelled'])
      .withMessage('Status inválido')
  ],
  validateRequest,
  AffiliateCreditController.getCreditHistory
);

/**
 * @route DELETE /api/affiliate/credit/usage/:id
 * @desc Cancelar uso de crédito pendente
 * @access Private (Affiliates only)
 */
router.delete('/usage/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID deve ser um UUID válido')
  ],
  validateRequest,
  AffiliateCreditController.cancelCreditUsage
);

/**
 * @route GET /api/affiliate/credit/stats
 * @desc Obter estatísticas de uso de crédito
 * @access Private (Affiliates only)
 */
router.get('/stats', AffiliateCreditController.getCreditStats);

/**
 * @route GET /api/affiliate/credit/dashboard
 * @desc Obter dashboard completo de crédito do afiliado
 * @access Private (Affiliates only)
 */
router.get('/dashboard', AffiliateCreditController.getCreditDashboard);

/**
 * @route GET /api/affiliate/credit/conversion-rate
 * @desc Obter taxa de conversão atual BRL/USD
 * @access Private (Affiliates only)
 */
router.get('/conversion-rate', AffiliateCreditController.getConversionRate);

export default router;
