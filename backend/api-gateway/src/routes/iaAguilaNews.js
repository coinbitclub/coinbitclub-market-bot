import express from 'express';
import iaAguilaNewsController from '../controllers/iaAguilaNewsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

/**
 * @route   POST /ia-aguia/generate-daily-report
 * @desc    Gerar relatório diário automatizado
 * @access  Admin only
 */
router.post('/generate-daily-report', 
  requireRole(['administrador']), 
  iaAguilaNewsController.generateDailyReport
);

/**
 * @route   POST /ia-aguia/generate-market-alert
 * @desc    Gerar alerta de mercado específico
 * @access  Admin only
 */
router.post('/generate-market-alert', 
  requireRole(['administrador']), 
  iaAguilaNewsController.generateMarketAlert
);

/**
 * @route   GET /ia-aguia/reports
 * @desc    Listar relatórios disponíveis
 * @access  PRO/FLEX users
 */
router.get('/reports', 
  requireRole(['PRO', 'FLEX', 'administrador']), 
  iaAguilaNewsController.getReports
);

/**
 * @route   GET /ia-aguia/reports/:id
 * @desc    Obter relatório específico
 * @access  PRO/FLEX users
 */
router.get('/reports/:id', 
  requireRole(['PRO', 'FLEX', 'administrador']), 
  iaAguilaNewsController.getReportById
);

/**
 * @route   GET /ia-aguia/alerts/active
 * @desc    Obter alertas ativos do mercado
 * @access  PRO/FLEX users
 */
router.get('/alerts/active', 
  requireRole(['PRO', 'FLEX', 'administrador']), 
  iaAguilaNewsController.getActiveAlerts
);

export default router;
