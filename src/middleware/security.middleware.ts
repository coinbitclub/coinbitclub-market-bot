// ========================================
// MARKETBOT - SECURITY MIDDLEWARE
// Middleware integrado de segurança para todas as rotas
// ========================================

import { Request, Response, NextFunction } from 'express';
import { SecurityLockoutService } from '../services/security-lockout.service';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import rateLimit from 'express-rate-limit';

export interface SecurityRequest extends Request {
  security?: {
    lockoutStatus: any;
    rateLimitStatus: any;
    suspiciousActivities: any[];
    deviceFingerprint?: string;
    requiresTwoFactor: boolean;
  };
  session?: any;
}

export class SecurityMiddleware {
  private securityService: SecurityLockoutService;
  private twoFactorService: TwoFactorAuthService;

  constructor() {
    this.securityService = SecurityLockoutService.getInstance();
    this.twoFactorService = TwoFactorAuthService.getInstance();
  }

  // ========================================
  // MIDDLEWARE PRINCIPAL DE SEGURANÇA
  // ========================================

  async securityCheck(req: SecurityRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const startTime = Date.now();
      const ipAddress = this.getClientIP(req);
      const deviceFingerprint = this.generateDeviceFingerprint(req);
      const userId = (req.user as any)?.id;

      // Inicializar contexto de segurança
      req.security = {
        lockoutStatus: null,
        rateLimitStatus: null,
        suspiciousActivities: [],
        deviceFingerprint,
        requiresTwoFactor: false
      };

      // 1. Verificar bloqueios ativos
      const lockoutStatus = await this.securityService.checkLockoutStatus(userId, ipAddress, deviceFingerprint);
      req.security.lockoutStatus = lockoutStatus;

      if (lockoutStatus.is_locked) {
        return res.status(423).json({
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: lockoutStatus.reason,
          locked_until: lockoutStatus.locked_until,
          lockout_type: lockoutStatus.lockout_type
        });
      }

      // 2. Verificar rate limiting
      const rateLimitStatus = await this.securityService.checkRateLimit(ipAddress, 'IP');
      req.security.rateLimitStatus = rateLimitStatus;

      if (rateLimitStatus.is_limited) {
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMITED',
          message: 'Muitas requisições. Tente novamente mais tarde.',
          reset_time: rateLimitStatus.reset_time,
          requests_remaining: rateLimitStatus.requests_remaining
        });
      }

      // 3. Registrar request para rate limiting
      await this.securityService.recordRequest(ipAddress, 'IP', {
        endpoint: req.originalUrl,
        method: req.method,
        user_id: userId
      });

      // 4. Detectar atividade suspeita
      const suspiciousActivities = await this.securityService.detectSuspiciousActivity(req, userId);
      req.security.suspiciousActivities = suspiciousActivities;

      // 5. Verificar necessidade de 2FA
      req.security.requiresTwoFactor = await this.checkTwoFactorRequirement(req, userId);

      // 6. Adicionar headers de segurança
      this.addSecurityHeaders(res);

      // 7. Continuar para próximo middleware
      const processingTime = Date.now() - startTime;
      console.log(`🔒 Verificação de segurança concluída em ${processingTime}ms para ${ipAddress}`);
      
      next();

    } catch (error) {
      console.error('❌ Erro no middleware de segurança:', error);
      
      // Em caso de erro, aplicar política restritiva
      return res.status(500).json({
        success: false,
        error: 'SECURITY_ERROR',
        message: 'Erro interno de segurança. Acesso temporariamente bloqueado.'
      });
    }
  }

  // ========================================
  // MIDDLEWARE DE 2FA
  // ========================================

  async requireTwoFactor(req: SecurityRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Acesso negado'
        });
      }

      // Verificar se usuário tem 2FA habilitado
      const userStatus = await this.twoFactorService.getTwoFactorStatus(userId);
      
      if (!userStatus.is_enabled) {
        return res.status(403).json({
          success: false,
          error: 'TWO_FACTOR_REQUIRED',
          message: 'Autenticação de dois fatores é obrigatória para esta ação',
          setup_required: true
        });
      }

      // Verificar se sessão tem 2FA validado
      if (!req.session?.twoFactorVerified) {
        return res.status(403).json({
          success: false,
          error: 'TWO_FACTOR_VERIFICATION_REQUIRED',
          message: 'Código de verificação de dois fatores necessário',
          setup_required: false
        });
      }

      next();

    } catch (error) {
      console.error('❌ Erro no middleware de 2FA:', error);
      return res.status(500).json({
        success: false,
        error: 'TWO_FACTOR_ERROR',
        message: 'Erro na verificação de dois fatores'
      });
    }
  }

  // ========================================
  // MIDDLEWARE DE ROLES/PERMISSÕES
  // ========================================

  requireRole(allowedRoles: string[]) {
    return async (req: SecurityRequest, res: Response, next: NextFunction): Promise<Response | void> => {
      try {
        const userRole = (req.user as any)?.role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'Permissões insuficientes para esta ação',
            required_roles: allowedRoles,
            user_role: userRole
          });
        }

        next();

      } catch (error) {
        console.error('❌ Erro na verificação de permissões:', error);
        return res.status(500).json({
          success: false,
          error: 'PERMISSION_ERROR',
          message: 'Erro na verificação de permissões'
        });
      }
    };
  }

  // ========================================
  // RATE LIMITERS CONFIGURÁVEIS
  // ========================================

  createRateLimit(options: {
    windowMs?: number;
    max?: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
  }) {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos padrão
      max: options.max || 100,
      message: {
        success: false,
        error: 'RATE_LIMITED',
        message: options.message || 'Muitas requisições, tente novamente mais tarde'
      },
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  createSlowDown(options: {
    windowMs?: number;
    delayAfter?: number;
    delayMs?: number;
    maxDelayMs?: number;
  }) {
    // Implementação básica de slow down sem biblioteca externa
    const delayAfter = options.delayAfter || 50;
    const delayMs = options.delayMs || 500;
    const maxDelayMs = options.maxDelayMs || 20000;
    
    return (req: Request, res: Response, next: NextFunction) => {
      // Lógica simplificada de delay baseada em requests
      const delay = Math.min(delayMs * Math.max(0, (req.ip?.split('.').length || 0) - delayAfter), maxDelayMs);
      
      if (delay > 0) {
        setTimeout(next, delay);
      } else {
        next();
      }
    };
  }

  // Rate limiter específico para login
  loginRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // 5 tentativas por IP
      message: {
        success: false,
        error: 'LOGIN_RATE_LIMITED',
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
      },
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Rate limiter para APIs críticas
  criticalApiRateLimit() {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10, // 10 requisições por IP
      message: {
        success: false,
        error: 'CRITICAL_API_RATE_LIMITED',
        message: 'Limite de API crítica excedido. Tente novamente em alguns minutos.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // ========================================
  // UTILITÁRIOS PRIVADOS
  // ========================================

  private async checkTwoFactorRequirement(req: SecurityRequest, userId?: number): Promise<boolean> {
    if (!userId) return false;

    try {
      // Verificar se rota requer 2FA
      const criticalEndpoints = [
        '/api/auth/change-password',
        '/api/financial/withdraw',
        '/api/admin/',
        '/api/settings/security'
      ];

      const requiresFor2FA = criticalEndpoints.some(endpoint => 
        req.originalUrl.startsWith(endpoint)
      );

      if (!requiresFor2FA) return false;

      // Verificar se usuário tem 2FA habilitado
      const userStatus = await this.twoFactorService.getTwoFactorStatus(userId);
      
      return userStatus.is_enabled && !req.session?.twoFactorVerified;

    } catch (error) {
      console.error('❌ Erro ao verificar necessidade de 2FA:', error);
      return true; // Política conservadora em caso de erro
    }
  }

  private addSecurityHeaders(res: Response): void {
    // Headers de segurança padrão
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CSP header
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self'; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "media-src 'self'; " +
      "frame-src 'none';"
    );
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

  private generateDeviceFingerprint(req: Request): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const ip = this.getClientIP(req);

    // Gerar fingerprint baseado nos headers
    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
    
    // Hash simples (em produção, usar crypto.createHash)
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  // ========================================
  // MIDDLEWARES PRÉ-CONFIGURADOS
  // ========================================

  // Middleware para rotas públicas (baixa segurança)
  public() {
    return [
      this.createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Muitas requisições na API pública'
      })
    ];
  }

  // Middleware para rotas autenticadas (segurança média)
  authenticated() {
    return [
      this.securityCheck.bind(this),
      this.createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Muitas requisições autenticadas'
      })
    ];
  }

  // Middleware para rotas críticas (alta segurança)
  critical() {
    return [
      this.securityCheck.bind(this),
      this.requireTwoFactor.bind(this),
      this.createRateLimit({
        windowMs: 5 * 60 * 1000,
        max: 10,
        message: 'Limite de API crítica excedido'
      }),
      this.createSlowDown({
        windowMs: 5 * 60 * 1000,
        delayAfter: 3,
        delayMs: 1000,
        maxDelayMs: 20000
      })
    ];
  }

  // Middleware para área administrativa (segurança máxima)
  admin() {
    return [
      this.securityCheck.bind(this),
      this.requireTwoFactor.bind(this),
      this.requireRole(['admin', 'super_admin']),
      this.createRateLimit({
        windowMs: 5 * 60 * 1000,
        max: 20,
        message: 'Limite administrativo excedido'
      })
    ];
  }
}

// Instância singleton para exportação
export const securityMiddleware = new SecurityMiddleware();

// Exportações diretas para conveniência
export const {
  securityCheck,
  requireTwoFactor,
  requireRole,
  createRateLimit,
  loginRateLimit,
  criticalApiRateLimit
} = securityMiddleware;

export default SecurityMiddleware;
