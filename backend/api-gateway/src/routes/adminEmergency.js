import express from 'express';
import adminEmergencyController from '../controllers/adminEmergencyController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Apenas administradores
router.use(authenticateToken);
router.use(requireRole(['administrador']));

/**
 * @route   POST /admin/emergency/close-all-operations
 * @desc    Botão de emergência - Fechar todas as operações abertas
 * @access  Admin only
 */
router.post('/close-all-operations', adminEmergencyController.closeAllOperations);

/**
 * @route   POST /admin/emergency/pause-trading
 * @desc    Pausar trading por exchange/ambiente
 * @access  Admin only
 */
router.post('/pause-trading', adminEmergencyController.pauseTrading);

/**
 * @route   POST /admin/emergency/resume-trading
 * @desc    Retomar trading pausado
 * @access  Admin only
 */
router.post('/resume-trading', adminEmergencyController.resumeTrading);

/**
 * @route   GET /admin/emergency/status
 * @desc    Status geral do sistema e emergências
 * @access  Admin only
 */
router.get('/status', adminEmergencyController.getEmergencyStatus);

/**
 * @route   PUT /admin/api-keys/update
 * @desc    Atualizar chaves API do sistema (OpenAI, exchanges, etc)
 * @access  Admin only
 */
router.put('/api-keys/update', adminEmergencyController.updateSystemApiKeys);

export default router;
