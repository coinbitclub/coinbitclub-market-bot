import { NextPage } from 'next';
import { useState } from 'react';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  FunnelIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'ai_report';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const NotificationsPage: NextPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'ai_report',
      title: 'Novo Relatório de IA Disponível',
      message: 'Análise de performance da carteira atualizada com recomendações importantes.',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'success',
      title: 'Posição Fechada com Lucro',
      message: 'BTCUSDT LONG fechada com +2.3% de lucro.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'info',
      title: 'Nova Referência Confirmada',
      message: 'Usuário crypto_trader_01 se cadastrou usando seu link de afiliado.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'medium'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'ai_report'>('all');

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'ai_report') return notif.type === 'ai_report';
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ai_report':
        return <SparklesIcon className="size-5 text-purple-400" />;
      case 'success':
        return <CheckIcon className="size-5 text-green-400" />;
      default:
        return <BellIcon className="size-5 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center text-3xl font-bold text-cyan-400">
                <BellIcon className="mr-3 size-8" />
                Central de Notificações
              </h1>
              <p className="mt-1 text-gray-300">
                Acompanhe alertas, relatórios de IA e atualizações do sistema
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700">
                <FunnelIcon className="size-4" />
                Filtros
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-700">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'unread', label: 'Não Lidas' },
              { key: 'ai_report', label: 'Relatórios IA' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`border-b-2 px-4 py-2 transition-colors ${
                  filter === tab.key
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <BellIcon className="mx-auto mb-4 size-16 text-gray-600" />
              <h3 className="mb-2 text-xl font-semibold text-gray-400">Nenhuma notificação</h3>
              <p className="text-gray-500">Você está em dia com todas as suas notificações!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border border-l-4 border-gray-700 bg-gray-800 ${getPriorityColor(notification.priority)} rounded-lg p-4 ${
                  !notification.read ? 'bg-gray-800/80' : 'bg-gray-800/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className={`font-semibold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="size-2 rounded-full bg-cyan-400"></span>
                        )}
                      </div>
                      <p className="mb-2 text-sm text-gray-400">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                        <span className="capitalize">{notification.priority}</span>
                        <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-gray-400 transition-colors hover:text-cyan-400"
                        title="Marcar como lida"
                      >
                        <CheckIcon className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 transition-colors hover:text-red-400"
                      title="Excluir notificação"
                    >
                      <XMarkIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold text-cyan-400">{notifications.length}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {notifications.filter(n => !n.read).length}
              </div>
              <div className="text-sm text-gray-400">Não Lidas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {notifications.filter(n => n.type === 'ai_report').length}
              </div>
              <div className="text-sm text-gray-400">Relatórios IA</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
