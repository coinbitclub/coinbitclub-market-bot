import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiUsers, FiActivity, FiBarChart2, FiAlertTriangle, FiCheckCircle, FiSettings, 
  FiLoader, FiTrendingUp, FiTrendingDown, FiMinus, FiFileText, FiZap, FiTarget, 
  FiDollarSign, FiPieChart, FiDatabase, FiCreditCard, FiMail, FiWifi, FiEye,
  FiUserCheck, FiRefreshCw, FiFilter, FiSearch, FiPlus, FiEdit, FiTrash
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { fetchAdminMetrics, fetchUserGrowth, fetchSignalPerformance, fetchRecentActivities, fetchSystemAlerts } from '../../lib/api';

// Types for comprehensive admin dashboard
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
  source: 'TRADINGVIEW' | 'COINTARS';
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
  paid: boolean;
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

  // Fetch data from backend
  const { data: dashboardData, error: dashboardError } = useSWR('/api/admin/dashboard', fetchAdminMetrics);
  const { data: marketReading, error: marketError } = useSWR('/api/admin/market-reading', fetchAdminMetrics);
  const { data: systemStatus, error: statusError } = useSWR('/api/admin/system-status', fetchAdminMetrics);
  const { data: operations, error: operationsError } = useSWR('/api/admin/operations', fetchAdminMetrics);
  const { data: signals, error: signalsError } = useSWR('/api/admin/signals', fetchAdminMetrics);
  const { data: recentActivities, error: activitiesError } = useSWR('/api/admin/activities', fetchRecentActivities);
  const { data: alerts, error: alertsError } = useSWR('/api/admin/alerts', fetchSystemAlerts);
  
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('pt-BR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (dashboardError || marketError || statusError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar dados</h3>
          <p className="mt-1 text-sm text-gray-500">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  const getMarketDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-600 bg-green-100';
      case 'SHORT': return 'text-red-600 bg-red-100';
      case 'NEUTRO': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Painel Administrativo - CoinBitClub</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                  <p className="mt-1 text-sm text-gray-500">Última atualização: {currentTime}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <FiRefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Métricas de Retorno e Assertividade */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiTrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Retorno % Dia</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.returns?.day ? formatPercentage(dashboardData.returns.day.return) : '--'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiBarChart2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Retorno % Histórico</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.returns?.historical ? formatPercentage(dashboardData.returns.historical.return) : '--'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiTarget className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Assertividade % Dia</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.returns?.day ? formatPercentage(dashboardData.returns.day.accuracy) : '--'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiZap className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Assertividade % Histórica</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.returns?.historical ? formatPercentage(dashboardData.returns.historical.accuracy) : '--'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leitura do Mercado */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leitura do Mercado</h3>
                
                {marketReading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMarketDirectionColor(marketReading.direction)}`}>
                          {marketReading.direction === 'LONG' && <FiTrendingUp className="mr-2 h-4 w-4" />}
                          {marketReading.direction === 'SHORT' && <FiTrendingDown className="mr-2 h-4 w-4" />}
                          {marketReading.direction === 'NEUTRO' && <FiMinus className="mr-2 h-4 w-4" />}
                          {marketReading.direction}
                        </span>
                        <span className="text-sm text-gray-500">
                          Confiança: {marketReading.confidence}%
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(marketReading.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Justificativa da IA:</h4>
                      <p className="text-sm text-gray-600">{marketReading.ai_justification}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Acompanhamento do Dia:</h4>
                      <p className="text-sm text-gray-600">{marketReading.day_tracking}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FiLoader className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                    <p className="mt-2 text-sm text-gray-500">Carregando leitura do mercado...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Operações em Andamento */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Operações em Andamento</h3>
                  
                  <div className="space-y-3">
                    {operations?.map((operation: Operation) => (
                      <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            operation.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {operation.side}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{operation.symbol}</p>
                            <p className="text-xs text-gray-500">
                              {operation.exchange} {operation.is_testnet && '(Testnet)'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(operation.current_price)}
                          </p>
                          <p className={`text-xs ${operation.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(operation.return_percentage)}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhuma operação em andamento</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Atividades Recentes */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Atividades Recentes</h3>
                  
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {recentActivities?.map((activity: RecentActivity, index: number) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {index !== recentActivities.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  <FiActivity className="h-4 w-4 text-white" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">{activity.description}</p>
                                  {activity.user && (
                                    <p className="text-xs text-gray-400">por {activity.user}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {new Date(activity.timestamp).toLocaleString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      )) || (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Sinais TradingView */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sinais TradingView</h3>
                  
                  <div className="space-y-3">
                    {signals?.filter((s: Signal) => s.source === 'TRADINGVIEW')?.map((signal: Signal) => (
                      <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{signal.symbol}</p>
                          <p className="text-xs text-gray-500">{signal.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(signal.price)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(signal.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhum sinal recente</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sinais CoinStars */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sinais CoinStars</h3>
                  
                  <div className="space-y-3">
                    {signals?.filter((s: Signal) => s.source === 'COINTARS')?.map((signal: Signal) => (
                      <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{signal.indicator || signal.symbol}</p>
                          <p className="text-xs text-gray-500">Dados: {JSON.stringify(signal.data)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(signal.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhum sinal recente</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Solicitações Pendentes e Status do Sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Solicitações Pendentes */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Solicitações Pendentes</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Reembolsos de Usuário</h4>
                      <div className="space-y-2">
                        {dashboardData?.pendingRefunds?.map((refund: RefundRequest) => (
                          <div key={refund.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                            <span className="text-sm text-gray-900">{refund.user_name}</span>
                            <span className="text-sm font-medium text-yellow-800">
                              {formatCurrency(refund.amount_requested, refund.currency)}
                            </span>
                          </div>
                        )) || (
                          <p className="text-xs text-gray-500">Nenhuma solicitação pendente</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Acertos com Afiliados</h4>
                      <div className="space-y-2">
                        {dashboardData?.pendingSettlements?.map((settlement: AffiliateSettlement) => (
                          <div key={settlement.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <span className="text-sm text-gray-900">{settlement.affiliate_name}</span>
                            <span className="text-sm font-medium text-blue-800">
                              {formatCurrency(settlement.total_due, settlement.currency)}
                            </span>
                          </div>
                        )) || (
                          <p className="text-xs text-gray-500">Nenhum acerto pendente</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status do Sistema */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Status do Sistema</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FiWifi className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">API Status</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSystemStatusColor(systemStatus?.api || 'offline')}`}>
                        {systemStatus?.api || 'offline'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FiDatabase className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">Database</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSystemStatusColor(systemStatus?.database || 'offline')}`}>
                        {systemStatus?.database || 'offline'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FiCreditCard className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">Payments</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSystemStatusColor(systemStatus?.payments || 'offline')}`}>
                        {systemStatus?.payments || 'offline'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FiMail className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">E-mail</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSystemStatusColor(systemStatus?.email || 'offline')}`}>
                        {systemStatus?.email || 'offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
