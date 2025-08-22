// ========================================
// MARKETBOT - AUTHENTICATION MIDDLEWARE
// Sistema de middleware para autenticação e autorização
// ========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

import { env } from '../config/env';
import { 
  JWTPayload, 
  UserType, 
  UserStatus,
  AuditAction 
} from '../types/auth.types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      ipAddress?: string;
      userAgent?: string;
    }
  }
}

export class AuthMiddleware {
  private db: Pool;
  private JWT_SECRET: string;

  constructor(database: Pool) {
    this.db = database;
    this.JWT_SECRET = env.JWT_SECRET;
  }

  // ========================================
  // MIDDLEWARE PRINCIPAL DE AUTENTICAÇÃO
  // ========================================

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extrai token do header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Token de acesso é obrigatório',
          code: 'MISSING_TOKEN'
        });
        return;
      }

      const token = authHeader.substring(7);

      // Verifica e decodifica o token
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      // Verifica se o token não foi revogado
      const isTokenRevoked = await this.isTokenRevoked(payload.jti);
      if (isTokenRevoked) {
        res.status(401).json({
          success: false,
          message: 'Token foi revogado',
          code: 'TOKEN_REVOKED'
        });
        return;
      }

      // Verifica status do usuário
      const user = await this.getUserById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        res.status(401).json({
          success: false,
          message: 'Usuário inválido ou inativo',
          code: 'USER_INACTIVE'
        });
        return;
      }

      // Adiciona informações do usuário à requisição
      req.user = payload;
      req.ipAddress = this.getClientIp(req);
      req.userAgent = req.headers['user-agent'] || 'unknown';

      next();

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      console.error('❌ Erro na autenticação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno no servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  // ========================================
  // MIDDLEWARE DE AUTORIZAÇÃO POR TIPO
  // ========================================

  requireUserType = (allowedTypes: UserType[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      if (!allowedTypes.includes(req.user.userType)) {
        this.logUnauthorizedAccess(req);
        res.status(403).json({
          success: false,
          message: 'Acesso negado. Permissões insuficientes.',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    };
  };

  // ========================================
  // MIDDLEWARE ESPECÍFICOS POR ROLE
  // ========================================

  requireAdmin = this.requireUserType([UserType.ADMIN]);

  requireGestor = this.requireUserType([UserType.ADMIN, UserType.GESTOR]);

  requireOperator = this.requireUserType([
    UserType.ADMIN, 
    UserType.GESTOR, 
    UserType.OPERADOR
  ]);

  requireAffiliate = this.requireUserType([
    UserType.ADMIN,
    UserType.GESTOR,
    UserType.AFFILIATE_VIP,
    UserType.AFFILIATE
  ]);

  requireVipAffiliate = this.requireUserType([
    UserType.ADMIN,
    UserType.GESTOR,
    UserType.AFFILIATE_VIP
  ]);

  // ========================================
  // MIDDLEWARE DE VERIFICAÇÃO
  // ========================================

  requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticação requerida',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    if (!req.user.emailVerified) {
      res.status(403).json({
        success: false,
        message: 'Verificação de email é obrigatória',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    next();
  };

  requirePhoneVerified = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticação requerida',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    if (!req.user.phoneVerified) {
      res.status(403).json({
        success: false,
        message: 'Verificação de telefone é obrigatória',
        code: 'PHONE_NOT_VERIFIED'
      });
      return;
    }

    next();
  };

  require2FA = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticação requerida',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    if (!req.user.twoFactorEnabled) {
      res.status(403).json({
        success: false,
        message: 'Autenticação de dois fatores é obrigatória',
        code: 'TWO_FACTOR_REQUIRED'
      });
      return;
    }

    next();
  };

  // ========================================
  // MIDDLEWARE DE VALIDAÇÃO DE RECURSOS
  // ========================================

  requireResourceOwnership = (resourceUserIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Admins e gestores podem acessar qualquer recurso
      if ([UserType.ADMIN, UserType.GESTOR].includes(req.user.userType)) {
        next();
        return;
      }

      const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
      
      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      if (req.user.sub !== resourceUserId) {
        this.logUnauthorizedAccess(req);
        res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode acessar seus próprios recursos.',
          code: 'RESOURCE_OWNERSHIP_REQUIRED'
        });
        return;
      }

      next();
    };
  };

  // ========================================
  // MIDDLEWARE OPCIONAL DE AUTENTICAÇÃO
  // ========================================

  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Sem token, continua sem autenticação
        req.ipAddress = this.getClientIp(req);
        req.userAgent = req.headers['user-agent'] || 'unknown';
        next();
        return;
      }

      const token = authHeader.substring(7);
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      // Verifica se o token foi revogado
      const isTokenRevoked = await this.isTokenRevoked(payload.jti);
      if (!isTokenRevoked) {
        req.user = payload;
      }

      req.ipAddress = this.getClientIp(req);
      req.userAgent = req.headers['user-agent'] || 'unknown';
      next();

    } catch (error) {
      // Ignora erros de token e continua sem autenticação
      req.ipAddress = this.getClientIp(req);
      req.userAgent = req.headers['user-agent'] || 'unknown';
      next();
    }
  };

  // ========================================
  // MIDDLEWARE DE RATE LIMITING POR USUÁRIO
  // ========================================

  userRateLimit = (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const userId = req.user?.sub || req.ipAddress || 'anonymous';
      const now = Date.now();
      const userKey = `${userId}:${req.route?.path || req.path}`;

      const userRequests = requests.get(userKey);

      if (!userRequests || now > userRequests.resetTime) {
        // Reset ou primeira requisição
        requests.set(userKey, {
          count: 1,
          resetTime: now + windowMs
        });
        next();
        return;
      }

      if (userRequests.count >= maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Limite de requisições excedido',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        });
        return;
      }

      userRequests.count++;
      next();
    };
  };

  // ========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ========================================

  private async isTokenRevoked(jti: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM user_sessions 
        WHERE access_token_jti = $1 AND is_revoked = FALSE 
        AND expires_at > CURRENT_TIMESTAMP
      `;
      const result = await this.db.query(query, [jti]);
      return result.rows.length === 0;
    } catch (error) {
      console.error('❌ Erro ao verificar token revogado:', error);
      return true; // Em caso de erro, considera revogado por segurança
    }
  }

  private async getUserById(userId: string): Promise<{ status: UserStatus } | null> {
    try {
      const query = 'SELECT status FROM users WHERE id = $1';
      const result = await this.db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      return null;
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private async logUnauthorizedAccess(req: Request): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_logs (user_id, action, description, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const values = [
        req.user?.sub || null,
        AuditAction.FAILED_LOGIN,
        'Tentativa de acesso não autorizado',
        JSON.stringify({
          path: req.path,
          method: req.method,
          userType: req.user?.userType,
          requiredPermission: 'access_denied'
        }),
        req.ipAddress,
        req.userAgent
      ];

      await this.db.query(query, values);
    } catch (error) {
      console.error('❌ Erro ao registrar acesso não autorizado:', error);
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

export const createAuthMiddleware = (database: Pool): AuthMiddleware => {
  return new AuthMiddleware(database);
};

// Middleware para extrair IP e User-Agent
export const clientInfoMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.ipAddress = (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
  req.userAgent = req.headers['user-agent'] || 'unknown';
  next();
};

// Middleware para logging de requisições autenticadas
export const auditMiddleware = (action: AuditAction, description?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Executa a requisição primeiro
    next();

    // Log após a execução (não bloqueia a resposta)
    if (req.user) {
      try {
        // Assumindo que temos acesso ao pool do banco
        // Este será injetado quando configurarmos o middleware no app
        const query = `
          INSERT INTO audit_logs (user_id, action, description, metadata, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const values = [
          req.user.sub,
          action,
          description || `${req.method} ${req.path}`,
          JSON.stringify({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.userAgent
          }),
          req.ipAddress,
          req.userAgent
        ];

        // TODO: Implementar queue para logs assíncronos
        console.log('📋 Audit log:', { action, user: req.user.email, path: req.path });
      } catch (error) {
        console.error('❌ Erro no audit middleware:', error);
      }
    }
  };
};
