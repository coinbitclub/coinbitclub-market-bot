import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';
import { systemService } from '../../src/services/api';
import { useNotifications } from '../../src/contexts/NotificationContext.simple';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string;
  message: string;
  details?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
}

const LogsAdmin: NextPage = () => {
  const { addNotification } = useNotifications();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  // Função para buscar logs do Railway
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar logs da API Railway integrada primeiro
      const railwayResponse = await fetch('http://localhost:9999/api/admin/railway/logs/railway', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (railwayResponse.ok) {
        const railwayData = await railwayResponse.json();
        setLogs(railwayData.logs || []);
        addNotification('✅ Logs carregados do banco Railway com sucesso!', 'success');
        return;
      }

      // Fallback para API systemService
      const logsData = await systemService.getLogs({
        level: filter !== 'all' ? filter : undefined,
        service: serviceFilter !== 'all' ? serviceFilter : undefined,
        search: searchTerm || undefined,
        limit: 100
      });
      
      setLogs(logsData);
      if (!autoRefresh) {
        addNotification('Logs carregados com sucesso', 'success');
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      if (!autoRefresh) {
        addNotification('Erro ao carregar logs. Usando dados locais.', 'warning');
      }
      
      // Fallback para dados mockados
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-20T10:30:00Z',
          level: 'INFO',
          service: 'api-gateway',
          message: 'Usuário logado com sucesso',
          userId: 'user123',
          ip: '192.168.1.100',
          endpoint: '/auth/login',
          method: 'POST',
          statusCode: 200,
          responseTime: 145
        },
        {
          id: '2',
          timestamp: '2024-01-20T10:25:00Z',
          level: 'ERROR',
          service: 'trading-bot',
          message: 'Erro ao executar ordem',
          details: 'Conexão perdida com a exchange durante a execução da ordem BTC/USDT',
          ip: '10.0.0.5'
        },
        {
          id: '3',
          timestamp: '2024-01-20T10:20:00Z',
          level: 'WARN',
          service: 'notification',
          message: 'Limite de envio de WhatsApp atingido',
          details: 'API do WhatsApp retornou código 429 - rate limit exceeded'
        }
      ];
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
      }, 5000); // Refresh a cada 5 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const clearLogs = async () => {
    try {
      setLogs([]);
      addNotification('Logs limpos com sucesso', 'success');
    } catch (error) {
      addNotification('Erro ao limpar logs', 'error');
    }
  };

  const handleSearch = () => {
    try {
      setLoading(true);
      // Mock data - integração real será feita aqui
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-20 11:45:23',
          level: 'ERROR',
          service: 'API-Gateway',
          message: 'Failed to connect to TradingView API',
          details: 'Connection timeout after 30 seconds. Check API credentials and network connectivity.',
          endpoint: '/api/tradingview/signals',
          method: 'GET',
          statusCode: 500,
          responseTime: 30000,
          ip: '192.168.1.100'
        },
        {
          id: '2',
          timestamp: '2024-01-20 11:44:15',
          level: 'WARN',
          service: 'Signal-Processor',
          message: 'High signal processing delay detected',
          details: 'Processing time exceeded 2 seconds for BTCUSDT signals',
          responseTime: 2150
        },
        {
          id: '3',
          timestamp: '2024-01-20 11:43:02',
          level: 'INFO',
          service: 'Order-Executor',
          message: 'Successfully executed LONG order for BTCUSDT',
          details: 'Order ID: ORD123456, Entry Price: $42,500, Quantity: 0.1 BTC',
          userId: 'USER001',
          endpoint: '/api/orders/execute',
          method: 'POST',
          statusCode: 200,
          responseTime: 850
        },
        {
          id: '4',
          timestamp: '2024-01-20 11:42:30',
          level: 'ERROR',
          service: 'Payment-Gateway',
          message: 'Payment processing failed',
          details: 'Stripe webhook timeout. Payment ID: pi_1234567890. User subscription may not be activated.',
          userId: 'USER002',
          endpoint: '/api/webhooks/stripe',
          method: 'POST',
          statusCode: 500,
          responseTime: 15000,
          ip: '54.187.216.72'
        },
        {
          id: '5',
          timestamp: '2024-01-20 11:41:18',
          level: 'INFO',
          service: 'Auth-Service',
          message: 'User login successful',
          details: 'User: joao@email.com logged in successfully',
          userId: 'USER003',
          endpoint: '/api/auth/login',
          method: 'POST',
          statusCode: 200,
          responseTime: 245,
          ip: '189.123.45.67',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '6',
          timestamp: '2024-01-20 11:40:55',
          level: 'DEBUG',
          service: 'Signal-Ingestor',
          message: 'Received new signal from CoinStats',
          details: 'Signal: RSI oversold for BTC, Confidence: 85%',
          responseTime: 120
        },
        {
          id: '7',
          timestamp: '2024-01-20 11:39:44',
          level: 'WARN',
          service: 'Database',
          message: 'Slow query detected',
          details: 'Query took 3.2 seconds to execute: SELECT * FROM operations WHERE...',
          responseTime: 3200
        },
        {
          id: '8',
          timestamp: '2024-01-20 11:38:12',
          level: 'INFO',
          service: 'Notifications',
          message: 'WhatsApp notification sent successfully',
          details: 'Notification sent to +55119xxxxxxxx about new signal BTCUSDT LONG',
          userId: 'USER004'
        }
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'WARN':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
      case 'INFO':
        return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
      case 'DEBUG':
        return <CheckCircleIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      case 'INFO': return 'text-blue-400';
      case 'DEBUG': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // Funções de controle do sistema integradas com Railway
  const handleStopAllOperations = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso irá parar TODAS as operações de trading ativas. Tem certeza?')) return;
    
    try {
      // Tentar API Railway primeiro
      const response = await fetch('http://localhost:9999/api/admin/railway/emergency/stop-railway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Parada de emergência solicitada pelo administrador via interface web'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('✅ Todas as operações foram interrompidas com sucesso no Railway Database!');
        fetchLogs(); // Atualizar logs
        return;
      }

      // Fallback para API original
      const fallbackResponse = await fetch('/api/admin/emergency/stop-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (fallbackResponse.ok) {
        alert('✅ Todas as operações foram interrompidas com sucesso.');
        fetchLogs();
      } else {
        throw new Error('Falha ao parar operações');
      }
    } catch (error) {
      console.error('Erro ao parar operações:', error);
      alert('❌ Erro ao parar operações. Verifique os logs.');
    }
  };

  const handleRestartTrading = async () => {
    if (!confirm('Deseja reiniciar o sistema de trading? Isso pode levar alguns minutos.')) return;
    
    try {
      // Tentar API Railway primeiro
      const response = await fetch('http://localhost:9999/api/admin/railway/emergency/restart-trading-railway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('✅ Sistema de trading reiniciado com sucesso via Railway Database!');
        fetchLogs();
        return;
      }

      // Fallback para API original
      const fallbackResponse = await fetch('/api/admin/emergency/restart-trading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (fallbackResponse.ok) {
        alert('✅ Sistema de trading reiniciado com sucesso.');
        fetchLogs();
      } else {
        throw new Error('Falha ao reiniciar trading');
      }
    } catch (error) {
      console.error('Erro ao reiniciar trading:', error);
      alert('❌ Erro ao reiniciar trading. Verifique os logs.');
    }
  };

  const handleRestartServices = async () => {
    if (!confirm('Deseja reiniciar todos os serviços? Isso pode causar indisponibilidade temporária.')) return;
    
    try {
      const response = await fetch('/api/admin/emergency/restart-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('✅ Serviços reiniciados com sucesso.');
        fetchLogs();
      } else {
        throw new Error('Falha ao reiniciar serviços');
      }
    } catch (error) {
      console.error('Erro ao reiniciar serviços:', error);
      alert('❌ Erro ao reiniciar serviços. Verifique os logs.');
    }
  };

  const handleSystemHealth = async () => {
    try {
      // Tentar API Railway primeiro
      const response = await fetch('http://localhost:9999/api/admin/railway/system/health-railway', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const healthData = await response.json();
        const status = `
🔍 STATUS DO SISTEMA (Railway Database Integrado):

📊 Serviços:
• Database: ${healthData.database || 'DESCONHECIDO'}
• API Gateway: ${healthData.api_gateway || 'DESCONHECIDO'}
• Trading Bot: ${healthData.trading_bot || 'DESCONHECIDO'}

⚠️ Sistema:
• Parada de Emergência: ${healthData.emergency_stop ? '🔴 ATIVADA' : '🟢 DESATIVADA'}
• Alertas Críticos: ${healthData.critical_alerts || 0}
• Erros Recentes: ${healthData.recent_errors || 0}

💹 Configurações:
• Alavancagem Máxima: ${healthData.max_leverage || 'N/A'}
• Posição Mínima: ${healthData.min_position_size || 'N/A'}

🕐 Última verificação: ${new Date(healthData.last_check).toLocaleString('pt-BR')}

✅ SISTEMA INTEGRADO AO POSTGRESQL RAILWAY!
        `;
        alert(status);
        return;
      }

      // Fallback para API original
      const fallbackResponse = await fetch('/api/admin/system/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (fallbackResponse.ok) {
        const healthData = await fallbackResponse.json();
        const status = `
🔍 STATUS DO SISTEMA:

📊 Serviços:
• API Gateway: ${healthData.apiGateway || 'DESCONHECIDO'}
• Trading Bot: ${healthData.tradingBot || 'DESCONHECIDO'}
• Database: ${healthData.database || 'DESCONHECIDO'}
• Redis Cache: ${healthData.redis || 'DESCONHECIDO'}

💹 Exchanges:
• Binance: ${healthData.binance || 'DESCONHECIDO'}
• Bybit: ${healthData.bybit || 'DESCONHECIDO'}

⚡ Performance:
• CPU: ${healthData.cpu || 'N/A'}%
• Memória: ${healthData.memory || 'N/A'}%
• Uptime: ${healthData.uptime || 'N/A'}

🔄 Última atualização: ${new Date().toLocaleString('pt-BR')}
        `;
        alert(status);
      } else {
        throw new Error('Falha ao obter status');
      }
    } catch (error) {
      console.error('Erro ao obter status:', error);
      alert('❌ Erro ao obter status do sistema. Verifique a conectividade.');
    }
  };

  const getLevelBadge = (level: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (level) {
      case 'ERROR': return `${baseClasses} bg-red-900/50 text-red-300 border border-red-700`;
      case 'WARN': return `${baseClasses} bg-yellow-900/50 text-yellow-300 border border-yellow-700`;
      case 'INFO': return `${baseClasses} bg-blue-900/50 text-blue-300 border border-blue-700`;
      case 'DEBUG': return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
      default: return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
    }
  };

  const getServiceBadge = (service: string) => {
    const colors = {
      'API-Gateway': 'bg-purple-900/50 text-purple-300',
      'Signal-Processor': 'bg-green-900/50 text-green-300',
      'Order-Executor': 'bg-blue-900/50 text-blue-300',
      'Payment-Gateway': 'bg-yellow-900/50 text-yellow-300',
      'Auth-Service': 'bg-indigo-900/50 text-indigo-300',
      'Signal-Ingestor': 'bg-pink-900/50 text-pink-300',
      'Database': 'bg-red-900/50 text-red-300',
      'Notifications': 'bg-cyan-900/50 text-cyan-300'
    };
    
    return `px-2 py-1 rounded text-xs ${colors[service as keyof typeof colors] || 'bg-gray-900/50 text-gray-300'}`;
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level.toLowerCase() !== filter) return false;
    if (serviceFilter !== 'all' && log.service !== serviceFilter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.details?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const uniqueServices = Array.from(new Set(logs.map(log => log.service)));
  const errorCount = logs.filter(log => log.level === 'ERROR').length;
  const warnCount = logs.filter(log => log.level === 'WARN').length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando logs do sistema...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Logs do Sistema - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Logs">
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
                  Logs do Sistema
                </h1>
                <p className="text-gray-400">
                  {errorCount > 0 && <span className="text-red-400">{errorCount} erros</span>}
                  {errorCount > 0 && warnCount > 0 && <span className="text-gray-500"> • </span>}
                  {warnCount > 0 && <span className="text-yellow-400">{warnCount} avisos</span>}
                  {(errorCount > 0 || warnCount > 0) && <span className="text-gray-500"> • </span>}
                  <span className="text-gray-400">{filteredLogs.length} entradas exibidas</span>
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? 'bg-green-600 text-white hover:bg-green-500' 
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  <ArrowPathIcon className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
                </button>
                
                <button
                  onClick={fetchLogs}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Controles do Sistema */}
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Controles de Emergência do Sistema</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={handleStopAllOperations}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
                Parar Todas Operações
              </button>
              
              <button
                onClick={handleRestartTrading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Reiniciar Trading
              </button>
              
              <button
                onClick={handleRestartServices}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Reiniciar Serviços
              </button>
              
              <button
                onClick={handleSystemHealth}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
              >
                <InformationCircleIcon className="w-5 h-5" />
                Status do Sistema
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
              <p className="text-orange-300 text-sm">
                <strong>⚠️ Atenção:</strong> Os controles de emergência afetam todas as operações em tempo real. 
                Use apenas em situações críticas ou para manutenção programada.
              </p>
            </div>
          </div>

          {/* Estatísticas por Nível */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-red-400">Erros</h3>
                <XCircleIcon className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">{logs.filter(l => l.level === 'ERROR').length}</p>
              <p className="text-sm text-gray-400">Últimas 24h</p>
            </div>
            
            <div style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-yellow-400">Avisos</h3>
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white">{logs.filter(l => l.level === 'WARN').length}</p>
              <p className="text-sm text-gray-400">Últimas 24h</p>
            </div>
            
            <div style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-blue-400">Info</h3>
                <InformationCircleIcon className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{logs.filter(l => l.level === 'INFO').length}</p>
              <p className="text-sm text-gray-400">Últimas 24h</p>
            </div>
            
            <div style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-400">Debug</h3>
                <CheckCircleIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">{logs.filter(l => l.level === 'DEBUG').length}</p>
              <p className="text-sm text-gray-400">Últimas 24h</p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Filtros e Busca</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nível</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="error">Erros</option>
                  <option value="warn">Avisos</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Serviço</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  {uniqueServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar nos logs..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Logs */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Entradas de Log ({filteredLogs.length})
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum log encontrado</h3>
                  <p className="text-gray-500">Não há logs para os filtros selecionados.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`border-l-4 p-4 bg-black/20 rounded-r-lg ${
                      log.level === 'ERROR' ? 'border-red-500' :
                      log.level === 'WARN' ? 'border-yellow-500' :
                      log.level === 'INFO' ? 'border-blue-500' :
                      'border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getLevelIcon(log.level)}
                        <span className={getLevelBadge(log.level)}>
                          {log.level}
                        </span>
                        <span className={getServiceBadge(log.service)}>
                          {log.service}
                        </span>
                        <span className="text-xs text-gray-400">
                          {log.timestamp}
                        </span>
                      </div>
                      
                      {log.responseTime && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.responseTime > 2000 ? 'bg-red-900/50 text-red-300' :
                          log.responseTime > 1000 ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {log.responseTime}ms
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-white font-semibold mb-2">{log.message}</h4>
                    
                    {log.details && (
                      <p className="text-gray-300 text-sm mb-3 bg-black/30 p-3 rounded">
                        {log.details}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {log.endpoint && (
                        <span>
                          <span className="text-gray-400">Endpoint:</span> {log.method} {log.endpoint}
                        </span>
                      )}
                      {log.statusCode && (
                        <span>
                          <span className="text-gray-400">Status:</span> 
                          <span className={`ml-1 ${
                            log.statusCode >= 400 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {log.statusCode}
                          </span>
                        </span>
                      )}
                      {log.userId && (
                        <span>
                          <span className="text-gray-400">User:</span> {log.userId}
                        </span>
                      )}
                      {log.ip && (
                        <span>
                          <span className="text-gray-400">IP:</span> {log.ip}
                        </span>
                      )}
                    </div>
                    
                    {log.userAgent && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="text-gray-400">User Agent:</span> {log.userAgent}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default LogsAdmin;
