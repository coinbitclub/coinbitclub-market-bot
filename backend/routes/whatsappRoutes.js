/**
 * 🚀 ROTAS WhatsApp VERIFICATION - CoinBitClub Market Bot
 * Sistema completo de validação por WhatsApp e reset de senha
 * Versão: 2.1.0
 */

const express = require('express');
const router = express.Router();

const {
  // Middlewares
  whatsappLimiter,
  resetLimiter,
  authenticateUser,
  requireAdmin,
  
  // Controladores de verificação
  startWhatsAppVerification,
  verifyWhatsAppCode,
  
  // Controladores de reset de senha
  startPasswordResetWhatsApp,
  confirmPasswordResetWhatsApp,
  
  // Controladores admin
  adminResetUserPassword,
  getWhatsAppLogs,
  getWhatsAppStats,
  cleanupExpiredCodes
} = require('../controllers/whatsappController');

// ===== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) =====

/**
 * Iniciar reset de senha via WhatsApp
 * Rota pública para recuperação de conta
 */
router.post('/auth/forgot-password-whatsapp', 
  resetLimiter,
  startPasswordResetWhatsApp
);

/**
 * Confirmar reset de senha com código WhatsApp
 * Rota pública para completar reset
 */
router.post('/auth/reset-password-whatsapp',
  resetLimiter,
  confirmPasswordResetWhatsApp
);

// ===== ROTAS PROTEGIDAS (REQUER AUTENTICAÇÃO) =====

/**
 * Iniciar verificação de WhatsApp
 * Usuário logado pode verificar seu WhatsApp
 */
router.post('/whatsapp/start-verification',
  authenticateUser,
  whatsappLimiter,
  startWhatsAppVerification
);

/**
 * Verificar código do WhatsApp
 * Usuário confirma código recebido
 */
router.post('/whatsapp/verify-code',
  authenticateUser,
  whatsappLimiter,
  verifyWhatsAppCode
);

// ===== ROTAS ADMINISTRATIVAS =====

/**
 * Reset manual de senha pelo admin
 * Apenas admins podem resetar senhas de outros usuários
 */
router.post('/admin/reset-user-password',
  authenticateUser,
  requireAdmin,
  adminResetUserPassword
);

/**
 * Listar logs de verificação WhatsApp
 * Admin pode ver histórico de verificações
 */
router.get('/admin/whatsapp-logs',
  authenticateUser,
  requireAdmin,
  getWhatsAppLogs
);

/**
 * Obter estatísticas de verificação WhatsApp
 * Dashboard administrativo
 */
router.get('/admin/whatsapp-stats',
  authenticateUser,
  requireAdmin,
  getWhatsAppStats
);

/**
 * Limpeza de códigos expirados
 * Operação de manutenção
 */
router.post('/admin/cleanup-expired-codes',
  authenticateUser,
  requireAdmin,
  cleanupExpiredCodes
);

// ===== ROTAS DE TESTE E STATUS =====

/**
 * Status do sistema WhatsApp
 * Verificar se serviços estão funcionando
 */
router.get('/whatsapp/status', (req, res) => {
  res.json({
    service: 'WhatsApp Verification System',
    status: 'operational',
    version: '2.1.0',
    features: [
      'whatsapp_verification',
      'whatsapp_password_reset',
      'admin_manual_reset',
      'verification_logs',
      'rate_limiting'
    ],
    endpoints: {
      public: [
        'POST /auth/forgot-password-whatsapp',
        'POST /auth/reset-password-whatsapp'
      ],
      authenticated: [
        'POST /whatsapp/start-verification',
        'POST /whatsapp/verify-code'
      ],
      admin: [
        'POST /admin/reset-user-password',
        'GET /admin/whatsapp-logs',
        'GET /admin/whatsapp-stats',
        'POST /admin/cleanup-expired-codes'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Teste de conectividade
 * Verificar se rotas estão respondendo
 */
router.get('/whatsapp/test', (req, res) => {
  res.json({
    test: 'WhatsApp routes test',
    status: 'OK',
    message: 'All WhatsApp verification routes are accessible',
    tested_at: new Date().toISOString()
  });
});

// ===== MIDDLEWARE DE ERRO =====

router.use((error, req, res, next) => {
  console.error('❌ Erro nas rotas WhatsApp:', error);
  
  res.status(500).json({
    error: 'Erro interno do servidor WhatsApp',
    code: 'WHATSAPP_ROUTE_ERROR',
    timestamp: new Date().toISOString()
  });
});

// ===== ROTA 404 =====

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota WhatsApp não encontrada',
    code: 'WHATSAPP_ROUTE_NOT_FOUND',
    path: req.originalUrl,
    available_routes: [
      'GET /api/whatsapp/status',
      'GET /api/whatsapp/test',
      'POST /api/whatsapp/start-verification',
      'POST /api/whatsapp/verify-code',
      'POST /api/auth/forgot-password-whatsapp',
      'POST /api/auth/reset-password-whatsapp',
      'POST /api/admin/reset-user-password',
      'GET /api/admin/whatsapp-logs',
      'GET /api/admin/whatsapp-stats',
      'POST /api/admin/cleanup-expired-codes'
    ]
  });
});

module.exports = router;
