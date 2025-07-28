import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * 🔔 SISTEMA WEBSOCKET COMPLETO - NOTIFICAÇÕES REAL-TIME
 * Integração total com frontend NotificationContext.tsx
 */
export class WebSocketService {
  static io = null;
  static connectedUsers = new Map(); // userId -> socket mapping

  /**
   * Inicializar WebSocket server
   */
  static init(server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupEventHandlers();
    
    logger.info('🚀 WebSocket server inicializado');
  }

  /**
   * Configurar autenticação WebSocket
   */
  static setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token não fornecido'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db('users').where('id', decoded.id).first();
        
        if (!user) {
          return next(new Error('Usuário não encontrado'));
        }

        socket.userId = user.id;
        socket.userType = user.user_type;
        socket.userEmail = user.email;
        
        next();
      } catch (error) {
        logger.error('Erro na autenticação WebSocket:', error);
        next(new Error('Token inválido'));
      }
    });
  }

  /**
   * Configurar handlers de eventos
   */
  static setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleCustomEvents(socket);
    });
  }

  /**
   * Handle nova conexão
   */
  static handleConnection(socket) {
    logger.info(`✅ Usuário conectado: ${socket.userId} (${socket.userEmail})`);
    
    // Mapear usuário para socket
    this.connectedUsers.set(socket.userId, socket);
    
    // Enviar status de conexão
    socket.emit('connection_status', {
      status: 'connected',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });

    // Enviar notificações pendentes
    this.sendPendingNotifications(socket);

    // Join room baseado no tipo de usuário
    if (socket.userType === 'admin') {
      socket.join('admin_room');
      socket.emit('admin_status', { role: 'admin', permissions: ['all'] });
    }
    
    socket.join(`user_${socket.userId}`);
  }

  /**
   * Handle desconexão
   */
  static handleDisconnection(socket) {
    socket.on('disconnect', (reason) => {
      logger.info(`❌ Usuário desconectado: ${socket.userId} - Motivo: ${reason}`);
      this.connectedUsers.delete(socket.userId);
    });
  }

  /**
   * Handle eventos customizados
   */
  static handleCustomEvents(socket) {
    // Marcar notificação como lida
    socket.on('mark_notification_read', async (notificationId) => {
      try {
        await db('notifications')
          .where({ id: notificationId, user_id: socket.userId })
          .update({ read_at: new Date() });
        
        socket.emit('notification_marked_read', { notificationId });
      } catch (error) {
        logger.error('Erro ao marcar notificação como lida:', error);
      }
    });

    // Solicitar atualização de dados
    socket.on('request_data_update', async (dataType) => {
      try {
        const data = await this.getDataByType(dataType, socket.userId, socket.userType);
        socket.emit('data_update', { type: dataType, data });
      } catch (error) {
        logger.error('Erro ao atualizar dados:', error);
      }
    });

    // Admin: Broadcast para todos os usuários
    socket.on('admin_broadcast', async (message) => {
      if (socket.userType === 'admin') {
        this.broadcastToAllUsers(message);
      }
    });
  }

  /**
   * 📤 MÉTODOS DE ENVIO DE NOTIFICAÇÕES
   */

  // Notificação para usuário específico
  static notifyUser(userId, notification) {
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.emit('notification', {
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
        ...notification
      });
      
      logger.info(`📱 Notificação enviada para usuário ${userId}: ${notification.title}`);
    } else {
      // Salvar para envio posterior
      this.saveNotificationForLater(userId, notification);
    }
  }

  // Alerta do sistema
  static systemAlert(alert) {
    this.io.to('admin_room').emit('system_alert', {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...alert
    });

    // Se crítico, notificar todos os usuários
    if (alert.level === 'critical') {
      this.broadcastToAllUsers({
        type: 'error',
        title: `🔴 Alerta Crítico: ${alert.service}`,
        message: alert.message,
        duration: 0
      });
    }
  }

  // Trade executado
  static tradeExecuted(userId, tradeData) {
    this.notifyUser(userId, {
      type: tradeData.profitable ? 'success' : 'warning',
      title: 'Trade Executado',
      message: `${tradeData.pair}: ${tradeData.profitable ? 'Lucro' : 'Perda'} de R$ ${tradeData.amount.toFixed(2)}`,
      duration: 5000,
      data: tradeData
    });

    // Notificar admins também
    this.io.to('admin_room').emit('trade_executed', tradeData);
  }

  // Status do sistema
  static systemStatus(service, status, message) {
    const notification = {
      service,
      status,
      message: message || (status === 'down' ? 'Serviço não está respondendo' : 'Serviço foi restaurado')
    };

    this.io.to('admin_room').emit('system_status', notification);

    // Notificar usuários se afetar serviços críticos
    if (['trading', 'payments', 'database'].includes(service)) {
      this.broadcastToAllUsers({
        type: status === 'down' ? 'error' : 'success',
        title: `${status === 'down' ? '🔴' : '🟢'} Serviço ${status === 'down' ? 'Offline' : 'Online'}: ${service}`,
        message: notification.message,
        duration: status === 'down' ? 0 : 5000
      });
    }
  }

  // Depósito de usuário
  static userDeposit(depositData) {
    // Notificar admins
    this.io.to('admin_room').emit('user_deposit', {
      amount: depositData.amount,
      userName: depositData.userName,
      currency: depositData.currency,
      userId: depositData.userId
    });

    // Notificar o próprio usuário
    this.notifyUser(depositData.userId, {
      type: 'success',
      title: 'Depósito Confirmado',
      message: `Seu depósito de ${depositData.currency} ${depositData.amount.toFixed(2)} foi confirmado!`,
      duration: 8000
    });
  }

  // Solicitação de saque
  static userWithdrawal(withdrawalData) {
    // Notificar admins
    this.io.to('admin_room').emit('user_withdrawal', {
      amount: withdrawalData.amount,
      userName: withdrawalData.userName,
      currency: withdrawalData.currency,
      userId: withdrawalData.userId
    });

    // Notificar usuário
    this.notifyUser(withdrawalData.userId, {
      type: 'info',
      title: 'Saque Solicitado',
      message: `Sua solicitação de saque de ${withdrawalData.currency} ${withdrawalData.amount.toFixed(2)} está sendo processada`,
      duration: 6000
    });
  }

  // Comissão de afiliado
  static affiliateCommission(commissionData) {
    this.notifyUser(commissionData.affiliateId, {
      type: 'success',
      title: 'Nova Comissão de Afiliado',
      message: `R$ ${commissionData.amount.toFixed(2)} por indicação de ${commissionData.referredName}`,
      duration: 8000,
      data: commissionData
    });

    // Notificar admins
    this.io.to('admin_room').emit('affiliate_commission', commissionData);
  }

  // Parada de emergência
  static emergencyStop(reason) {
    this.broadcastToAllUsers({
      type: 'error',
      title: '🛑 PARADA DE EMERGÊNCIA',
      message: 'Todas as operações foram interrompidas por segurança',
      duration: 0,
      action: {
        label: 'Ver Detalhes',
        onClick: () => window.location.href = '/admin/logs'
      }
    });

    this.io.to('admin_room').emit('emergency_stop', { reason, timestamp: new Date() });
  }

  /**
   * 🔧 MÉTODOS AUXILIARES
   */

  static broadcastToAllUsers(notification) {
    this.io.emit('notification', {
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      ...notification
    });
  }

  static async sendPendingNotifications(socket) {
    try {
      const pendingNotifications = await db('notifications')
        .where({ user_id: socket.userId, read_at: null })
        .orderBy('created_at', 'desc')
        .limit(10);

      for (const notification of pendingNotifications) {
        socket.emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: new Date(notification.created_at).getTime(),
          read: false,
          data: notification.metadata
        });
      }
    } catch (error) {
      logger.error('Erro ao enviar notificações pendentes:', error);
    }
  }

  static async saveNotificationForLater(userId, notification) {
    try {
      await db('notifications').insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: JSON.stringify(notification.data || {}),
        status: 'pending',
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Erro ao salvar notificação:', error);
    }
  }

  static async getDataByType(dataType, userId, userType) {
    switch (dataType) {
      case 'dashboard':
        return userType === 'admin' 
          ? await this.getAdminDashboardData()
          : await this.getUserDashboardData(userId);
      
      case 'operations':
        return await this.getUserOperations(userId);
      
      case 'balances':
        return await this.getUserBalances(userId);
      
      default:
        return null;
    }
  }

  static getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  static getConnectedAdmins() {
    const admins = [];
    this.connectedUsers.forEach((socket, userId) => {
      if (socket.userType === 'admin') {
        admins.push({ userId, email: socket.userEmail });
      }
    });
    return admins;
  }

  static isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

export default WebSocketService;
