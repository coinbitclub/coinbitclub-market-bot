import React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// ====== TIPOS E INTERFACES ======
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // ms, 0 = permanent
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
  read: boolean;
  data?: any;
}

export interface SystemAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  service: string;
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  systemAlerts: SystemAlert[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

// ====== CONTEXT ======
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ====== PROVIDER ======
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  // Conectar ao WebSocket quando o componente for montado
  useEffect(() => {
    const connectSocket = () => {
      setConnectionStatus('connecting');
      
      const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
        auth: {
          token: localStorage.getItem('admin_token')
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ WebSocket conectado');
        setConnectionStatus('connected');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket desconectado:', reason);
        setConnectionStatus('disconnected');
        
        // Tentar reconectar automaticamente
        if (reason === 'io server disconnect') {
          setTimeout(connectSocket, 5000);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão WebSocket:', error);
        setConnectionStatus('error');
        setTimeout(connectSocket, 5000);
      });

      // ====== LISTENERS DE EVENTOS ======
      
      // Notificações gerais
      newSocket.on('notification', (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        addNotification(data);
      });

      // Alertas do sistema
      newSocket.on('system_alert', (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => {
        const newAlert: SystemAlert = {
          ...alert,
          id: Date.now().toString(),
          timestamp: Date.now()
        };
        setSystemAlerts(prev => [newAlert, ...prev]);
        
        // Também criar uma notificação para alertas críticos
        if (alert.level === 'critical') {
          addNotification({
            type: 'error',
            title: `🚨 Alerta Crítico: ${alert.service}`,
            message: alert.message,
            duration: 0 // Permanente para alertas críticos
          });
        }
      });

      // Trading events
      newSocket.on('trade_executed', (data: any) => {
        addNotification({
          type: data.profitable ? 'success' : 'warning',
          title: 'Trade Executado',
          message: `${data.pair}: ${data.profitable ? 'Lucro' : 'Perda'} de R$ ${data.amount.toFixed(2)}`,
          duration: 5000,
          data
        });
      });

      // Affiliate events
      newSocket.on('affiliate_commission', (data: any) => {
        addNotification({
          type: 'success',
          title: 'Nova Comissão de Afiliado',
          message: `R$ ${data.amount.toFixed(2)} para ${data.affiliateName}`,
          duration: 8000,
          data
        });
      });

      // System events
      newSocket.on('system_status', (data: any) => {
        if (data.status === 'down') {
          addNotification({
            type: 'error',
            title: `🔴 Serviço Offline: ${data.service}`,
            message: data.message || 'Serviço não está respondendo',
            duration: 0
          });
        } else if (data.status === 'up') {
          addNotification({
            type: 'success',
            title: `🟢 Serviço Online: ${data.service}`,
            message: data.message || 'Serviço foi restaurado',
            duration: 5000
          });
        }
      });

      // Emergency events
      newSocket.on('emergency_stop', (data: any) => {
        addNotification({
          type: 'error',
          title: '🛑 PARADA DE EMERGÊNCIA',
          message: 'Todas as operações foram interrompidas por segurança',
          duration: 0,
          action: {
            label: 'Ver Detalhes',
            onClick: () => window.location.href = '/admin/logs'
          }
        });
      });

      // User events
      newSocket.on('user_deposit', (data: any) => {
        addNotification({
          type: 'info',
          title: 'Novo Depósito',
          message: `R$ ${data.amount.toFixed(2)} de ${data.userName}`,
          duration: 6000,
          data
        });
      });

      newSocket.on('user_withdrawal', (data: any) => {
        addNotification({
          type: 'warning',
          title: 'Solicitação de Saque',
          message: `R$ ${data.amount.toFixed(2)} por ${data.userName}`,
          duration: 0,
          action: {
            label: 'Revisar',
            onClick: () => window.location.href = `/admin/users/${data.userId}`
          },
          data
        });
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Função para adicionar notificação
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
      duration: notification.duration ?? 5000
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remover após o tempo especificado (se não for permanente)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    // Som de notificação (opcional)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico'
      });
    }
  };

  // Função para remover notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Função para marcar como lida
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Função para marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Função para limpar todas
  const clearAll = () => {
    setNotifications([]);
  };

  // Calcular não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    systemAlerts,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    isConnected: connectionStatus === 'connected',
    connectionStatus
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ====== HOOK PARA SOLICITAR PERMISSÃO DE NOTIFICAÇÃO ======
export const useNotificationPermission = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
};

// ====== COMPONENTE DE NOTIFICAÇÃO TOAST ======
export const NotificationToast: React.FC<{ 
  notification: Notification; 
  onClose: () => void;
  onMarkAsRead: () => void;
}> = ({ notification, onClose, onMarkAsRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-900/90 border-green-500';
      case 'error': return 'bg-red-900/90 border-red-500';
      case 'warning': return 'bg-yellow-900/90 border-yellow-500';
      case 'info': return 'bg-blue-900/90 border-blue-500';
      default: return 'bg-gray-900/90 border-gray-500';
    }
  };

  return (
    <div className={`
      ${getBgColor()} 
      rounded-lg p-4 mb-3 border-l-4 backdrop-blur-sm
      animate-in slide-in-from-right duration-300
      ${!notification.read ? 'ring-2 ring-yellow-400/50' : ''}
    `}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm">{notification.title}</h4>
          <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
            </span>
            {!notification.read && (
              <button
                onClick={onMarkAsRead}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                Marcar como lida
              </button>
            )}
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                {notification.action.label}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ====== COMPONENTE CONTAINER DE NOTIFICAÇÕES ======
export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {notifications.slice(0, 5).map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onMarkAsRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
};

// ====== INDICADOR DE STATUS DE CONEXÃO ======
export const ConnectionStatus: React.FC = () => {
  const { connectionStatus } = useNotifications();

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'bg-green-500', text: 'Online', icon: '🟢' };
      case 'connecting':
        return { color: 'bg-yellow-500 animate-pulse', text: 'Conectando...', icon: '🟡' };
      case 'disconnected':
        return { color: 'bg-red-500', text: 'Offline', icon: '🔴' };
      case 'error':
        return { color: 'bg-red-600', text: 'Erro', icon: '❌' };
      default:
        return { color: 'bg-gray-500', text: 'Desconhecido', icon: '⚪' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
      <span className="text-gray-300">{status.text}</span>
    </div>
  );
};
