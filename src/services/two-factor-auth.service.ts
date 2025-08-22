// ========================================
// MARKETBOT - TWO FACTOR AUTHENTICATION SERVICE
// Sistema 2FA enterprise-grade obrigatório para todos
// ========================================

import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from './database.service';
import crypto from 'crypto';

export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  manual_entry_key: string;
}

export interface TwoFactorValidation {
  user_id: number;
  token: string;
  backup_code?: string;
  device_info?: {
    ip: string;
    user_agent: string;
    device_fingerprint: string;
  };
}

export interface TwoFactorStatus {
  is_enabled: boolean;
  backup_codes_remaining: number;
  last_used: Date | null;
  setup_completed: boolean;
  trusted_devices: number;
}

export interface LoginAttempt {
  id: number;
  user_id: number;
  ip_address: string;
  user_agent: string;
  attempt_type: 'PASSWORD' | '2FA' | 'BACKUP_CODE';
  success: boolean;
  failure_reason?: string;
  device_fingerprint: string;
  created_at: Date;
}

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;
  private db: Pool;

  // Configurações de segurança
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 60;
  private readonly TRUSTED_DEVICE_DURATION_DAYS = 30;
  private readonly TOKEN_WINDOW = 2; // Aceitar tokens +/- 2 janelas de tempo (60s cada)

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
  }

  static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  // ========================================
  // SETUP INICIAL DO 2FA
  // ========================================

  async setupTwoFactor(userId: number, userEmail: string): Promise<TwoFactorSetup> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se já existe setup
      const existingSetup = await client.query(
        'SELECT id FROM user_2fa WHERE user_id = $1',
        [userId]
      );

      if (existingSetup.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('2FA já está configurado para este usuário');
      }

      // Gerar secret único
      const secret = speakeasy.generateSecret({
        name: `MarketBot (${userEmail})`,
        issuer: 'MarketBot Trading Platform',
        length: 32
      });

      // Gerar códigos de backup
      const backupCodes = this.generateBackupCodes();

      // Gerar QR code
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: userEmail,
        issuer: 'MarketBot',
        encoding: 'ascii'
      });

      const qrCodeImage = await qrcode.toDataURL(qrCodeUrl);

      // Salvar no banco (ainda não ativado)
      await client.query(`
        INSERT INTO user_2fa (
          user_id, secret_key, backup_codes, is_enabled, 
          setup_completed, created_at
        ) VALUES ($1, $2, $3, false, false, NOW())
      `, [userId, secret.ascii, JSON.stringify(backupCodes)]);

      // Registrar evento de setup
      await client.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, 
          user_agent, success, created_at
        ) VALUES ($1, '2FA_SETUP_INITIATED', 'Usuário iniciou configuração 2FA', $2, $3, true, NOW())
      `, [userId, '0.0.0.0', 'Setup Request']);

      await client.query('COMMIT');

      console.log(`✅ 2FA setup iniciado para usuário ${userId} (${userEmail})`);

      return {
        secret: secret.ascii,
        qr_code: qrCodeImage,
        backup_codes: backupCodes,
        manual_entry_key: secret.ascii
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro no setup 2FA:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // ATIVAÇÃO DO 2FA
  // ========================================

  async enableTwoFactor(userId: number, verificationToken: string, deviceInfo: any): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar configuração pendente
      const setup = await client.query(
        'SELECT secret_key, is_enabled FROM user_2fa WHERE user_id = $1',
        [userId]
      );

      if (setup.rows.length === 0) {
        throw new Error('Setup 2FA não encontrado. Inicie o setup primeiro.');
      }

      if (setup.rows[0].is_enabled) {
        throw new Error('2FA já está ativado para este usuário');
      }

      const secret = setup.rows[0].secret_key;

      // Verificar token de ativação
      const isValidToken = speakeasy.totp.verify({
        secret: secret,
        encoding: 'ascii',
        token: verificationToken,
        window: this.TOKEN_WINDOW
      });

      if (!isValidToken) {
        // Registrar tentativa falhada
        await this.logLoginAttempt({
          user_id: userId,
          ip_address: deviceInfo.ip || '0.0.0.0',
          user_agent: deviceInfo.user_agent || 'Unknown',
          attempt_type: '2FA',
          success: false,
          failure_reason: 'Token inválido durante ativação',
          device_fingerprint: deviceInfo.device_fingerprint || 'unknown'
        });

        await client.query('ROLLBACK');
        throw new Error('Token de verificação inválido');
      }

      // Ativar 2FA
      await client.query(`
        UPDATE user_2fa 
        SET is_enabled = true, 
            setup_completed = true, 
            enabled_at = NOW(),
            updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      // Atualizar status do usuário
      await client.query(`
        UPDATE users 
        SET two_factor_enabled = true, 
            updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Registrar evento de ativação
      await client.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, 
          user_agent, success, created_at
        ) VALUES ($1, '2FA_ENABLED', 'Usuário ativou 2FA com sucesso', $2, $3, true, NOW())
      `, [userId, deviceInfo.ip, deviceInfo.user_agent]);

      // Registrar tentativa bem-sucedida
      await this.logLoginAttempt({
        user_id: userId,
        ip_address: deviceInfo.ip || '0.0.0.0',
        user_agent: deviceInfo.user_agent || 'Unknown',
        attempt_type: '2FA',
        success: true,
        device_fingerprint: deviceInfo.device_fingerprint || 'unknown'
      });

      await client.query('COMMIT');

      console.log(`✅ 2FA ativado com sucesso para usuário ${userId}`);
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro na ativação 2FA:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // VALIDAÇÃO DO 2FA NO LOGIN
  // ========================================

  async validateTwoFactor(validation: TwoFactorValidation): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar bloqueio por tentativas excessivas
      const isLocked = await this.isUserLocked(validation.user_id, validation.device_info?.ip);
      if (isLocked) {
        throw new Error(`Usuário bloqueado por ${this.LOCKOUT_DURATION_MINUTES} minutos devido a tentativas excessivas`);
      }

      // Buscar configuração 2FA
      const userAuth = await client.query(`
        SELECT secret_key, backup_codes, is_enabled, last_used_at
        FROM user_2fa 
        WHERE user_id = $1 AND is_enabled = true
      `, [validation.user_id]);

      if (userAuth.rows.length === 0) {
        throw new Error('2FA não está configurado ou ativado para este usuário');
      }

      const { secret_key, backup_codes } = userAuth.rows[0];
      let validationSuccess = false;
      let validationType = '2FA';

      // Verificar se é código de backup
      if (validation.backup_code) {
        validationSuccess = await this.validateBackupCode(
          client, 
          validation.user_id, 
          validation.backup_code, 
          JSON.parse(backup_codes)
        );
        validationType = 'BACKUP_CODE';
      } 
      // Verificar token TOTP
      else if (validation.token) {
        validationSuccess = speakeasy.totp.verify({
          secret: secret_key,
          encoding: 'ascii',
          token: validation.token,
          window: this.TOKEN_WINDOW
        });
      } else {
        throw new Error('Token ou código de backup é obrigatório');
      }

      // Registrar tentativa
      await this.logLoginAttempt({
        user_id: validation.user_id,
        ip_address: validation.device_info?.ip || '0.0.0.0',
        user_agent: validation.device_info?.user_agent || 'Unknown',
        attempt_type: validationType as any,
        success: validationSuccess,
        failure_reason: validationSuccess ? undefined : 'Token/código inválido',
        device_fingerprint: validation.device_info?.device_fingerprint || 'unknown'
      });

      if (validationSuccess) {
        // Atualizar último uso
        await client.query(`
          UPDATE user_2fa 
          SET last_used_at = NOW(), updated_at = NOW()
          WHERE user_id = $1
        `, [validation.user_id]);

        // Registrar evento de sucesso
        await client.query(`
          INSERT INTO security_events (
            user_id, event_type, description, ip_address, 
            user_agent, success, created_at
          ) VALUES ($1, '2FA_LOGIN_SUCCESS', 'Login 2FA bem-sucedido', $2, $3, true, NOW())
        `, [validation.user_id, validation.device_info?.ip, validation.device_info?.user_agent]);

        // Limpar tentativas de login falhadas
        await this.clearFailedAttempts(validation.user_id, validation.device_info?.ip);
      } else {
        // Registrar falha de segurança
        await client.query(`
          INSERT INTO security_events (
            user_id, event_type, description, ip_address, 
            user_agent, success, created_at
          ) VALUES ($1, '2FA_LOGIN_FAILED', 'Falha na validação 2FA', $2, $3, false, NOW())
        `, [validation.user_id, validation.device_info?.ip, validation.device_info?.user_agent]);
      }

      await client.query('COMMIT');

      console.log(`${validationSuccess ? '✅' : '❌'} Validação 2FA para usuário ${validation.user_id}: ${validationSuccess ? 'SUCESSO' : 'FALHA'}`);
      return validationSuccess;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro na validação 2FA:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // CÓDIGOS DE BACKUP
  // ========================================

  private async validateBackupCode(client: PoolClient, userId: number, backupCode: string, backupCodes: string[]): Promise<boolean> {
    const hashedCode = this.hashBackupCode(backupCode);
    const codeIndex = backupCodes.indexOf(hashedCode);
    
    if (codeIndex === -1) {
      return false;
    }

    // Remover código usado
    backupCodes.splice(codeIndex, 1);
    
    // Atualizar no banco
    await client.query(`
      UPDATE user_2fa 
      SET backup_codes = $1, updated_at = NOW()
      WHERE user_id = $2
    `, [JSON.stringify(backupCodes), userId]);

    // Alertar se restam poucos códigos
    if (backupCodes.length <= 2) {
      await client.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, 
          user_agent, success, created_at
        ) VALUES ($1, 'BACKUP_CODES_LOW', 'Restam apenas ${backupCodes.length} códigos de backup', '0.0.0.0', 'System', true, NOW())
      `, [userId]);
    }

    return true;
  }

  async regenerateBackupCodes(userId: number): Promise<string[]> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se 2FA está ativo
      const userAuth = await client.query(
        'SELECT id FROM user_2fa WHERE user_id = $1 AND is_enabled = true',
        [userId]
      );

      if (userAuth.rows.length === 0) {
        throw new Error('2FA não está ativado para este usuário');
      }

      // Gerar novos códigos
      const newBackupCodes = this.generateBackupCodes();

      // Atualizar no banco
      await client.query(`
        UPDATE user_2fa 
        SET backup_codes = $1, updated_at = NOW()
        WHERE user_id = $2
      `, [JSON.stringify(newBackupCodes.map(code => this.hashBackupCode(code))), userId]);

      // Registrar evento
      await client.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, 
          user_agent, success, created_at
        ) VALUES ($1, 'BACKUP_CODES_REGENERATED', 'Códigos de backup regenerados', '0.0.0.0', 'User Request', true, NOW())
      `, [userId]);

      await client.query('COMMIT');

      console.log(`✅ Códigos de backup regenerados para usuário ${userId}`);
      return newBackupCodes; // Retornar os códigos em texto claro (apenas esta vez)

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao regenerar códigos de backup:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // CONTROLE DE TENTATIVAS E BLOQUEIO
  // ========================================

  private async isUserLocked(userId: number, ipAddress?: string): Promise<boolean> {
    try {
      const since = new Date();
      since.setMinutes(since.getMinutes() - this.LOCKOUT_DURATION_MINUTES);

      const failedAttempts = await this.db.query(`
        SELECT COUNT(*) as count
        FROM login_attempts 
        WHERE user_id = $1 
        AND ip_address = $2
        AND success = false 
        AND created_at > $3
      `, [userId, ipAddress || '0.0.0.0', since]);

      const count = parseInt(failedAttempts.rows[0].count);
      return count >= this.MAX_LOGIN_ATTEMPTS;
    } catch (error) {
      console.error('❌ Erro ao verificar bloqueio:', error);
      return false;
    }
  }

  private async clearFailedAttempts(userId: number, ipAddress?: string): Promise<void> {
    try {
      await this.db.query(`
        DELETE FROM login_attempts 
        WHERE user_id = $1 
        AND ip_address = $2
        AND success = false
      `, [userId, ipAddress || '0.0.0.0']);
    } catch (error) {
      console.error('❌ Erro ao limpar tentativas falhadas:', error);
    }
  }

  private async logLoginAttempt(attempt: Omit<LoginAttempt, 'id' | 'created_at'>): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO login_attempts (
          user_id, ip_address, user_agent, attempt_type, 
          success, failure_reason, device_fingerprint, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        attempt.user_id,
        attempt.ip_address,
        attempt.user_agent,
        attempt.attempt_type,
        attempt.success,
        attempt.failure_reason,
        attempt.device_fingerprint
      ]);
    } catch (error) {
      console.error('❌ Erro ao registrar tentativa de login:', error);
    }
  }

  // ========================================
  // STATUS E CONSULTAS
  // ========================================

  async getTwoFactorStatus(userId: number): Promise<TwoFactorStatus> {
    try {
      const result = await this.db.query(`
        SELECT 
          is_enabled,
          backup_codes,
          last_used_at,
          setup_completed
        FROM user_2fa 
        WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return {
          is_enabled: false,
          backup_codes_remaining: 0,
          last_used: null,
          setup_completed: false,
          trusted_devices: 0
        };
      }

      const row = result.rows[0];
      const backupCodes = JSON.parse(row.backup_codes || '[]');

      // Contar dispositivos confiáveis (implementação futura)
      const trustedDevices = 0;

      return {
        is_enabled: row.is_enabled,
        backup_codes_remaining: backupCodes.length,
        last_used: row.last_used_at,
        setup_completed: row.setup_completed,
        trusted_devices: trustedDevices
      };
    } catch (error) {
      console.error('❌ Erro ao buscar status 2FA:', error);
      throw error;
    }
  }

  async getSecurityEvents(userId: number, limit = 20): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          event_type,
          description,
          ip_address,
          user_agent,
          success,
          created_at
        FROM security_events 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos de segurança:', error);
      return [];
    }
  }

  // ========================================
  // UTILITÁRIOS PRIVADOS
  // ========================================

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Gerar código de 8 dígitos
      const code = Math.random().toString().substr(2, 8);
      codes.push(code);
    }
    return codes;
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code + 'marketbot_salt').digest('hex');
  }

  async disableTwoFactor(userId: number, verificationToken: string, adminOverride = false): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      if (!adminOverride) {
        // Validar token antes de desativar
        const isValid = await this.validateTwoFactor({
          user_id: userId,
          token: verificationToken
        });

        if (!isValid) {
          throw new Error('Token inválido para desativação do 2FA');
        }
      }

      // Desativar 2FA
      await client.query(`
        UPDATE user_2fa 
        SET is_enabled = false, disabled_at = NOW(), updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      await client.query(`
        UPDATE users 
        SET two_factor_enabled = false, updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Registrar evento
      await client.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, 
          user_agent, success, created_at
        ) VALUES ($1, '2FA_DISABLED', $2, '0.0.0.0', 'User Request', true, NOW())
      `, [userId, adminOverride ? 'Admin override 2FA disable' : 'User disabled 2FA']);

      await client.query('COMMIT');

      console.log(`⚠️ 2FA desativado para usuário ${userId} ${adminOverride ? '(admin override)' : ''}`);
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao desativar 2FA:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // LIMPEZA E MANUTENÇÃO
  // ========================================

  async cleanupOldAttempts(): Promise<number> {
    try {
      // Limpar tentativas de login antigas (mais de 24 horas)
      const result = await this.db.query(`
        DELETE FROM login_attempts 
        WHERE created_at < NOW() - INTERVAL '24 hours'
      `);

      console.log(`🧹 Limpeza: ${result.rowCount} tentativas de login antigas removidas`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('❌ Erro na limpeza de tentativas antigas:', error);
      return 0;
    }
  }

  async getSecurityStatistics(): Promise<any> {
    try {
      const stats = await this.db.query(`
        SELECT 
          COUNT(CASE WHEN u2fa.is_enabled = true THEN 1 END) as users_with_2fa,
          COUNT(*) as total_users,
          AVG(CASE WHEN u2fa.is_enabled = true THEN 1.0 ELSE 0.0 END) * 100 as adoption_rate
        FROM users u
        LEFT JOIN user_2fa u2fa ON u.id = u2fa.user_id
      `);

      const recentAttempts = await this.db.query(`
        SELECT 
          COUNT(CASE WHEN success = true THEN 1 END) as successful_attempts,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_attempts,
          COUNT(*) as total_attempts
        FROM login_attempts 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      return {
        users_with_2fa: parseInt(stats.rows[0].users_with_2fa),
        total_users: parseInt(stats.rows[0].total_users),
        adoption_rate: parseFloat(stats.rows[0].adoption_rate).toFixed(2),
        daily_successful_attempts: parseInt(recentAttempts.rows[0].successful_attempts),
        daily_failed_attempts: parseInt(recentAttempts.rows[0].failed_attempts),
        daily_total_attempts: parseInt(recentAttempts.rows[0].total_attempts)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de segurança:', error);
      return {};
    }
  }
}

export default TwoFactorAuthService;
