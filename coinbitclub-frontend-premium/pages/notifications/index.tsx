import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';

// Types
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'ai_report';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: 'system' | 'ai' | 'trading' | 'affiliate' | 'financial';
}

const NotificationsPage: NextPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai_reports'>('all');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    
    // Check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Buscar notificações da API
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // Fallback para dados mock se API não estiver disponível
        console.log('API not available, using mock data');
        const now = Date.now();
        const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'ai_report',
          title: 'Novo Relatório de IA Disponível',
          message: 'Análise de performance da carteira atualizada com recomendações importantes.',
          timestamp: new Date(now).toISOString(),
          read: false,
          actionUrl: '/dashboard',
          priority: 'high',
          source: 'ai'
        },
        {
          id: '2',
          type: 'success',
          title: 'Posição Fechada com Lucro',
          message: 'BTCUSDT LONG fechada com +2.3% de lucro. Stop loss ajustado automaticamente.',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium',
          source: 'trading'
        },
        {
          id: '3',
          type: 'info',
          title: 'Nova Referência Confirmada',
          message: 'crypto_trader_01 completou o primeiro depósito. Comissão de $25 será creditada.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium',
          source: 'affiliate'
        },
        {
          id: '4',
          type: 'warning',
          title: 'Atenção: Volatilidade Alta Detectada',
          message: 'Mercado apresenta volatilidade acima do normal. Considere reduzir exposição.',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          read: true,
          priority: 'high',
          source: 'ai'
        },
        {
          id: '5',
          type: 'ai_report',
          title: 'Relatório Financeiro Mensal',
          message: 'Demonstrativo de resultado do mês disponível com análise de IA.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/admin/accounting',
          priority: 'medium',
          source: 'financial'
        },
        {
          id: '6',
          type: 'error',
          title: 'Erro na Conexão com Exchange',
          message: 'Conexão com Binance temporariamente instável. Reconectando automaticamente.',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'critical',
          source: 'system'
        }
      ];

        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'ai_reports':
        return notifications.filter(n => n.type === 'ai_report' || n.source === 'ai');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (type === 'ai_report' || priority === 'critical') {
      return <SparklesIcon className="size-5" />;
    }
    
    switch (type) {
      case 'success':
        return <CheckIcon className="size-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="size-5" />;
      case 'error':
        return <XMarkIcon className="size-5" />;
      default:
        return <InformationCircleIcon className="size-5" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'text-destructive bg-destructive/10';
    
    switch (type) {
      case 'success':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'error':
        return 'text-destructive bg-destructive/10';
      case 'ai_report':
        return 'text-primary bg-primary/10';
      default:
        return 'text-info bg-info/10';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-muted/10 text-muted-foreground',
      medium: 'bg-info/10 text-info',
      high: 'bg-warning/10 text-warning',
      critical: 'bg-destructive/10 text-destructive'
    };

    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Notificações - CoinBitClub MarketBot</title>
        <meta name="description" content="Central de notificações e alertas do sistema" />
      </Head>

      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="flex items-center text-3xl font-bold text-primary">
                  <BellIcon className="mr-3 size-8" />
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-3 rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Central de alertas e relatórios automáticos
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                  Marcar Todas como Lidas
                </Button>
                <Button onClick={clearAllNotifications} className="text-destructive">
                  Limpar Todas
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Todas ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'unread' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Não Lidas ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('ai_reports')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'ai_reports' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Relatórios de IA ({notifications.filter(n => n.type === 'ai_report' || n.source === 'ai').length})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="p-8 text-center">
                <BellIcon className="mx-auto mb-4 size-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhuma notificação encontrada</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? 'Você está em dia! Não há notificações no momento.'
                    : filter === 'unread'
                    ? 'Todas as notificações foram lidas.'
                    : 'Nenhum relatório de IA disponível no momento.'
                  }
                </p>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-4 transition-all hover:shadow-lg ${
                    !notification.read ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-start space-x-4">
                      <div className={`rounded-lg p-2 ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          {getPriorityBadge(notification.priority)}
                          <span className="rounded bg-muted/20 px-2 py-1 text-xs">
                            {notification.source.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className={`mb-2 text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <Button 
                                onClick={() => window.location.href = notification.actionUrl!}
                                className="text-xs"
                              >
                                Ver Detalhes
                              </Button>
                            )}
                            
                            {!notification.read && (
                              <Button 
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs"
                              >
                                Marcar como Lida
                              </Button>
                            )}
                            
                            <Button 
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-destructive"
                            >
                              <TrashIcon className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default NotificationsPage;
