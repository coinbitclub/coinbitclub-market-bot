// ========================================
// MARKETBOT - AUTHENTICATION ROUTES
// Rotas para todas as operações de autenticação
// ========================================

import { Router } from 'express';
import { Pool } from 'pg';

import { createAuthController } from '../controllers/auth.controller';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { AuditAction } from '../types/auth.types';

export const createAuthRoutes = (database: Pool): Router => {
  const router = Router();
  const authController = createAuthController(database);
  const authMiddleware = createAuthMiddleware(database);

  // ========================================
  // ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
  // ========================================

  /**
   * @route POST /auth/register
   * @desc Registra um novo usuário
   * @access Public
   */
  router.post('/register', authController.register);

  /**
   * @route POST /auth/login
   * @desc Realiza login do usuário
   * @access Public
   */
  router.post('/login', authController.login);

  /**
   * @route POST /auth/refresh
   * @desc Atualiza o access token usando refresh token
   * @access Public
   */
  router.post('/refresh', authController.refreshToken);

  /**
   * @route POST /auth/verify-email
   * @desc Verifica o email do usuário
   * @access Public
   */
  router.post('/verify-email', authController.verifyEmail);

  /**
   * @route POST /auth/forgot-password
   * @desc Solicita recuperação de senha
   * @access Public
   */
  router.post('/forgot-password', authController.forgotPassword);

  /**
   * @route POST /auth/reset-password
   * @desc Redefine a senha usando token
   * @access Public
   */
  router.post('/reset-password', authController.resetPassword);

  /**
   * @route GET /auth/health
   * @desc Health check do serviço de autenticação
   * @access Public
   */
  router.get('/health', authController.healthCheck);

  // ========================================
  // ROTAS PROTEGIDAS (COM AUTENTICAÇÃO)
  // ========================================

  /**
   * @route POST /auth/logout
   * @desc Realiza logout do usuário
   * @access Private
   */
  router.post('/logout', authMiddleware.optionalAuth, authController.logout);

  /**
   * @route GET /auth/me
   * @desc Retorna informações do usuário atual
   * @access Private
   */
  router.get('/me', authMiddleware.authenticate, authController.me);

  /**
   * @route POST /auth/change-password
   * @desc Altera a senha do usuário
   * @access Private
   */
  router.post('/change-password', authMiddleware.authenticate, authController.changePassword);

  // ========================================
  // ROTAS DE AUTENTICAÇÃO DE DOIS FATORES
  // ========================================

  /**
   * @route POST /auth/2fa/enable
   * @desc Habilita autenticação de dois fatores
   * @access Private
   */
  router.post('/2fa/enable', authMiddleware.authenticate, authController.enable2FA);

  /**
   * @route POST /auth/2fa/verify
   * @desc Verifica e confirma 2FA
   * @access Private
   */
  router.post('/2fa/verify', authMiddleware.authenticate, authController.verify2FA);

  /**
   * @route POST /auth/2fa/disable
   * @desc Desabilita autenticação de dois fatores
   * @access Private
   */
  router.post('/2fa/disable', authMiddleware.authenticate, authController.disable2FA);

  return router;
};

// ========================================
// ROTAS DE USUÁRIOS (CRUD)
// ========================================

export const createUserRoutes = (database: Pool): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(database);

  // TODO: Implementar UserController para operações CRUD
  // const userController = createUserController(database);

  // ========================================
  // ROTAS DE PERFIL DO USUÁRIO
  // ========================================

  /**
   * @route GET /users/profile
   * @desc Busca perfil completo do usuário
   * @access Private
   */
  router.get('/profile', 
    authMiddleware.authenticate,
    authMiddleware.requireEmailVerified,
    async (req, res) => {
      // TODO: Implementar busca de perfil
      res.json({ message: 'Profile endpoint - TODO: Implement' });
    }
  );

  /**
   * @route PUT /users/profile
   * @desc Atualiza perfil do usuário
   * @access Private
   */
  router.put('/profile',
    authMiddleware.authenticate,
    authMiddleware.requireEmailVerified,
    async (req, res) => {
      // TODO: Implementar atualização de perfil
      res.json({ message: 'Update profile endpoint - TODO: Implement' });
    }
  );

  /**
   * @route PUT /users/settings
   * @desc Atualiza configurações de trading do usuário
   * @access Private
   */
  router.put('/settings',
    authMiddleware.authenticate,
    authMiddleware.requireEmailVerified,
    async (req, res) => {
      // TODO: Implementar atualização de configurações
      res.json({ message: 'Update settings endpoint - TODO: Implement' });
    }
  );

  // ========================================
  // ROTAS DE DADOS BANCÁRIOS
  // ========================================

  /**
   * @route PUT /users/banking
   * @desc Atualiza dados bancários do usuário
   * @access Private
   */
  router.put('/banking',
    authMiddleware.authenticate,
    authMiddleware.requireEmailVerified,
    authMiddleware.requirePhoneVerified,
    async (req, res) => {
      // TODO: Implementar atualização de dados bancários
      res.json({ message: 'Update banking endpoint - TODO: Implement' });
    }
  );

  // ========================================
  // ROTAS ADMINISTRATIVAS
  // ========================================

  /**
   * @route GET /users
   * @desc Lista todos os usuários (Admin)
   * @access Admin
   */
  router.get('/',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    async (req, res) => {
      // TODO: Implementar listagem de usuários
      res.json({ message: 'List users endpoint - TODO: Implement' });
    }
  );

  /**
   * @route GET /users/:userId
   * @desc Busca usuário por ID (Admin/Gestor/Próprio)
   * @access Private
   */
  router.get('/:userId',
    authMiddleware.authenticate,
    authMiddleware.requireResourceOwnership('userId'),
    async (req, res) => {
      // TODO: Implementar busca de usuário
      res.json({ message: 'Get user endpoint - TODO: Implement' });
    }
  );

  /**
   * @route PUT /users/:userId/status
   * @desc Atualiza status do usuário (Admin)
   * @access Admin
   */
  router.put('/:userId/status',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    async (req, res) => {
      // TODO: Implementar atualização de status
      res.json({ message: 'Update user status endpoint - TODO: Implement' });
    }
  );

  /**
   * @route PUT /users/:userId/type
   * @desc Atualiza tipo do usuário (Admin)
   * @access Admin
   */
  router.put('/:userId/type',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    async (req, res) => {
      // TODO: Implementar atualização de tipo
      res.json({ message: 'Update user type endpoint - TODO: Implement' });
    }
  );

  /**
   * @route PUT /users/:userId/balance
   * @desc Atualiza saldo do usuário (Admin)
   * @access Admin
   */
  router.put('/:userId/balance',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    async (req, res) => {
      // TODO: Implementar atualização de saldo
      res.json({ message: 'Update user balance endpoint - TODO: Implement' });
    }
  );

  return router;
};

// ========================================
// ROTAS DE AFILIADOS
// ========================================

export const createAffiliateRoutes = (database: Pool): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(database);

  // TODO: Implementar AffiliateController
  // const affiliateController = createAffiliateController(database);

  /**
   * @route GET /affiliates/dashboard
   * @desc Dashboard do afiliado
   * @access Affiliate
   */
  router.get('/dashboard',
    authMiddleware.authenticate,
    authMiddleware.requireAffiliate,
    async (req, res) => {
      // TODO: Implementar dashboard de afiliado
      res.json({ message: 'Affiliate dashboard endpoint - TODO: Implement' });
    }
  );

  /**
   * @route GET /affiliates/referrals
   * @desc Lista referenciados do afiliado
   * @access Affiliate
   */
  router.get('/referrals',
    authMiddleware.authenticate,
    authMiddleware.requireAffiliate,
    async (req, res) => {
      // TODO: Implementar listagem de referenciados
      res.json({ message: 'Affiliate referrals endpoint - TODO: Implement' });
    }
  );

  /**
   * @route GET /affiliates/commissions
   * @desc Histórico de comissões do afiliado
   * @access Affiliate
   */
  router.get('/commissions',
    authMiddleware.authenticate,
    authMiddleware.requireAffiliate,
    async (req, res) => {
      // TODO: Implementar histórico de comissões
      res.json({ message: 'Affiliate commissions endpoint - TODO: Implement' });
    }
  );

  /**
   * @route POST /affiliates/convert-commission
   * @desc Converte comissão em crédito administrativo (+10% bônus)
   * @access Affiliate
   */
  router.post('/convert-commission',
    authMiddleware.authenticate,
    authMiddleware.requireAffiliate,
    async (req, res) => {
      // TODO: Implementar conversão de comissão
      res.json({ message: 'Convert commission endpoint - TODO: Implement' });
    }
  );

  /**
   * @route GET /affiliates/materials
   * @desc Materiais de marketing para afiliados
   * @access Affiliate
   */
  router.get('/materials',
    authMiddleware.authenticate,
    authMiddleware.requireAffiliate,
    async (req, res) => {
      // TODO: Implementar materiais de marketing
      res.json({ message: 'Affiliate materials endpoint - TODO: Implement' });
    }
  );

  // ========================================
  // ROTAS ADMINISTRATIVAS DE AFILIADOS
  // ========================================

  /**
   * @route GET /affiliates
   * @desc Lista todos os afiliados (Admin)
   * @access Admin
   */
  router.get('/',
    authMiddleware.authenticate,
    authMiddleware.requireGestor,
    async (req, res) => {
      // TODO: Implementar listagem de afiliados
      res.json({ message: 'List affiliates endpoint - TODO: Implement' });
    }
  );

  /**
   * @route POST /affiliates/:userId/promote
   * @desc Promove usuário para afiliado VIP (Admin)
   * @access Admin
   */
  router.post('/:userId/promote',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    async (req, res) => {
      // TODO: Implementar promoção para VIP
      res.json({ message: 'Promote affiliate endpoint - TODO: Implement' });
    }
  );

  return router;
};

// ========================================
// ROTAS DE AUDITORIA
// ========================================

export const createAuditRoutes = (database: Pool): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(database);

  /**
   * @route GET /audit/logs
   * @desc Lista logs de auditoria (Admin/Gestor)
   * @access Admin/Gestor
   */
  router.get('/logs',
    authMiddleware.authenticate,
    authMiddleware.requireGestor,
    async (req, res) => {
      // TODO: Implementar listagem de logs
      res.json({ message: 'Audit logs endpoint - TODO: Implement' });
    }
  );

  /**
   * @route GET /audit/user/:userId
   * @desc Logs de auditoria de um usuário específico
   * @access Admin/Gestor/Próprio
   */
  router.get('/user/:userId',
    authMiddleware.authenticate,
    authMiddleware.requireResourceOwnership('userId'),
    async (req, res) => {
      // TODO: Implementar logs por usuário
      res.json({ message: 'User audit logs endpoint - TODO: Implement' });
    }
  );

  /**
   * @route GET /audit/sessions
   * @desc Lista sessões ativas (Admin/Gestor)
   * @access Admin/Gestor
   */
  router.get('/sessions',
    authMiddleware.authenticate,
    authMiddleware.requireGestor,
    async (req, res) => {
      // TODO: Implementar listagem de sessões
      res.json({ message: 'Active sessions endpoint - TODO: Implement' });
    }
  );

  /**
   * @route DELETE /audit/sessions/:sessionId
   * @desc Revoga sessão específica (Admin)
   * @access Admin
   */
  router.delete('/sessions/:sessionId',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    async (req, res) => {
      // TODO: Implementar revogação de sessão
      res.json({ message: 'Revoke session endpoint - TODO: Implement' });
    }
  );

  return router;
};
