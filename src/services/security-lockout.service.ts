// ========================================
// MARKETBOT - SECURITY LOCKOUT SERVICE
// Sistema de bloqueio e proteção contra ataques
// ========================================

import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { Request } from 'express';

export interface SecurityPolicy {
  max_login_attempts: number;
  lockout_duration_minutes: number;
  suspicious_activity_threshold: number;
  rate_limit_requests_per_minute: number;
  rate_limit_window_minutes: number;
  ip_whitelist: string[];
  require_2fa_for_admin: boolean;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
}

export interface LockoutStatus {
  is_locked: boolean;
  lockout_type: 'USER' | 'IP' | 'DEVICE' | 'GLOBAL';
  locked_until: Date | null;
  attempts_remaining: number;
  reason: string;
  can_use_backup_methods: boolean;
}

export interface SuspiciousActivity {
  user_id?: number;
  ip_address: string;
  activity_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detected_at: Date;
  auto_blocked: boolean;
}

export interface RateLimitStatus {
  is_limited: boolean;
  requests_made: number;
  requests_remaining: number;
  reset_time: Date;
  limit_type: 'IP' | 'USER' | 'ENDPOINT';
}

export class SecurityLockoutService {
  private static instance: SecurityLockoutService;
  private db: Pool;
  private policy: SecurityPolicy;

  // Configurações padrão de segurança
  private readonly DEFAULT_POLICY: SecurityPolicy = {
    max_login_attempts: 5,
    lockout_duration_minutes: 60,
    suspicious_activity_threshold: 3,
    rate_limit_requests_per_minute: 60,
    rate_limit_window_minutes: 1,
    ip_whitelist: ['127.0.0.1', '::1'],
    require_2fa_for_admin: true,
    session_timeout_minutes: 60,
    max_concurrent_sessions: 3
  };

  // Padrões suspeitos para detecção
  private readonly SUSPICIOUS_PATTERNS = {
    sql_injection: [
      'union select', 'drop table', 'insert into', 'delete from',
      'or 1=1', 'or 1 = 1', '\'or\'1\'=\'1', 'exec(', 'execute(',
      'sp_executesql', 'xp_cmdshell'
    ],
    xss_attempts: [
      '<script', 'javascript:', 'onload=', 'onerror=', 'onclick=',
      'eval(', 'alert(', 'document.cookie', 'window.location'
    ],
    brute_force: [
      'rapid_requests', 'multiple_failures', 'sequential_attempts'
    ]
  };

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
    this.policy = this.DEFAULT_POLICY;
    this.loadSecurityPolicy();
  }

  static getInstance(): SecurityLockoutService {
    if (!SecurityLockoutService.instance) {
      SecurityLockoutService.instance = new SecurityLockoutService();
    }
    return SecurityLockoutService.instance;
  }

  // ========================================
  // VERIFICAÇÃO DE BLOQUEIOS
  // ========================================

  async checkLockoutStatus(userId?: number, ipAddress?: string, deviceFingerprint?: string): Promise<LockoutStatus> {
    try {
      const checks = await Promise.all([
        this.checkUserLockout(userId),
        this.checkIPLockout(ipAddress),
        this.checkDeviceLockout(deviceFingerprint),
        this.checkGlobalLockout()
      ]);

      // Retornar o primeiro bloqueio encontrado (prioridade: Global > User > IP > Device)
      for (const check of checks) {
        if (check.is_locked) {
          return check;
        }
      }

      // Calcular tentativas restantes baseado no menor número
      const attemptsRemaining = Math.min(
        ...checks.map(c => c.attempts_remaining).filter(a => a > 0)
      );

      return {
        is_locked: false,
        lockout_type: 'USER',
        locked_until: null,
        attempts_remaining: attemptsRemaining || this.policy.max_login_attempts,
        reason: 'Acesso permitido',
        can_use_backup_methods: true
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status de bloqueio:', error);
      
      // Em caso de erro, aplicar política conservadora
      return {
        is_locked: true,
        lockout_type: 'GLOBAL',
        locked_until: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        attempts_remaining: 0,
        reason: 'Erro de sistema - acesso temporariamente bloqueado',
        can_use_backup_methods: false
      };
    }
  }

  private async checkUserLockout(userId?: number): Promise<LockoutStatus> {
    if (!userId) {
      return this.createUnlockedStatus();
    }

    const since = new Date();
    since.setMinutes(since.getMinutes() - this.policy.lockout_duration_minutes);

    const result = await this.db.query(`
      SELECT COUNT(*) as failed_attempts
      FROM login_attempts 
      WHERE user_id = $1 
      AND success = false 
      AND created_at > $2
    `, [userId, since]);

    const failedAttempts = parseInt(result.rows[0].failed_attempts);
    const isLocked = failedAttempts >= this.policy.max_login_attempts;

    if (isLocked) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(lockoutUntil.getMinutes() + this.policy.lockout_duration_minutes);

      return {
        is_locked: true,
        lockout_type: 'USER',
        locked_until: lockoutUntil,
        attempts_remaining: 0,
        reason: `Usuário bloqueado por ${this.policy.lockout_duration_minutes} minutos após ${failedAttempts} tentativas falhadas`,
        can_use_backup_methods: false
      };
    }

    return {
      is_locked: false,
      lockout_type: 'USER',
      locked_until: null,
      attempts_remaining: this.policy.max_login_attempts - failedAttempts,
      reason: 'Usuário não bloqueado',
      can_use_backup_methods: true
    };
  }

  private async checkIPLockout(ipAddress?: string): Promise<LockoutStatus> {
    if (!ipAddress || this.isWhitelistedIP(ipAddress)) {
      return this.createUnlockedStatus();
    }

    const since = new Date();
    since.setMinutes(since.getMinutes() - this.policy.lockout_duration_minutes);

    const result = await this.db.query(`
      SELECT COUNT(*) as failed_attempts
      FROM login_attempts 
      WHERE ip_address = $1 
      AND success = false 
      AND created_at > $2
    `, [ipAddress, since]);

    const failedAttempts = parseInt(result.rows[0].failed_attempts);
    const threshold = Math.ceil(this.policy.max_login_attempts * 1.5); // Threshold mais alto para IP
    const isLocked = failedAttempts >= threshold;

    if (isLocked) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(lockoutUntil.getMinutes() + this.policy.lockout_duration_minutes);

      return {
        is_locked: true,
        lockout_type: 'IP',
        locked_until: lockoutUntil,
        attempts_remaining: 0,
        reason: `IP ${ipAddress} bloqueado por atividade suspeita (${failedAttempts} tentativas)`,
        can_use_backup_methods: false
      };
    }

    return this.createUnlockedStatus();
  }

  private async checkDeviceLockout(deviceFingerprint?: string): Promise<LockoutStatus> {
    if (!deviceFingerprint) {
      return this.createUnlockedStatus();
    }

    // Verificar se dispositivo está marcado como malicioso
    const result = await this.db.query(`
      SELECT blocked_until, reason
      FROM blocked_devices 
      WHERE device_fingerprint = $1 
      AND blocked_until > NOW()
    `, [deviceFingerprint]);

    if (result.rows.length > 0) {
      return {
        is_locked: true,
        lockout_type: 'DEVICE',
        locked_until: result.rows[0].blocked_until,
        attempts_remaining: 0,
        reason: result.rows[0].reason || 'Dispositivo bloqueado por atividade suspeita',
        can_use_backup_methods: false
      };
    }

    return this.createUnlockedStatus();
  }

  private async checkGlobalLockout(): Promise<LockoutStatus> {
    // Verificar se há bloqueio global ativo
    const result = await this.db.query(`
      SELECT active_until, reason
      FROM global_lockouts 
      WHERE active_until > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      return {
        is_locked: true,
        lockout_type: 'GLOBAL',
        locked_until: result.rows[0].active_until,
        attempts_remaining: 0,
        reason: result.rows[0].reason || 'Sistema em manutenção de segurança',
        can_use_backup_methods: false
      };
    }

    return this.createUnlockedStatus();
  }

  // ========================================
  // RATE LIMITING
  // ========================================

  async checkRateLimit(identifier: string, limitType: 'IP' | 'USER' | 'ENDPOINT' = 'IP'): Promise<RateLimitStatus> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - this.policy.rate_limit_window_minutes);

      const result = await this.db.query(`
        SELECT COUNT(*) as request_count
        FROM rate_limit_tracking 
        WHERE identifier = $1 
        AND limit_type = $2
        AND created_at > $3
      `, [identifier, limitType, windowStart]);

      const requestCount = parseInt(result.rows[0].request_count || '0');
      const isLimited = requestCount >= this.policy.rate_limit_requests_per_minute;

      const resetTime = new Date();
      resetTime.setMinutes(resetTime.getMinutes() + this.policy.rate_limit_window_minutes);

      return {
        is_limited: isLimited,
        requests_made: requestCount,
        requests_remaining: Math.max(0, this.policy.rate_limit_requests_per_minute - requestCount),
        reset_time: resetTime,
        limit_type: limitType
      };

    } catch (error) {
      console.error('❌ Erro ao verificar rate limit:', error);
      return {
        is_limited: true,
        requests_made: 999,
        requests_remaining: 0,
        reset_time: new Date(Date.now() + 60000),
        limit_type: limitType
      };
    }
  }

  async recordRequest(identifier: string, limitType: 'IP' | 'USER' | 'ENDPOINT' = 'IP', metadata?: any): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO rate_limit_tracking (
          identifier, limit_type, metadata, created_at
        ) VALUES ($1, $2, $3, NOW())
      `, [identifier, limitType, JSON.stringify(metadata || {})]);
    } catch (error) {
      console.error('❌ Erro ao registrar request para rate limit:', error);
    }
  }

  // ========================================
  // DETECÇÃO DE ATIVIDADE SUSPEITA
  // ========================================

  async detectSuspiciousActivity(req: Request, userId?: number): Promise<SuspiciousActivity[]> {
    const suspiciousActivities: SuspiciousActivity[] = [];
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // Verificar padrões de SQL Injection
      const sqlInjectionActivity = this.checkSQLInjection(req, ipAddress);
      if (sqlInjectionActivity) {
        suspiciousActivities.push(sqlInjectionActivity);
      }

      // Verificar padrões de XSS
      const xssActivity = this.checkXSSAttempts(req, ipAddress);
      if (xssActivity) {
        suspiciousActivities.push(xssActivity);
      }

      // Verificar User-Agent suspeito
      const userAgentActivity = this.checkSuspiciousUserAgent(userAgent, ipAddress);
      if (userAgentActivity) {
        suspiciousActivities.push(userAgentActivity);
      }

      // Verificar múltiplas tentativas de login
      const bruteForceActivity = await this.checkBruteForceAttempts(userId, ipAddress);
      if (bruteForceActivity) {
        suspiciousActivities.push(bruteForceActivity);
      }

      // Verificar requests anômalos
      const anomalousActivity = await this.checkAnomalousRequests(ipAddress);
      if (anomalousActivity) {
        suspiciousActivities.push(anomalousActivity);
      }

      // Registrar atividades detectadas
      for (const activity of suspiciousActivities) {
        await this.logSuspiciousActivity(activity);
        
        // Auto-bloqueio para atividades críticas
        if (activity.severity === 'CRITICAL') {
          await this.autoBlockThreat(activity);
        }
      }

      return suspiciousActivities;

    } catch (error) {
      console.error('❌ Erro na detecção de atividade suspeita:', error);
      return [];
    }
  }

  private checkSQLInjection(req: Request, ipAddress: string): SuspiciousActivity | null {
    const requestString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;
    const lowercaseRequest = requestString.toLowerCase();

    for (const pattern of this.SUSPICIOUS_PATTERNS.sql_injection) {
      if (lowercaseRequest.includes(pattern)) {
        return {
          ip_address: ipAddress,
          activity_type: 'SQL_INJECTION_ATTEMPT',
          severity: 'CRITICAL',
          description: `Tentativa de SQL Injection detectada: padrão "${pattern}" encontrado`,
          detected_at: new Date(),
          auto_blocked: true
        };
      }
    }

    return null;
  }

  private checkXSSAttempts(req: Request, ipAddress: string): SuspiciousActivity | null {
    const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
    const lowercaseRequest = requestString.toLowerCase();

    for (const pattern of this.SUSPICIOUS_PATTERNS.xss_attempts) {
      if (lowercaseRequest.includes(pattern)) {
        return {
          ip_address: ipAddress,
          activity_type: 'XSS_ATTEMPT',
          severity: 'HIGH',
          description: `Tentativa de XSS detectada: padrão "${pattern}" encontrado`,
          detected_at: new Date(),
          auto_blocked: true
        };
      }
    }

    return null;
  }

  private checkSuspiciousUserAgent(userAgent: string, ipAddress: string): SuspiciousActivity | null {
    const suspiciousAgents = [
      'sqlmap', 'nmap', 'masscan', 'nikto', 'burpsuite', 'owasp',
      'python-requests', 'curl', 'wget', 'scrapy', 'bot', 'crawler'
    ];

    const lowercaseAgent = userAgent.toLowerCase();

    for (const agent of suspiciousAgents) {
      if (lowercaseAgent.includes(agent)) {
        return {
          ip_address: ipAddress,
          activity_type: 'SUSPICIOUS_USER_AGENT',
          severity: 'MEDIUM',
          description: `User-Agent suspeito detectado: ${userAgent}`,
          detected_at: new Date(),
          auto_blocked: false
        };
      }
    }

    return null;
  }

  private async checkBruteForceAttempts(userId: number | undefined, ipAddress: string): Promise<SuspiciousActivity | null> {
    if (!userId) return null;

    const since = new Date();
    since.setMinutes(since.getMinutes() - 10); // Últimos 10 minutos

    const result = await this.db.query(`
      SELECT COUNT(*) as attempts
      FROM login_attempts 
      WHERE (user_id = $1 OR ip_address = $2)
      AND success = false 
      AND created_at > $3
    `, [userId, ipAddress, since]);

    const attempts = parseInt(result.rows[0].attempts);

    if (attempts >= this.policy.suspicious_activity_threshold) {
      return {
        user_id: userId,
        ip_address: ipAddress,
        activity_type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        description: `${attempts} tentativas de login falhadas em 10 minutos`,
        detected_at: new Date(),
        auto_blocked: attempts >= this.policy.max_login_attempts
      };
    }

    return null;
  }

  private async checkAnomalousRequests(ipAddress: string): Promise<SuspiciousActivity | null> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - 1); // Último minuto

    const result = await this.db.query(`
      SELECT COUNT(*) as requests
      FROM rate_limit_tracking 
      WHERE identifier = $1 
      AND created_at > $2
    `, [ipAddress, since]);

    const requests = parseInt(result.rows[0].requests || '0');

    if (requests > this.policy.rate_limit_requests_per_minute * 2) {
      return {
        ip_address: ipAddress,
        activity_type: 'ANOMALOUS_REQUEST_PATTERN',
        severity: 'MEDIUM',
        description: `${requests} requests em 1 minuto (limite: ${this.policy.rate_limit_requests_per_minute})`,
        detected_at: new Date(),
        auto_blocked: false
      };
    }

    return null;
  }

  // ========================================
  // AÇÕES DE BLOQUEIO
  // ========================================

  private async autoBlockThreat(activity: SuspiciousActivity): Promise<void> {
    try {
      const blockDuration = this.calculateBlockDuration(activity.severity);
      const blockedUntil = new Date(Date.now() + blockDuration);

      // Bloquear IP
      await this.db.query(`
        INSERT INTO blocked_ips (
          ip_address, reason, severity, blocked_until, auto_blocked, created_at
        ) VALUES ($1, $2, $3, $4, true, NOW())
        ON CONFLICT (ip_address) DO UPDATE SET
          blocked_until = GREATEST(blocked_ips.blocked_until, EXCLUDED.blocked_until),
          reason = EXCLUDED.reason,
          updated_at = NOW()
      `, [activity.ip_address, activity.description, activity.severity, blockedUntil]);

      // Registrar evento de bloqueio
      await this.db.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, success, created_at
        ) VALUES ($1, 'AUTO_BLOCK_THREAT', $2, $3, true, NOW())
      `, [activity.user_id, `Auto-bloqueio: ${activity.description}`, activity.ip_address]);

      console.log(`🚫 Auto-bloqueio aplicado: ${activity.ip_address} por ${activity.description}`);

    } catch (error) {
      console.error('❌ Erro ao aplicar auto-bloqueio:', error);
    }
  }

  private calculateBlockDuration(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 24 * 60 * 60 * 1000; // 24 horas
      case 'HIGH': return 4 * 60 * 60 * 1000;      // 4 horas
      case 'MEDIUM': return 1 * 60 * 60 * 1000;    // 1 hora
      case 'LOW': return 15 * 60 * 1000;           // 15 minutos
      default: return 60 * 60 * 1000;              // 1 hora padrão
    }
  }

  private async logSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO suspicious_activities (
          user_id, ip_address, activity_type, severity, description, 
          auto_blocked, detected_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        activity.user_id,
        activity.ip_address,
        activity.activity_type,
        activity.severity,
        activity.description,
        activity.auto_blocked,
        activity.detected_at
      ]);
    } catch (error) {
      console.error('❌ Erro ao registrar atividade suspeita:', error);
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  private async loadSecurityPolicy(): Promise<void> {
    try {
      const settings = await this.db.query(`
        SELECT key, value FROM system_settings 
        WHERE key IN (
          'max_login_attempts', 'lockout_duration_minutes', 
          'suspicious_activity_threshold', 'rate_limit_requests_per_minute',
          'require_2fa_for_admin', 'session_timeout_minutes'
        )
      `);

      this.policy = { ...this.DEFAULT_POLICY };

      for (const setting of settings.rows) {
        if (setting.key in this.policy) {
          const numValue = parseInt(setting.value);
          if (!isNaN(numValue)) {
            (this.policy as any)[setting.key] = numValue;
          } else if (setting.value === 'true' || setting.value === 'false') {
            (this.policy as any)[setting.key] = setting.value === 'true';
          }
        }
      }

      console.log('✅ Política de segurança carregada');
    } catch (error) {
      console.error('❌ Erro ao carregar política de segurança, usando padrões:', error);
      this.policy = this.DEFAULT_POLICY;
    }
  }

  private isWhitelistedIP(ipAddress: string): boolean {
    return this.policy.ip_whitelist.includes(ipAddress);
  }

  private getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '0.0.0.0'
    ).split(',')[0].trim();
  }

  private createUnlockedStatus(): LockoutStatus {
    return {
      is_locked: false,
      lockout_type: 'USER',
      locked_until: null,
      attempts_remaining: this.policy.max_login_attempts,
      reason: 'Acesso permitido',
      can_use_backup_methods: true
    };
  }

  // ========================================
  // MÉTODOS PÚBLICOS DE GESTÃO
  // ========================================

  async clearUserLockout(userId: number, adminUserId: number): Promise<boolean> {
    try {
      await this.db.query(`
        DELETE FROM login_attempts 
        WHERE user_id = $1 AND success = false
      `, [userId]);

      await this.db.query(`
        INSERT INTO security_events (
          user_id, event_type, description, ip_address, user_agent, success, created_at
        ) VALUES ($1, 'ADMIN_UNLOCK_USER', 'Admin liberou bloqueio do usuário ${userId}', '0.0.0.0', 'Admin Action', true, NOW())
      `, [adminUserId]);

      console.log(`✅ Bloqueio removido para usuário ${userId} por admin ${adminUserId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover bloqueio do usuário:', error);
      return false;
    }
  }

  async getSecurityDashboard(): Promise<any> {
    try {
      const stats = await Promise.all([
        this.db.query('SELECT COUNT(*) as blocked_ips FROM blocked_ips WHERE blocked_until > NOW()'),
        this.db.query('SELECT COUNT(*) as suspicious_activities FROM suspicious_activities WHERE detected_at > NOW() - INTERVAL \'24 hours\''),
        this.db.query('SELECT COUNT(*) as failed_logins FROM login_attempts WHERE success = false AND created_at > NOW() - INTERVAL \'1 hour\''),
        this.db.query(`
          SELECT 
            severity, COUNT(*) as count 
          FROM suspicious_activities 
          WHERE detected_at > NOW() - INTERVAL '24 hours'
          GROUP BY severity
        `)
      ]);

      return {
        blocked_ips: parseInt(stats[0].rows[0].blocked_ips),
        suspicious_activities_24h: parseInt(stats[1].rows[0].suspicious_activities),
        failed_logins_1h: parseInt(stats[2].rows[0].failed_logins),
        activities_by_severity: stats[3].rows.reduce((acc, row) => {
          acc[row.severity.toLowerCase()] = parseInt(row.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dashboard de segurança:', error);
      return {};
    }
  }

  async cleanupOldData(): Promise<void> {
    try {
      const cleanupTasks = await Promise.all([
        this.db.query('DELETE FROM rate_limit_tracking WHERE created_at < NOW() - INTERVAL \'1 hour\''),
        this.db.query('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL \'24 hours\''),
        this.db.query('DELETE FROM suspicious_activities WHERE detected_at < NOW() - INTERVAL \'7 days\''),
        this.db.query('DELETE FROM blocked_ips WHERE blocked_until < NOW()')
      ]);

      const totalCleaned = cleanupTasks.reduce((sum, result) => sum + (result.rowCount || 0), 0);
      console.log(`🧹 Limpeza de segurança: ${totalCleaned} registros antigos removidos`);
    } catch (error) {
      console.error('❌ Erro na limpeza de dados de segurança:', error);
    }
  }
}

export default SecurityLockoutService;
