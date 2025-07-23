import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiAlertTriangle, FiCheckCircle, FiActivity, FiBarChart2, FiZap, 
  FiDollarSign, FiDatabase, FiCreditCard, FiMail, FiWifi, FiLoader,
  FiUsers
} from 'react-icons/fi';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchAdminMetrics, fetchMarketReading, fetchSystemStatus, fetchActiveOperations, fetchSignals, fetchRefundRequests } from '../../lib/api';

// Tipos para o dashboard administrativo
interface MarketReading {
  direction: 'LONG' | 'SHORT' | 'NEUTRO';
  confidence: number;
  ai_justification: string;
  day_tracking: string;
  created_at: string;
}

interface SystemStatus {
  api: 'online' | 'offline' | 'degraded';
  database: 'online' | 'offline' | 'degraded';
  payments: 'online' | 'offline' | 'degraded';
  email: 'online' | 'offline' | 'degraded';
}

interface ReturnMetrics {
  day: {
    return: number;
    accuracy: number;
  };
  historical: {
    return: number;
    accuracy: number;
    period: string;
  };
}

interface Operation {
  id: string;
  symbol: string;
  entry_price: number;
  current_price: number;
  exchange: string;
  is_testnet: boolean;
  side: 'LONG' | 'SHORT';
  opened_at: string;
  return_percentage: number;
}

interface Signal {
  id: string;
  source: 'TRADINGVIEW' | 'COINSTARS';
  symbol: string;
  type: string;
  price: number;
  created_at: string;
  indicator?: string;
  data?: any;
}

interface RefundRequest {
  id: string;
  user_name: string;
  amount_requested: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  created_at: string;
}

interface AffiliateSettlement {
  id: string;
  affiliate_name: string;
  total_due: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState<string>('');

  // Buscar dados da API
  const { data: returnMetrics, error: returnError } = useSWR('/api/admin/return-metrics', fetchAdminMetrics);
  const { data: marketReading, error: marketError } = useSWR('/api/admin/market-reading', fetchMarketReading);
  const { data: systemStatus, error: statusError } = useSWR('/api/admin/system-status', fetchSystemStatus);
  const { data: activeOperations, error: operationsError } = useSWR('/api/admin/active-operations', fetchActiveOperations);
  const { data: signals, error: signalsError } = useSWR('/api/admin/signals', fetchSignals);
  const { data: pendingRequests, error: requestsError } = useSWR('/api/admin/pending-requests', fetchRefundRequests);
  const { data: recentActivities, error: activitiesError } = useSWR('/api/admin/activities', fetchAdminMetrics);
  
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('pt-BR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (returnError || marketError || statusError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-white">Erro ao carregar dados</h3>
          <p className="mt-1 text-sm text-gray-400">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  // Dados simulados para teste
  const mockReturnMetrics: ReturnMetrics = {
    day: {
      return: 2.34,
      accuracy: 87.5
    },
    historical: {
      return: 156.78,
      accuracy: 83.2,
      period: '6 meses'
    }
  };

  const mockMarketReading: MarketReading = {
    direction: 'LONG',
    confidence: 87,
    ai_justification: 'Análise técnica indica tendência de alta baseada em suporte na média móvel de 50 períodos, RSI saindo da zona de sobrevenda e aumento no volume de compras.',
    day_tracking: '12/06/2025',
    created_at: '2025-06-12T15:30:00Z'
  };

  const mockSystemStatus: SystemStatus = {
    api: 'online',
    database: 'online',
    payments: 'online',
    email: 'online'
  };

  const mockActiveOperations: Operation[] = [
    { id: '1', symbol: 'BTC/USDT', entry_price: 68500.00, current_price: 69120.50, exchange: 'Binance', is_testnet: false, side: 'LONG', opened_at: '2025-06-12T14:30:00Z', return_percentage: 0.91 },
    { id: '2', symbol: 'ETH/USDT', entry_price: 3750.25, current_price: 3820.75, exchange: 'Bybit', is_testnet: false, side: 'LONG', opened_at: '2025-06-12T13:45:00Z', return_percentage: 1.88 },
    { id: '3', symbol: 'XRP/USDT', entry_price: 1.25, current_price: 1.23, exchange: 'Binance', is_testnet: false, side: 'SHORT', opened_at: '2025-06-12T15:10:00Z', return_percentage: -1.60 }
  ];

  const mockSignals: Signal[] = [
    { id: '1', source: 'TRADINGVIEW', symbol: 'BTC/USDT', type: 'BUY', price: 68500.00, created_at: '2025-06-12T14:25:00Z' },
    { id: '2', source: 'TRADINGVIEW', symbol: 'ETH/USDT', type: 'BUY', price: 3750.25, created_at: '2025-06-12T13:40:00Z' },
    { id: '3', source: 'COINSTARS', symbol: 'XRP/USDT', type: 'SELL', price: 1.25, created_at: '2025-06-12T15:05:00Z', indicator: 'RSI', data: 'Sobrecomprado' }
  ];

  const mockPendingRequests: (RefundRequest | AffiliateSettlement)[] = [
    { id: '1', user_name: 'João Silva', amount_requested: 500.00, currency: 'USD', status: 'pending', created_at: '2025-06-11T10:15:00Z' },
    { id: '2', affiliate_name: 'Carlos Afiliado', total_due: 750.00, currency: 'USD', status: 'pending', created_at: '2025-06-10T16:30:00Z' }
  ];

  const mockRecentActivities: RecentActivity[] = [
    { id: '1', type: 'operation', description: 'Operação BTC/USDT fechada com lucro de 2.3%', timestamp: '2025-06-12T14:00:00Z', user: 'Sistema' },
    { id: '2', type: 'user', description: 'Novo usuário registrado: Maria Souza', timestamp: '2025-06-12T13:35:00Z' },
    { id: '3', type: 'affiliate', description: 'Comissão de R$150 paga ao afiliado ID#123', timestamp: '2025-06-12T12:20:00Z' },
    { id: '4', type: 'system', description: 'Sinal processado: ETH/USDT compra a $3750.25', timestamp: '2025-06-12T13:40:00Z' }
  ];

  const getMarketDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-500 bg-green-900/30 border-green-500/50';
      case 'SHORT': return 'text-red-500 bg-red-900/30 border-red-500/50';
      case 'NEUTRO': return 'text-yellow-500 bg-yellow-900/30 border-yellow-500/50';
      default: return 'text-gray-500 bg-gray-900/30 border-gray-500/50';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'online': return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded': return <FiAlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'offline': return <FiAlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <FiLoader className="h-5 w-5 text-gray-500 animate-spin" />;
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <AdminLayout title="Dashboard Admin">
      <Head>
        <title>Dashboard Admin | CoinBitClub</title>
      </Head>

      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-blue-400 glow-blue">Dashboard Administrativo</h1>
          <p className="mt-1 text-sm text-pink-400">Atualizado em: {currentTime}</p>
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          {/* Métricas de Retorno */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/10 p-5 shadow-lg shadow-blue-500/10">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-blue-500/20 p-3">
                  <FiBarChart2 className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-300">Retorno % Dia</dt>
                    <dd className="text-2xl font-semibold text-blue-400 glow-blue">{formatPercentage(returnMetrics?.day?.return || mockReturnMetrics.day.return)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-pink-500/30 bg-pink-900/10 p-5 shadow-lg shadow-pink-500/10">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-pink-500/20 p-3">
                  <FiBarChart2 className="h-6 w-6 text-pink-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-pink-300">Retorno % Histórico</dt>
                    <dd className="text-2xl font-semibold text-pink-400 glow-pink">{formatPercentage(returnMetrics?.historical?.return || mockReturnMetrics.historical.return)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 p-5 shadow-lg shadow-amber-500/10">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-amber-500/20 p-3">
                  <FiActivity className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-amber-300">Assertividade % Dia</dt>
                    <dd className="text-2xl font-semibold text-amber-400 glow-gold">{formatPercentage(returnMetrics?.day?.accuracy || mockReturnMetrics.day.accuracy)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-5 shadow-lg shadow-purple-500/10">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-purple-500/20 p-3">
                  <FiActivity className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-300">Assertividade % Histórica</dt>
                    <dd className="text-2xl font-semibold text-purple-400 glow-purple">{formatPercentage(returnMetrics?.historical?.accuracy || mockReturnMetrics.historical.accuracy)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Leitura do Mercado */}
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="col-span-2 rounded-lg border border-blue-500/30 bg-blue-900/10 p-5 shadow-lg shadow-blue-500/10">
              <h2 className="text-lg font-medium text-blue-300 mb-4">Leitura do Mercado</h2>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <span className="mr-2 text-gray-300">Direção:</span>
                  <span className={`rounded-md px-3 py-1 text-sm font-medium border ${getMarketDirectionColor(marketReading?.direction || mockMarketReading.direction)}`}>
                    {marketReading?.direction || mockMarketReading.direction}
                  </span>
                  <span className="ml-2 text-gray-300">Confiança:</span>
                  <span className="ml-1 text-blue-400 font-medium">{marketReading?.confidence || mockMarketReading.confidence}%</span>
                </div>
                <div>
                  <span className="text-gray-300">Justificativa IA:</span>
                  <p className="mt-1 text-sm text-white bg-black/30 p-3 rounded border border-blue-500/20">
                    {marketReading?.ai_justification || mockMarketReading.ai_justification}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rastreamento do dia: {marketReading?.day_tracking || mockMarketReading.day_tracking}</span>
                  <span className="text-gray-400">Atualizado: {new Date(marketReading?.created_at || mockMarketReading.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Status do Sistema */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 p-5 shadow-lg shadow-amber-500/10">
              <h2 className="text-lg font-medium text-amber-300 mb-4">Status do Sistema</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiWifi className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">API</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIndicator(systemStatus?.api || mockSystemStatus.api)}
                    <span className={`ml-1.5 text-sm font-medium ${getSystemStatusColor(systemStatus?.api || mockSystemStatus.api)}`}>
                      {systemStatus?.api || mockSystemStatus.api}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiDatabase className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">Database</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIndicator(systemStatus?.database || mockSystemStatus.database)}
                    <span className={`ml-1.5 text-sm font-medium ${getSystemStatusColor(systemStatus?.database || mockSystemStatus.database)}`}>
                      {systemStatus?.database || mockSystemStatus.database}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">Payments</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIndicator(systemStatus?.payments || mockSystemStatus.payments)}
                    <span className={`ml-1.5 text-sm font-medium ${getSystemStatusColor(systemStatus?.payments || mockSystemStatus.payments)}`}>
                      {systemStatus?.payments || mockSystemStatus.payments}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiMail className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">E-mail</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIndicator(systemStatus?.email || mockSystemStatus.email)}
                    <span className={`ml-1.5 text-sm font-medium ${getSystemStatusColor(systemStatus?.email || mockSystemStatus.email)}`}>
                      {systemStatus?.email || mockSystemStatus.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operações em Andamento e Atividades Recentes */}
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Operações em Andamento */}
            <div className="rounded-lg border border-green-500/30 bg-green-900/10 p-5 shadow-lg shadow-green-500/10">
              <h2 className="text-lg font-medium text-green-300 mb-4">Operações em Andamento</h2>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead>
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Moeda</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entrada</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Atual</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exchange</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Retorno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-black/20">
                    {(activeOperations || mockActiveOperations).map((op, idx) => (
                      <tr key={op.id || idx} className="hover:bg-blue-900/10">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">{op.symbol}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">${op.entry_price.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">${op.current_price.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                          {op.exchange}
                          {op.is_testnet && <span className="ml-1 text-xs text-yellow-500">(Test)</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={op.return_percentage >= 0 ? "text-green-500" : "text-red-500"}>
                            {formatPercentage(op.return_percentage)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-5 shadow-lg shadow-purple-500/10">
              <h2 className="text-lg font-medium text-purple-300 mb-4">Atividades Recentes</h2>
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {(recentActivities || mockRecentActivities).map((activity, idx) => (
                    <li key={activity.id || idx}>
                      <div className="relative pb-8">
                        {idx !== (recentActivities || mockRecentActivities).length - 1 && (
                          <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-700" aria-hidden="true" />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center ring-8 ring-black">
                              {activity.type === 'operation' && <FiActivity className="h-5 w-5 text-blue-400" />}
                              {activity.type === 'user' && <FiUsers className="h-5 w-5 text-green-400" />}
                              {activity.type === 'affiliate' && <FiDollarSign className="h-5 w-5 text-amber-400" />}
                              {activity.type === 'system' && <FiZap className="h-5 w-5 text-pink-400" />}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-300">{activity.user || 'Sistema'}</span>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-400">
                                {new Date(activity.timestamp).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-white">
                              <p>{activity.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sinais e Solicitações Pendentes */}
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Sinais */}
            <div className="rounded-lg border border-pink-500/30 bg-pink-900/10 p-5 shadow-lg shadow-pink-500/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-pink-300">Sinais Recentes</h2>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-500/50">
                    TradingView
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-500/50">
                    CoinStars
                  </span>
                </div>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead>
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data/Hora</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Moeda</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fonte</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sinal/Dado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-black/20">
                    {(signals || mockSignals).map((signal, idx) => (
                      <tr key={signal.id || idx} className="hover:bg-pink-900/10">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                          {new Date(signal.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">{signal.symbol}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            signal.source === 'TRADINGVIEW' 
                              ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' 
                              : 'bg-amber-900/50 text-amber-400 border border-amber-500/50'
                          }`}>
                            {signal.source}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {signal.source === 'TRADINGVIEW' ? (
                            <span className={signal.type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                              {signal.type} @ ${signal.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-amber-400">
                              {signal.indicator}: {signal.data}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Solicitações Pendentes */}
            <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-5 shadow-lg shadow-red-500/10">
              <h2 className="text-lg font-medium text-red-300 mb-4">Solicitações Pendentes</h2>
              {(pendingRequests || mockPendingRequests).length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-black/20">
                      {(pendingRequests || mockPendingRequests).map((request: any, idx) => (
                        <tr key={request.id || idx} className="hover:bg-red-900/10">
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              'user_name' in request 
                                ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' 
                                : 'bg-amber-900/50 text-amber-400 border border-amber-500/50'
                            }`}>
                              {'user_name' in request ? 'Reembolso' : 'Comissão'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                            {'user_name' in request ? request.user_name : request.affiliate_name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                            {formatCurrency('user_name' in request ? request.amount_requested : request.total_due, request.currency)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                            {new Date(request.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              type="button"
                              className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
                            >
                              Processar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-black/20 rounded-md">
                  <span className="text-gray-400">Não há solicitações pendentes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
