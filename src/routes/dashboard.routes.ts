// ========================================
// MARKETBOT - DASHBOARD ROUTES
// Rotas para dashboard e monitoramento real-time
// ========================================

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DashboardService } from '../services/dashboard.service';
import { WebSocketService } from '../services/websocket.service';
import { DatabaseService } from '../services/database.service';

const router = Router();
const dashboardService = DashboardService.getInstance();
const webSocketService = WebSocketService.getInstance();

// ========================================
// ESTENDER O REQUEST PARA INCLUIR USER
// ========================================

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        userType: string;
      };
    }
  }
}

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verificar se usuário ainda existe e está ativo
    const db = DatabaseService.getInstance().getPool();
    const userResult = await db.query(
      'SELECT id, email, user_type FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
      return;
    }

    const user = userResult.rows[0];
    req.authUser = {
      id: user.id,
      email: user.email,
      userType: user.user_type
    };

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.authUser?.userType !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores'
    });
    return;
  }
  next();
};

// ========================================
// APLICAR MIDDLEWARES
// ========================================

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// ========================================
// MÉTRICAS PRINCIPAIS
// ========================================

/**
 * GET /api/dashboard/metrics
 * Retorna métricas principais do sistema
 * Acesso: ADMIN apenas
 */
router.get('/metrics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Métricas obtidas com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// ========================================
// USUÁRIOS ATIVOS
// ========================================

/**
 * GET /api/dashboard/active-users
 * Retorna lista de usuários ativos
 * Acesso: ADMIN apenas
 */
router.get('/active-users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activeUsers = await dashboardService.getActiveUsers(limit);
    
    res.json({
      success: true,
      data: activeUsers,
      total: activeUsers.length,
      message: 'Usuários ativos obtidos com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuários ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ATIVIDADES RECENTES
// ========================================

/**
 * GET /api/dashboard/recent-activities
 * Retorna atividades recentes do sistema
 * Acesso: ADMIN apenas
 */
router.get('/recent-activities', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const activities = await dashboardService.getRecentActivities(limit);
    
    res.json({
      success: true,
      data: activities,
      total: activities.length,
      message: 'Atividades recentes obtidas com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar atividades recentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ALERTAS DO SISTEMA
// ========================================

/**
 * GET /api/dashboard/alerts
 * Retorna alertas ativos do sistema
 * Acesso: ADMIN apenas
 */
router.get('/alerts', requireAdmin, async (req: Request, res: Response) => {
  try {
    const alerts = await dashboardService.getSystemAlerts();
    
    res.json({
      success: true,
      data: alerts,
      total: alerts.length,
      message: 'Alertas obtidos com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/dashboard/alerts
 * Cria um novo alerta no sistema
 * Acesso: ADMIN apenas
 */
router.post('/alerts', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, title, message, component } = req.body;

    // Validação dos dados
    if (!type || !title || !message || !component) {
      res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios: type, title, message, component'
      });
      return;
    }

    if (!['INFO', 'WARNING', 'ERROR', 'CRITICAL'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Tipo deve ser: INFO, WARNING, ERROR ou CRITICAL'
      });
      return;
    }

    await dashboardService.createAlert(type, title, message, component);
    
    res.status(201).json({
      success: true,
      message: 'Alerta criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/dashboard/alerts/:alertId/resolve
 * Resolve um alerta específico
 * Acesso: ADMIN apenas
 */
router.put('/alerts/:alertId/resolve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    await dashboardService.resolveAlert(alertId);
    
    res.json({
      success: true,
      message: 'Alerta resolvido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao resolver alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// STATUS DAS CONEXÕES WEBSOCKET
// ========================================

/**
 * GET /api/dashboard/websocket-status
 * Retorna status das conexões WebSocket
 * Acesso: ADMIN apenas
 */
router.get('/websocket-status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const connectionStats = webSocketService.getConnectionStats();
    const connectedUsers = webSocketService.getConnectedUsers();
    
    res.json({
      success: true,
      data: {
        stats: connectionStats,
        connected_users: connectedUsers
      },
      message: 'Status WebSocket obtido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar status WebSocket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// DADOS PARA AFILIADOS
// ========================================

/**
 * GET /api/dashboard/affiliate-data
 * Retorna dados específicos do afiliado logado
 * Acesso: AFFILIATE e ADMIN
 */
router.get('/affiliate-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuário não identificado'
      });
      return;
    }

    // Buscar dados específicos do afiliado
    const db = DatabaseService.getInstance().getPool();
    const result = await db.query(`
      SELECT 
        u.account_balance_usd,
        u.commission_balance_brl,
        u.last_login_at,
        COUNT(tp.id) as active_positions,
        COALESCE(SUM(tp.pnl_usd), 0) as total_pnl,
        (
          SELECT COUNT(*) 
          FROM commission_transactions ct 
          WHERE ct.user_id = u.id 
          AND ct.created_at >= CURRENT_DATE
        ) as commissions_today
      FROM users u
      LEFT JOIN trading_positions tp ON u.id = tp.user_id AND tp.status = 'OPEN'
      WHERE u.id = $1
      GROUP BY u.id, u.account_balance_usd, u.commission_balance_brl, u.last_login_at
    `, [userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Dados do usuário não encontrados'
      });
      return;
    }

    const userData = result.rows[0];
    
    res.json({
      success: true,
      data: {
        account_balance_usd: parseFloat(userData.account_balance_usd || '0'),
        commission_balance_brl: parseFloat(userData.commission_balance_brl || '0'),
        active_positions: parseInt(userData.active_positions || '0'),
        total_pnl: parseFloat(userData.total_pnl || '0'),
        commissions_today: parseInt(userData.commissions_today || '0'),
        last_login_at: userData.last_login_at
      },
      message: 'Dados do afiliado obtidos com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do afiliado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// DASHBOARD COMPLETO (ADMIN)
// ========================================

/**
 * GET /api/dashboard/complete
 * Retorna todos os dados do dashboard em uma única requisição
 * Acesso: ADMIN apenas
 */
router.get('/complete', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Buscar todos os dados em paralelo
    const [metrics, activeUsers, activities, alerts, wsStatus] = await Promise.all([
      dashboardService.getDashboardMetrics(),
      dashboardService.getActiveUsers(50),
      dashboardService.getRecentActivities(100),
      dashboardService.getSystemAlerts(),
      Promise.resolve(webSocketService.getConnectionStats())
    ]);
    
    res.json({
      success: true,
      data: {
        metrics,
        active_users: activeUsers,
        recent_activities: activities,
        alerts,
        websocket_status: wsStatus,
        last_updated: new Date()
      },
      message: 'Dashboard completo obtido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dashboard completo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
