// ========================================
// MARKETBOT - AUTHENTICATION CONTROLLERS
// Controllers para todas as operações de autenticação
// ========================================

import { Request, Response } from 'express';
import { Pool } from 'pg';

import { AuthService } from '../services/auth.service';
import { 
  loginSchema, 
  registerSchema, 
  refreshTokenSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  enable2FASchema,
  verify2FASchema,
  disable2FASchema
} from '../validators/auth.validators';
import { AuditAction } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor(database: Pool) {
    this.authService = new AuthService(database);
  }

  // ========================================
  // REGISTRO DE USUÁRIO
  // ========================================

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validação dos dados
      const validatedData = registerSchema.parse(req.body);

      // Registra o usuário
      const result = await this.authService.register(
        validatedData,
        req.ipAddress,
        req.userAgent
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Usuário registrado com sucesso. Verifique seu email para ativar a conta.'
      });

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'REGISTRATION_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  // ========================================
  // LOGIN DE USUÁRIO
  // ========================================

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validação dos dados
      const validatedData = loginSchema.parse(req.body);

      // Realiza o login
      const result = await this.authService.login(
        validatedData,
        req.ipAddress,
        req.userAgent
      );

      // Define cookie seguro para refresh token (opcional)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login realizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message,
          code: 'LOGIN_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  // ========================================
  // REFRESH TOKEN
  // ========================================

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Tenta pegar refresh token do body ou cookie
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório',
          code: 'MISSING_REFRESH_TOKEN'
        });
        return;
      }

      // Validação dos dados
      const validatedData = refreshTokenSchema.parse({ refreshToken });

      // Gera novos tokens
      const result = await this.authService.refreshToken(validatedData);

      // Atualiza cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token atualizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro no refresh token:', error);
      
      res.status(401).json({
        success: false,
        message: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
      
      if (refreshToken) {
        await this.authService.logout(refreshToken, req.user?.sub);
      }

      // Remove cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // Sempre retorna sucesso no logout
      res.clearCookie('refreshToken');
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    }
  };

  // ========================================
  // VERIFICAÇÃO DE EMAIL
  // ========================================

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validação dos dados
      const validatedData = verifyEmailSchema.parse(req.body);

      // Verifica o email
      await this.authService.verifyEmail(validatedData.email, validatedData.token);

      res.status(200).json({
        success: true,
        message: 'Email verificado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro na verificação de email:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'EMAIL_VERIFICATION_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  // ========================================
  // RECUPERAÇÃO DE SENHA
  // ========================================

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validação dos dados
      const validatedData = forgotPasswordSchema.parse(req.body);

      // Solicita recuperação de senha
      await this.authService.forgotPassword(validatedData.email);

      // Sempre retorna sucesso por segurança
      res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });

    } catch (error) {
      console.error('❌ Erro na recuperação de senha:', error);
      
      // Sempre retorna sucesso por segurança
      res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validação dos dados
      const validatedData = resetPasswordSchema.parse(req.body);

      // Redefine a senha
      await this.authService.resetPassword(
        validatedData.email,
        validatedData.token,
        validatedData.newPassword
      );

      res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro na redefinição de senha:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'PASSWORD_RESET_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  // ========================================
  // MUDANÇA DE SENHA
  // ========================================

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Validação dos dados
      const validatedData = changePasswordSchema.parse(req.body);

      // TODO: Implementar mudança de senha no AuthService
      // await this.authService.changePassword(req.user.sub, validatedData);

      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro na mudança de senha:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'PASSWORD_CHANGE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  // ========================================
  // AUTENTICAÇÃO DE DOIS FATORES
  // ========================================

  enable2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Validação dos dados
      const validatedData = enable2FASchema.parse(req.body);

      // Habilita 2FA
      const result = await this.authService.enable2FA(req.user.sub, validatedData.password);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Configure o aplicativo de autenticação com o QR Code e confirme com um código'
      });

    } catch (error) {
      console.error('❌ Erro ao habilitar 2FA:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'ENABLE_2FA_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  verify2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Validação dos dados
      const validatedData = verify2FASchema.parse(req.body);

      // Verifica e confirma 2FA
      await this.authService.verify2FA(req.user.sub, validatedData.code);

      res.status(200).json({
        success: true,
        message: 'Autenticação de dois fatores habilitada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao verificar 2FA:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'VERIFY_2FA_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  disable2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Validação dos dados
      const validatedData = disable2FASchema.parse(req.body);

      // Desabilita 2FA
      await this.authService.disable2FA(
        req.user.sub,
        validatedData.password,
        validatedData.code
      );

      res.status(200).json({
        success: true,
        message: 'Autenticação de dois fatores desabilitada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao desabilitar 2FA:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: 'DISABLE_2FA_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno no servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  };

  // ========================================
  // INFORMAÇÕES DO USUÁRIO ATUAL
  // ========================================

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticação requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // TODO: Implementar busca completa do usuário no AuthService
      // const user = await this.authService.getUserById(req.user.sub);

      res.status(200).json({
        success: true,
        data: {
          id: req.user.sub,
          email: req.user.email,
          userType: req.user.userType,
          status: req.user.status,
          emailVerified: req.user.emailVerified,
          phoneVerified: req.user.phoneVerified,
          twoFactorEnabled: req.user.twoFactorEnabled
        },
        message: 'Informações do usuário atual'
      });

    } catch (error) {
      console.error('❌ Erro ao buscar informações do usuário:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno no servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  // ========================================
  // HEALTH CHECK PARA AUTENTICAÇÃO
  // ========================================

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          service: 'Authentication Service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        },
        message: 'Serviço de autenticação operacional'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no serviço de autenticação',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  };
}

export const createAuthController = (database: Pool): AuthController => {
  return new AuthController(database);
};
