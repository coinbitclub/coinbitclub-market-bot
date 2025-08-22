// ========================================
// MARKETBOT - TWO FACTOR CONTROLLER
// Controller completo para autenticação de dois fatores
// FASE 2 - Segurança crítica obrigatória
// ========================================

import { Request, Response } from 'express';
import TwoFactorService from '../services/two-factor.service.js';
import { logger } from '../utils/logger.js';

export class TwoFactorController {
  private twoFactorService: TwoFactorService;

  constructor() {
    this.twoFactorService = TwoFactorService.getInstance();
  }

  // ========================================
  // SETUP INICIAL DO 2FA
  // ========================================

  async generateSetup(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { email } = req.body;

      if (!userId || !email) {
        return res.status(400).json({
          success: false,
          error: 'userId e email são obrigatórios'
        });
      }

      // Verificar se usuário pode configurar 2FA
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      logger.info(`🔑 Gerando setup 2FA para usuário ${userId}`);

      const setup = await this.twoFactorService.generateTwoFactorSetup(userId, email);

      return res.json({
        success: true,
        data: {
          qrCodeUrl: setup.qrCodeUrl,
          manualEntryKey: setup.manualEntryKey,
          backupCodes: setup.backupCodes,
          instructions: {
            step1: 'Instale o Google Authenticator no seu celular',
            step2: 'Escaneie o QR Code ou digite a chave manual',
            step3: 'Salve os códigos de backup em local seguro',
            step4: 'Digite o código de 6 dígitos para ativar'
          }
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao gerar setup 2FA:', error);
      return res.status(500).json({
        success: false,
        error: 'Falha ao gerar configuração 2FA'
      });
    }
  }

  // ========================================
  // ATIVAÇÃO DO 2FA
  // ========================================

  async enableTwoFactor(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { verificationCode } = req.body;

      if (!userId || !verificationCode) {
        return res.status(400).json({
          success: false,
          error: 'userId e verificationCode são obrigatórios'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      logger.info(`🔐 Ativando 2FA para usuário ${userId}`);

      const activated = await this.twoFactorService.enableTwoFactor(userId, verificationCode);

      if (activated) {
        return res.json({
          success: true,
          message: '2FA ativado com sucesso',
          data: {
            enabled: true,
            timestamp: new Date().toISOString(),
            nextSteps: [
              'Guarde os códigos de backup em local seguro',
              '2FA agora é obrigatório para login',
              'Use Google Authenticator ou SMS para verificação'
            ]
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Falha ao ativar 2FA'
        });
      }

    } catch (error) {
      logger.error('❌ Erro ao ativar 2FA:', error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao ativar 2FA'
      });
    }
  }

  // ========================================
  // VERIFICAÇÃO DE CÓDIGOS
  // ========================================

  async verifyCode(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { code, type = '2FA' } = req.body;

      if (!userId || !code) {
        return res.status(400).json({
          success: false,
          error: 'userId e code são obrigatórios'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      const verification = await this.twoFactorService.verifyTwoFactorCode(userId, code, type);

      if (verification.valid) {
        return res.json({
          success: true,
          data: {
            verified: true,
            type: verification.type,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        const responseData: any = {
          success: false,
          verified: false,
          type: verification.type
        };

        if (verification.attemptsRemaining !== undefined) {
          responseData.attemptsRemaining = verification.attemptsRemaining;
        }

        if (verification.lockoutExpires) {
          responseData.lockoutExpires = verification.lockoutExpires;
          responseData.error = 'Conta bloqueada por muitas tentativas inválidas';
          return res.status(423).json(responseData);
        }

        responseData.error = 'Código de verificação inválido';
        return res.status(400).json(responseData);
      }

    } catch (error) {
      logger.error('❌ Erro ao verificar código 2FA:', error);
      return res.status(500).json({
        success: false,
        error: 'Falha ao verificar código'
      });
    }
  }

  // ========================================
  // SMS BACKUP
  // ========================================

  async sendSMSCode(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { phoneNumber } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId é obrigatório'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      logger.info(`📱 Enviando SMS para usuário ${userId}`);

      const sent = await this.twoFactorService.sendSMSCode(userId, phoneNumber);

      if (sent) {
        return res.json({
          success: true,
          message: 'Código SMS enviado',
          data: {
            sentTo: phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '+55 (**) *****-$3'),
            expiresIn: '5 minutos'
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Falha ao enviar SMS'
        });
      }

    } catch (error) {
      logger.error('❌ Erro ao enviar SMS:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao enviar SMS'
      });
    }
  }

  async verifySMSCode(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { smsCode } = req.body;

      if (!userId || !smsCode) {
        return res.status(400).json({
          success: false,
          error: 'userId e smsCode são obrigatórios'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      const verification = await this.twoFactorService.verifySMSCode(userId, smsCode);

      if (verification.valid) {
        return res.json({
          success: true,
          data: {
            verified: true,
            type: verification.type,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Código SMS inválido ou expirado'
        });
      }

    } catch (error) {
      logger.error('❌ Erro ao verificar SMS:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao verificar SMS'
      });
    }
  }

  // ========================================
  // GERENCIAMENTO DE BACKUP CODES
  // ========================================

  async generateNewBackupCodes(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { currentCode } = req.body;

      if (!userId || !currentCode) {
        return res.status(400).json({
          success: false,
          error: 'userId e currentCode são obrigatórios'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      // Verificar código atual antes de gerar novos
      const verification = await this.twoFactorService.verifyTwoFactorCode(userId, currentCode);
      
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          error: 'Código de verificação inválido'
        });
      }

      const newBackupCodes = await this.twoFactorService.generateNewBackupCodes(userId);

      return res.json({
        success: true,
        data: {
          backupCodes: newBackupCodes,
          warning: 'Os códigos anteriores foram invalidados. Guarde estes novos códigos em local seguro.',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao gerar novos códigos de backup:', error);
      return res.status(500).json({
        success: false,
        error: 'Falha ao gerar novos códigos de backup'
      });
    }
  }

  // ========================================
  // STATUS DO 2FA
  // ========================================

  async getTwoFactorStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId é obrigatório'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      // Buscar dados do usuário diretamente do service
      const twoFactorService = TwoFactorService.getInstance();
      const user = await (twoFactorService as any).getTwoFactorUser(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          userId: user.userId,
          is2FAEnabled: user.is2FAEnabled,
          hasBackupCodes: user.backupCodes.length > 0,
          backupCodesCount: user.backupCodes.length,
          smsEnabled: user.smsEnabled,
          hasPhoneNumber: !!user.phoneNumber,
          lastVerified: user.lastVerified,
          isLocked: user.lockedUntil ? new Date() < user.lockedUntil : false,
          lockoutExpires: user.lockedUntil,
          failedAttempts: user.failedAttempts
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao buscar status 2FA:', error);
      return res.status(500).json({
        success: false,
        error: 'Falha ao buscar status 2FA'
      });
    }
  }

  // ========================================
  // DESABILITAR 2FA
  // ========================================

  async disableTwoFactor(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { verificationCode } = req.body;

      if (!userId || !verificationCode) {
        return res.status(400).json({
          success: false,
          error: 'userId e verificationCode são obrigatórios'
        });
      }

      // Verificar permissões
      if (req.user?.sub !== userId && req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      logger.info(`🔓 Desabilitando 2FA para usuário ${userId}`);

      const disabled = await this.twoFactorService.disableTwoFactor(userId, verificationCode);

      if (disabled) {
        return res.json({
          success: true,
          message: '2FA desabilitado com sucesso',
          data: {
            enabled: false,
            timestamp: new Date().toISOString(),
            warning: 'Sua conta está menos segura sem 2FA. Considere reativar.'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Falha ao desabilitar 2FA'
        });
      }

    } catch (error) {
      logger.error('❌ Erro ao desabilitar 2FA:', error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao desabilitar 2FA'
      });
    }
  }

  // ========================================
  // RECUPERAÇÃO DE CONTA (ADMIN APENAS)
  // ========================================

  async adminRecovery(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { action } = req.body; // 'unlock', 'disable2fa', 'resetBackupCodes'

      if (!userId || !action) {
        return res.status(400).json({
          success: false,
          error: 'userId e action são obrigatórios'
        });
      }

      // Apenas admins podem fazer recovery
      if (req.user?.userType !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores podem executar recovery'
        });
      }

      logger.info(`🚨 Admin recovery para usuário ${userId}, ação: ${action}`);

      const twoFactorService = TwoFactorService.getInstance();

      switch (action) {
        case 'unlock':
          await (twoFactorService as any).resetFailedAttempts(userId);
          break;
        
        case 'disable2fa':
          await (twoFactorService as any).deactivateTwoFactor(userId);
          break;
        
        case 'resetBackupCodes':
          const newCodes = await twoFactorService.generateNewBackupCodes(userId);
          return res.json({
            success: true,
            message: 'Códigos de backup resetados',
            data: { backupCodes: newCodes }
          });
        
        default:
          return res.status(400).json({
            success: false,
            error: 'Ação inválida'
          });
      }

      return res.json({
        success: true,
        message: `Recovery ${action} executado com sucesso`,
        data: {
          userId,
          action,
          timestamp: new Date().toISOString(),
          admin: req.user?.email
        }
      });

    } catch (error) {
      logger.error('❌ Erro no admin recovery:', error);
      return res.status(500).json({
        success: false,
        error: 'Falha na recuperação administrativa'
      });
    }
  }
}

export const twoFactorController = new TwoFactorController();
