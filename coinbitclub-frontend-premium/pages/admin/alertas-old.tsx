import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { BellIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AlertasAdmin: NextPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'error' | 'warning'>('all');
  const [loading, setLoading] = useState(true);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Mock data - integração real será feita aqui
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'error',
          title: 'Falha na API do TradingView',
          message: 'Não foi possível conectar com a API do TradingView. Verificar credenciais.',
          timestamp: '2024-01-20 10:30:00',
          isRead: false,
          severity: 'high'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Volume baixo de operações',
          message: 'O volume de operações está 40% abaixo da média diária.',
          timestamp: '2024-01-20 09:15:00',
          isRead: false,
          severity: 'medium'
        },
        {
          id: '3',
          type: 'info',
          title: 'Novo usuário VIP cadastrado',
          message: 'João Silva se tornou usuário VIP - Plano Premium.',
          timestamp: '2024-01-20 08:45:00',
          isRead: true,
          severity: 'low'
        },
        {
          id: '4',
          type: 'error',
          title: 'Falha no pagamento Stripe',
          message: 'Erro ao processar pagamento do usuário maria@email.com - Cartão recusado.',
          timestamp: '2024-01-20 07:20:00',
          isRead: false,
          severity: 'critical'
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />;
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
      default:
        return <BellIcon className="w-6 h-6 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-blue-500 bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.isRead;
    return alert.type === filter;
  });

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando alertas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Alertas - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Alertas">
        <div className="min-h-screen" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Alertas do Sistema
                </h1>
                <p className="text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} alertas não lidos` : 'Todos os alertas foram lidos'}
                </p>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Marcar todos como lidos
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div style={cardStyle} className="mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Todos ({alerts.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'unread' 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Não lidos ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('error')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'error' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Erros ({alerts.filter(a => a.type === 'error').length})
              </button>
              <button
                onClick={() => setFilter('warning')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'warning' 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Avisos ({alerts.filter(a => a.type === 'warning').length})
              </button>
            </div>
          </div>

          {/* Lista de Alertas */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div style={cardStyle} className="text-center py-8">
                <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum alerta encontrado</h3>
                <p className="text-gray-500">Não há alertas para o filtro selecionado.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 ${getSeverityColor(alert.severity)} ${
                    !alert.isRead ? 'opacity-100' : 'opacity-60'
                  }`}
                  style={{...cardStyle, borderLeft: `4px solid ${
                    alert.severity === 'critical' ? '#ef4444' :
                    alert.severity === 'high' ? '#f97316' :
                    alert.severity === 'medium' ? '#eab308' : '#3b82f6'
                  }`}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
                          {!alert.isRead && (
                            <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">
                              Novo
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-500 text-white' :
                            alert.severity === 'high' ? 'bg-orange-500 text-white' :
                            alert.severity === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">{alert.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {new Date(alert.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!alert.isRead && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                      >
                        Marcar como lido
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AlertasAdmin;
