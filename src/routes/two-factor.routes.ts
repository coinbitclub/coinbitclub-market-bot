// ========================================
// MARKETBOT - TWO FACTOR ROUTES
// Rotas completas para autenticação de dois fatores
// FASE 2 - Segurança crítica obrigatória
// ========================================

import { Router } from 'express';
import { twoFactorController } from '../controllers/two-factor.controller.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware simples de autenticação (mesmo do financial)
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso é obrigatório'
    });
  }

  // TODO: Implementar validação JWT completa
  // Por enquanto, simular usuário autenticado para desenvolvimento
  req.user = {
    sub: req.params.userId || 'test-user',
    userType: 'USER',
    email: 'test@example.com'
  };
  
  next();
};

// ========================================
// ROTAS DE SETUP E CONFIGURAÇÃO
// ========================================

/**
 * POST /api/v1/2fa/:userId/setup
 * Gerar QR Code e códigos de backup para configuração inicial
 * Body: { email }
 */
router.post('/:userId/setup', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.generateSetup(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /setup:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/v1/2fa/:userId/enable
 * Ativar 2FA após verificar código do authenticator
 * Body: { verificationCode }
 */
router.post('/:userId/enable', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.enableTwoFactor(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /enable:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/v1/2fa/:userId/disable
 * Desabilitar 2FA (requer verificação)
 * Body: { verificationCode }
 */
router.post('/:userId/disable', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.disableTwoFactor(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /disable:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE VERIFICAÇÃO
// ========================================

/**
 * POST /api/v1/2fa/:userId/verify
 * Verificar código 2FA ou backup code
 * Body: { code, type?: '2FA' | 'SMS' }
 */
router.post('/:userId/verify', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.verifyCode(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /verify:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/v1/2fa/:userId/status
 * Verificar status atual do 2FA do usuário
 */
router.get('/:userId/status', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.getTwoFactorStatus(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE SMS BACKUP
// ========================================

/**
 * POST /api/v1/2fa/:userId/sms/send
 * Enviar código de verificação via SMS
 * Body: { phoneNumber }
 */
router.post('/:userId/sms/send', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.sendSMSCode(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /sms/send:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/v1/2fa/:userId/sms/verify
 * Verificar código SMS
 * Body: { smsCode }
 */
router.post('/:userId/sms/verify', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.verifySMSCode(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /sms/verify:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE BACKUP CODES
// ========================================

/**
 * POST /api/v1/2fa/:userId/backup-codes/regenerate
 * Gerar novos códigos de backup (requer verificação)
 * Body: { currentCode }
 */
router.post('/:userId/backup-codes/regenerate', authenticateToken, async (req, res) => {
  try {
    await twoFactorController.generateNewBackupCodes(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /backup-codes/regenerate:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS ADMINISTRATIVAS
// ========================================

/**
 * POST /api/v1/2fa/:userId/admin/recovery
 * Recuperação administrativa (apenas admins)
 * Body: { action: 'unlock' | 'disable2fa' | 'resetBackupCodes' }
 */
router.post('/:userId/admin/recovery', authenticateToken, async (req, res) => {
  try {
    // Simular admin para desenvolvimento
    if (req.user) {
      (req.user as any).userType = 'ADMIN';
    }
    await twoFactorController.adminRecovery(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /admin/recovery:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE TESTE (apenas em desenvolvimento)
// ========================================

if (process.env.NODE_ENV === 'development') {
  /**
   * GET /api/v1/2fa/test/info
   * Informações sobre o sistema 2FA
   */
  router.get('/test/info', async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          service: '2FA Two Factor Authentication',
          version: '1.0.0',
          features: [
            'Google Authenticator TOTP',
            'SMS Backup via Twilio', 
            'Backup Codes (10 códigos)',
            'Account Lockout Protection',
            'Admin Recovery System'
          ],
          endpoints: {
            setup: 'POST /:userId/setup',
            enable: 'POST /:userId/enable',
            disable: 'POST /:userId/disable',
            verify: 'POST /:userId/verify',
            status: 'GET /:userId/status',
            smssend: 'POST /:userId/sms/send',
            smsVerify: 'POST /:userId/sms/verify',
            regenerateBackup: 'POST /:userId/backup-codes/regenerate',
            adminRecovery: 'POST /:userId/admin/recovery'
          },
          security: {
            lockoutThreshold: '5 tentativas',
            lockoutDuration: '30 minutos',
            backupCodesCount: 10,
            smsExpirationTime: '5 minutos',
            setupExpirationTime: '30 minutos'
          },
          requirements: {
            googleAuthenticator: 'Required for TOTP',
            twilioSMS: 'Optional for SMS backup',
            databaseTables: ['user_2fa', 'temp_2fa_setup', 'sms_verification']
          }
        }
      });
    } catch (error) {
      logger.error('❌ Erro na rota /test/info:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  /**
   * POST /api/v1/2fa/test/simulate
   * Simular operações 2FA para testes
   */
  router.post('/test/simulate', async (req, res) => {
    try {
      const { operation, userId = 'test-user-123' } = req.body;

      const responses: any = {
        'generate-setup': {
          success: true,
          data: {
            qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            manualEntryKey: 'JBSWY3DPEHPK3PXP',
            backupCodes: ['ABCD1234', 'EFGH5678', 'IJKL9012'],
            instructions: {
              step1: 'Instale o Google Authenticator no seu celular',
              step2: 'Escaneie o QR Code ou digite a chave manual',
              step3: 'Salve os códigos de backup em local seguro',
              step4: 'Digite o código de 6 dígitos para ativar'
            }
          }
        },
        'verify-code': {
          success: true,
          data: {
            verified: true,
            type: '2FA',
            timestamp: new Date().toISOString()
          }
        },
        'status': {
          success: true,
          data: {
            userId,
            is2FAEnabled: true,
            hasBackupCodes: true,
            backupCodesCount: 7,
            smsEnabled: false,
            hasPhoneNumber: false,
            lastVerified: new Date().toISOString(),
            isLocked: false,
            failedAttempts: 0
          }
        }
      };

      const response = responses[operation] || {
        success: false,
        error: 'Operação de teste não encontrada'
      };

      res.json(response);
    } catch (error) {
      logger.error('❌ Erro na simulação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro na simulação'
      });
    }
  });
}

export default router;
