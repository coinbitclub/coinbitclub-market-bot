// ========================================
// MARKETBOT - WEBSOCKET SERVICE
// Sistema WebSocket para atualizações real-time
// ========================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { DashboardService, DashboardMetrics, SystemAlert } from './dashboard.service';
import { DatabaseService } from './database.service';

export interface SocketUser {
  id: string;
  email: string;
  user_type: 'AFFILIATE' | 'ADMIN';
  socket_id: string;
  connected_at: Date;
}

export interface RealTimeUpdate {
  type: 'METRICS' | 'ALERT' | 'ACTIVITY' | 'POSITION' | 'USER_STATUS';
  data: any;
  timestamp: Date;
  target?: 'ALL' | 'ADMINS' | 'AFFILIATES' | string; // string para user_id específico
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private dashboardService: DashboardService;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.dashboardService = DashboardService.getInstance();
    this.setupDashboardListeners();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // ========================================
  // INICIALIZAÇÃO DO SERVIDOR
  // ========================================

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startMetricsBroadcast();

    console.log('🚀 WebSocket Service inicializado');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Middleware de autenticação
    this.io.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token de autenticação obrigatório'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Buscar dados do usuário no banco
        const db = DatabaseService.getInstance().getPool();
        const userResult = await db.query(
          'SELECT id, email, user_type FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return next(new Error('Usuário não encontrado ou inativo'));
        }

        const user = userResult.rows[0];
        socket.data.user = {
          id: user.id,
          email: user.email,
          user_type: user.user_type
        };

        next();
      } catch (error) {
        console.error('❌ Erro na autenticação WebSocket:', error);
        next(new Error('Token inválido'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      
      // Registrar usuário conectado
      const socketUser: SocketUser = {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        socket_id: socket.id,
        connected_at: new Date()
      };

      this.connectedUsers.set(socket.id, socketUser);
      
      console.log(`👤 Usuário conectado: ${user.email} (${user.user_type})`);

      // Enviar dados iniciais
      this.sendInitialData(socket, user);

      // ========================================
      // EVENT HANDLERS
      // ========================================

      // Solicitar métricas atualizadas
      socket.on('request_metrics', async () => {
        if (user.user_type === 'ADMIN') {
          try {
            const metrics = await this.dashboardService.getDashboardMetrics();
            socket.emit('metrics_update', {
              type: 'METRICS',
              data: metrics,
              timestamp: new Date()
            });
          } catch (error) {
            socket.emit('error', { message: 'Erro ao buscar métricas' });
          }
        }
      });

      // Solicitar usuários ativos
      socket.on('request_active_users', async () => {
        if (user.user_type === 'ADMIN') {
          try {
            const activeUsers = await this.dashboardService.getActiveUsers();
            socket.emit('active_users_update', {
              type: 'USER_STATUS',
              data: activeUsers,
              timestamp: new Date()
            });
          } catch (error) {
            socket.emit('error', { message: 'Erro ao buscar usuários ativos' });
          }
        }
      });

      // Solicitar atividades recentes
      socket.on('request_recent_activities', async () => {
        if (user.user_type === 'ADMIN') {
          try {
            const activities = await this.dashboardService.getRecentActivities();
            socket.emit('recent_activities_update', {
              type: 'ACTIVITY',
              data: activities,
              timestamp: new Date()
            });
          } catch (error) {
            socket.emit('error', { message: 'Erro ao buscar atividades' });
          }
        }
      });

      // Resolver alerta
      socket.on('resolve_alert', async (alertId: string) => {
        if (user.user_type === 'ADMIN') {
          try {
            await this.dashboardService.resolveAlert(alertId);
            // O evento será propagado automaticamente via dashboard service listener
          } catch (error) {
            socket.emit('error', { message: 'Erro ao resolver alerta' });
          }
        }
      });

      // Ping/Pong para manter conexão viva
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // ========================================
      // DESCONEXÃO
      // ========================================

      socket.on('disconnect', (reason: string) => {
        this.connectedUsers.delete(socket.id);
        console.log(`👤 Usuário desconectado: ${user.email} (${reason})`);
      });

      socket.on('error', (error: Error) => {
        console.error(`❌ Erro no socket ${user.email}:`, error);
      });
    });
  }

  // ========================================
  // ENVIO DE DADOS INICIAIS
  // ========================================

  private async sendInitialData(socket: Socket, user: any): Promise<void> {
    try {
      if (user.user_type === 'ADMIN') {
        // Enviar dados completos do dashboard para admins
        const [metrics, activeUsers, activities, alerts] = await Promise.all([
          this.dashboardService.getDashboardMetrics(),
          this.dashboardService.getActiveUsers(),
          this.dashboardService.getRecentActivities(),
          this.dashboardService.getSystemAlerts()
        ]);

        socket.emit('initial_data', {
          metrics,
          activeUsers,
          activities,
          alerts,
          timestamp: new Date()
        });

      } else if (user.user_type === 'AFFILIATE') {
        // Enviar dados limitados para afiliados
        const db = DatabaseService.getInstance().getPool();
        
        // Buscar dados específicos do afiliado
        const affiliateData = await db.query(`
          SELECT 
            account_balance_usd,
            commission_balance_brl,
            (SELECT COUNT(*) FROM trading_positions WHERE user_id = $1 AND status = 'OPEN') as active_positions
          FROM users 
          WHERE id = $1
        `, [user.id]);

        socket.emit('initial_data', {
          affiliate_data: affiliateData.rows[0],
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('❌ Erro ao enviar dados iniciais:', error);
      socket.emit('error', { message: 'Erro ao carregar dados iniciais' });
    }
  }

  // ========================================
  // BROADCAST DE ATUALIZAÇÕES
  // ========================================

  broadcast(update: RealTimeUpdate): void {
    if (!this.io) return;

    const { type, data, timestamp, target = 'ALL' } = update;

    if (target === 'ALL') {
      this.io.emit(`${type.toLowerCase()}_update`, { type, data, timestamp });
    } else if (target === 'ADMINS') {
      this.broadcastToAdmins({ type, data, timestamp });
    } else if (target === 'AFFILIATES') {
      this.broadcastToAffiliates({ type, data, timestamp });
    } else {
      // Broadcast para usuário específico
      this.broadcastToUser(target, { type, data, timestamp });
    }
  }

  private broadcastToAdmins(update: any): void {
    this.connectedUsers.forEach((user, socketId) => {
      if (user.user_type === 'ADMIN') {
        this.io?.to(socketId).emit(`${update.type.toLowerCase()}_update`, update);
      }
    });
  }

  private broadcastToAffiliates(update: any): void {
    this.connectedUsers.forEach((user, socketId) => {
      if (user.user_type === 'AFFILIATE') {
        this.io?.to(socketId).emit(`${update.type.toLowerCase()}_update`, update);
      }
    });
  }

  private broadcastToUser(userId: string, update: any): void {
    this.connectedUsers.forEach((user, socketId) => {
      if (user.id === userId) {
        this.io?.to(socketId).emit(`${update.type.toLowerCase()}_update`, update);
      }
    });
  }

  // ========================================
  // LISTENERS DO DASHBOARD SERVICE
  // ========================================

  private setupDashboardListeners(): void {
    // Escutar atualizações de métricas
    this.dashboardService.on('metrics_updated', (metrics: DashboardMetrics) => {
      this.broadcast({
        type: 'METRICS',
        data: metrics,
        timestamp: new Date(),
        target: 'ADMINS'
      });
    });

    // Escutar novos alertas
    this.dashboardService.on('alert_created', (alert: SystemAlert) => {
      this.broadcast({
        type: 'ALERT',
        data: { alert, action: 'created' },
        timestamp: new Date(),
        target: 'ADMINS'
      });
    });

    // Escutar alertas resolvidos
    this.dashboardService.on('alert_resolved', (alert: SystemAlert) => {
      this.broadcast({
        type: 'ALERT',
        data: { alert, action: 'resolved' },
        timestamp: new Date(),
        target: 'ADMINS'
      });
    });
  }

  // ========================================
  // BROADCAST AUTOMÁTICO DE MÉTRICAS
  // ========================================

  private startMetricsBroadcast(): void {
    // Broadcast de métricas a cada 30 segundos para admins conectados
    this.metricsInterval = setInterval(async () => {
      const adminCount = Array.from(this.connectedUsers.values())
        .filter(user => user.user_type === 'ADMIN').length;

      if (adminCount > 0) {
        try {
          const metrics = await this.dashboardService.getDashboardMetrics();
          this.broadcast({
            type: 'METRICS',
            data: metrics,
            timestamp: new Date(),
            target: 'ADMINS'
          });
        } catch (error) {
          console.error('❌ Erro no broadcast automático de métricas:', error);
        }
      }
    }, 30000); // 30 segundos
  }

  // ========================================
  // INFORMAÇÕES DE STATUS
  // ========================================

  getConnectionStats(): {
    total_connections: number;
    admin_connections: number;
    affiliate_connections: number;
    uptime_minutes: number;
  } {
    const users = Array.from(this.connectedUsers.values());
    const adminConnections = users.filter(u => u.user_type === 'ADMIN').length;
    const affiliateConnections = users.filter(u => u.user_type === 'AFFILIATE').length;

    return {
      total_connections: users.length,
      admin_connections: adminConnections,
      affiliate_connections: affiliateConnections,
      uptime_minutes: process.uptime() / 60
    };
  }

  getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  // ========================================
  // LIMPEZA E DESTRUIÇÃO
  // ========================================

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.io) {
      this.io.close();
      this.io = null;
    }

    this.connectedUsers.clear();
    this.dashboardService.removeAllListeners();
  }
}

export default WebSocketService;
