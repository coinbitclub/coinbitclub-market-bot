// ========================================
// MARKETBOT - TWO FACTOR AUTHENTICATION SERVICE
// Sistema completo de 2FA com Google Authenticator + SMS
// FASE 2 - Segurança crítica obrigatória
// ========================================

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import twilio from 'twilio';
import { DatabaseService } from './database.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface VerificationResult {
  valid: boolean;
  type: '2FA' | 'SMS' | 'BACKUP_CODE';
  attemptsRemaining?: number;
  lockoutExpires?: Date;
}

export interface TwoFactorUser {
  userId: string;
  is2FAEnabled: boolean;
  secret?: string;
  backupCodes: string[];
  phoneNumber?: string;
  smsEnabled: boolean;
  lastVerified?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
}

export class TwoFactorService {
  private static instance: TwoFactorService;
  private twilioClient: any;

  constructor() {
    // Inicializar Twilio para SMS backup
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      logger.info('✅ Twilio SMS service inicializado');
    } else {
      logger.warn('⚠️ Twilio não configurado - SMS backup indisponível');
    }

    logger.info('🔐 Two Factor Authentication Service inicializado');
  }

  static getInstance(): TwoFactorService {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  // ========================================
  // SETUP INICIAL DO 2FA
  // ========================================

  async generateTwoFactorSetup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    try {
      logger.info(`🔑 Gerando setup 2FA para usuário ${userId}`);

      // Gerar secret único para o usuário
      const secret = speakeasy.generateSecret({
        name: `MarketBot (${userEmail})`,
        issuer: 'MarketBot',
        length: 32
      });

      // Gerar QR Code para Google Authenticator
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Gerar códigos de backup (10 códigos únicos)
      const backupCodes = this.generateBackupCodes(10);

      // Salvar dados temporários (não ativar ainda)
      await this.saveTempTwoFactorData(userId, secret.base32, backupCodes);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      logger.error('❌ Erro ao gerar setup 2FA:', error);
      throw new Error('Falha ao configurar autenticação de dois fatores');
    }
  }

  // ========================================
  // ATIVAÇÃO DO 2FA
  // ========================================

  async enableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      logger.info(`🔐 Ativando 2FA para usuário ${userId}`);

      // Buscar dados temporários
      const tempData = await this.getTempTwoFactorData(userId);
      if (!tempData) {
        throw new Error('Setup 2FA não encontrado. Gere um novo setup.');
      }

      // Verificar código de ativação
      const isValid = speakeasy.totp.verify({
        secret: tempData.secret,
        encoding: 'base32',
        token: verificationCode,
        window: 2 // Aceitar códigos com 2 intervalos de diferença
      });

      if (!isValid) {
        throw new Error('Código de verificação inválido');
      }

      // Ativar 2FA permanentemente
      await this.activateTwoFactor(userId, tempData.secret, tempData.backupCodes);

      // Limpar dados temporários
      await this.clearTempTwoFactorData(userId);

      logger.info(`✅ 2FA ativado com sucesso para usuário ${userId}`);
      return true;

    } catch (error) {
      logger.error('❌ Erro ao ativar 2FA:', error);
      throw error;
    }
  }

  // ========================================
  // VERIFICAÇÃO DE CÓDIGOS 2FA
  // ========================================

  async verifyTwoFactorCode(userId: string, code: string, type: '2FA' | 'SMS' = '2FA'): Promise<VerificationResult> {
    try {
      // Verificar se usuário está bloqueado
      const user = await this.getTwoFactorUser(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.lockedUntil && new Date() < user.lockedUntil) {
        return {
          valid: false,
          type,
          lockoutExpires: user.lockedUntil
        };
      }

      let isValid = false;

      if (type === '2FA') {
        // Verificar código do Google Authenticator
        if (!user.secret) {
          throw new Error('2FA não configurado para este usuário');
        }

        isValid = speakeasy.totp.verify({
          secret: user.secret,
          encoding: 'base32',
          token: code,
          window: 2
        });

        // Se não válido, verificar se é um código de backup
        if (!isValid && user.backupCodes.includes(code)) {
          isValid = true;
          // Remover código de backup usado
          await this.removeUsedBackupCode(userId, code);
          return { valid: true, type: 'BACKUP_CODE' };
        }
      }

      if (isValid) {
        // Reset tentativas falhadas
        await this.resetFailedAttempts(userId);
        await this.updateLastVerified(userId);
        
        return { valid: true, type };
      } else {
        // Incrementar tentativas falhadas
        const newFailedAttempts = await this.incrementFailedAttempts(userId);
        
        if (newFailedAttempts >= 5) {
          // Bloquear por 30 minutos após 5 tentativas
          await this.lockUser(userId, 30);
          return {
            valid: false,
            type,
            attemptsRemaining: 0,
            lockoutExpires: new Date(Date.now() + 30 * 60 * 1000)
          };
        }

        return {
          valid: false,
          type,
          attemptsRemaining: 5 - newFailedAttempts
        };
      }

    } catch (error) {
      logger.error('❌ Erro ao verificar código 2FA:', error);
      throw error;
    }
  }

  // ========================================
  // SMS BACKUP SYSTEM
  // ========================================

  async sendSMSCode(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        throw new Error('Serviço SMS não configurado');
      }

      // Gerar código de 6 dígitos
      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Salvar código temporariamente (válido por 5 minutos)
      await this.saveSMSCode(userId, smsCode);

      // Enviar SMS
      await this.twilioClient.messages.create({
        body: `MarketBot: Seu código de verificação é: ${smsCode}. Válido por 5 minutos.`,
        from: env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`📱 SMS enviado para usuário ${userId}`);
      return true;

    } catch (error) {
      logger.error('❌ Erro ao enviar SMS:', error);
      throw new Error('Falha ao enviar código SMS');
    }
  }

  async verifySMSCode(userId: string, smsCode: string): Promise<VerificationResult> {
    try {
      const savedCode = await this.getSMSCode(userId);
      
      if (!savedCode || savedCode.code !== smsCode) {
        return this.verifyTwoFactorCode(userId, smsCode, 'SMS');
      }

      if (new Date() > savedCode.expiresAt) {
        await this.clearSMSCode(userId);
        throw new Error('Código SMS expirado');
      }

      // Código válido
      await this.clearSMSCode(userId);
      await this.resetFailedAttempts(userId);
      await this.updateLastVerified(userId);

      return { valid: true, type: 'SMS' };

    } catch (error) {
      logger.error('❌ Erro ao verificar SMS:', error);
      throw error;
    }
  }

  // ========================================
  // GERENCIAMENTO DE BACKUP CODES
  // ========================================

  async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const user = await this.getTwoFactorUser(userId);
      if (!user || !user.is2FAEnabled) {
        throw new Error('2FA não está ativado para este usuário');
      }

      const newBackupCodes = this.generateBackupCodes(10);
      await this.updateBackupCodes(userId, newBackupCodes);

      logger.info(`🔑 Novos códigos de backup gerados para usuário ${userId}`);
      return newBackupCodes;

    } catch (error) {
      logger.error('❌ Erro ao gerar novos códigos de backup:', error);
      throw error;
    }
  }

  // ========================================
  // DESABILITAR 2FA
  // ========================================

  async disableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      // Verificar código antes de desabilitar
      const verification = await this.verifyTwoFactorCode(userId, verificationCode);
      
      if (!verification.valid) {
        throw new Error('Código de verificação inválido');
      }

      // Desabilitar 2FA
      await this.deactivateTwoFactor(userId);

      logger.info(`🔓 2FA desabilitado para usuário ${userId}`);
      return true;

    } catch (error) {
      logger.error('❌ Erro ao desabilitar 2FA:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS - DATABASE
  // ========================================

  private async saveTempTwoFactorData(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    const query = `
      INSERT INTO temp_2fa_setup (user_id, secret, backup_codes, created_at, expires_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
      ON CONFLICT (user_id) DO UPDATE SET
        secret = $2,
        backup_codes = $3,
        created_at = CURRENT_TIMESTAMP,
        expires_at = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
    `;

    await DatabaseService.getInstance().query(query, [userId, secret, JSON.stringify(backupCodes)]);
  }

  private async getTempTwoFactorData(userId: string): Promise<{ secret: string; backupCodes: string[] } | null> {
    const query = `
      SELECT secret, backup_codes 
      FROM temp_2fa_setup 
      WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
    `;

    const result = await DatabaseService.getInstance().query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return {
      secret: result.rows[0].secret,
      backupCodes: JSON.parse(result.rows[0].backup_codes)
    };
  }

  private async clearTempTwoFactorData(userId: string): Promise<void> {
    const query = `DELETE FROM temp_2fa_setup WHERE user_id = $1`;
    await DatabaseService.getInstance().query(query, [userId]);
  }

  private async activateTwoFactor(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    const query = `
      INSERT INTO user_2fa (user_id, secret, backup_codes, is_enabled, created_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        secret = $2,
        backup_codes = $3,
        is_enabled = true,
        updated_at = CURRENT_TIMESTAMP
    `;

    await DatabaseService.getInstance().query(query, [userId, secret, JSON.stringify(backupCodes)]);

    // Atualizar tabela users
    const updateUserQuery = `
      UPDATE users 
      SET two_factor_enabled = true, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await DatabaseService.getInstance().query(updateUserQuery, [userId]);
  }

  private async getTwoFactorUser(userId: string): Promise<TwoFactorUser | null> {
    const query = `
      SELECT 
        u.id as user_id,
        u.two_factor_enabled as is_2fa_enabled,
        u.phone as phone_number,
        u2fa.secret,
        u2fa.backup_codes,
        u2fa.sms_enabled,
        u2fa.last_verified,
        u2fa.failed_attempts,
        u2fa.locked_until
      FROM users u
      LEFT JOIN user_2fa u2fa ON u.id = u2fa.user_id
      WHERE u.id = $1
    `;

    const result = await DatabaseService.getInstance().query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      is2FAEnabled: row.is_2fa_enabled || false,
      secret: row.secret,
      backupCodes: row.backup_codes ? JSON.parse(row.backup_codes) : [],
      phoneNumber: row.phone_number,
      smsEnabled: row.sms_enabled || false,
      lastVerified: row.last_verified,
      failedAttempts: row.failed_attempts || 0,
      lockedUntil: row.locked_until
    };
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 caracteres (4-4 formato)
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + 
                   Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private async removeUsedBackupCode(userId: string, usedCode: string): Promise<void> {
    const user = await this.getTwoFactorUser(userId);
    if (!user) return;

    const updatedCodes = user.backupCodes.filter(code => code !== usedCode);
    
    const query = `
      UPDATE user_2fa 
      SET backup_codes = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await DatabaseService.getInstance().query(query, [userId, JSON.stringify(updatedCodes)]);
  }

  private async incrementFailedAttempts(userId: string): Promise<number> {
    const query = `
      UPDATE user_2fa 
      SET failed_attempts = failed_attempts + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
      RETURNING failed_attempts
    `;
    
    const result = await DatabaseService.getInstance().query(query, [userId]);
    return result.rows[0]?.failed_attempts || 0;
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    const query = `
      UPDATE user_2fa 
      SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await DatabaseService.getInstance().query(query, [userId]);
  }

  private async lockUser(userId: string, minutes: number): Promise<void> {
    const lockUntil = new Date(Date.now() + minutes * 60 * 1000);
    
    const query = `
      UPDATE user_2fa 
      SET locked_until = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await DatabaseService.getInstance().query(query, [userId, lockUntil]);
  }

  private async updateLastVerified(userId: string): Promise<void> {
    const query = `
      UPDATE user_2fa 
      SET last_verified = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await DatabaseService.getInstance().query(query, [userId]);
  }

  private async saveSMSCode(userId: string, code: string): Promise<void> {
    const query = `
      INSERT INTO sms_verification (user_id, code, expires_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '5 minutes')
      ON CONFLICT (user_id) DO UPDATE SET
        code = $2,
        expires_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
    `;
    await DatabaseService.getInstance().query(query, [userId, code]);
  }

  private async getSMSCode(userId: string): Promise<{ code: string; expiresAt: Date } | null> {
    const query = `
      SELECT code, expires_at 
      FROM sms_verification 
      WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await DatabaseService.getInstance().query(query, [userId]);
    return result.rows[0] || null;
  }

  private async clearSMSCode(userId: string): Promise<void> {
    const query = `DELETE FROM sms_verification WHERE user_id = $1`;
    await DatabaseService.getInstance().query(query, [userId]);
  }

  private async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    const query = `
      UPDATE user_2fa 
      SET backup_codes = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await DatabaseService.getInstance().query(query, [userId, JSON.stringify(backupCodes)]);
  }

  private async deactivateTwoFactor(userId: string): Promise<void> {
    const query = `
      UPDATE user_2fa 
      SET is_enabled = false, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await DatabaseService.getInstance().query(query, [userId]);

    // Atualizar tabela users
    const updateUserQuery = `
      UPDATE users 
      SET two_factor_enabled = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await DatabaseService.getInstance().query(updateUserQuery, [userId]);
  }
}

export default TwoFactorService;
