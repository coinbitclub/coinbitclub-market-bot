import React from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiUsers, FiActivity, FiBarChart2, FiAlertTriangle, FiCheckCircle, FiSettings, 
  FiLoader, FiTrendingUp, FiTrendingDown, FiMinus, FiFileText, FiZap, FiTarget, 
  FiDollarSign, FiPieChart, FiDatabase, FiCreditCard, FiMail, FiWifi, FiEye,
  FiUserCheck, FiRefreshCw, FiFilter, FiSearch, FiPlus, FiEdit, FiTrash, FiClock,
  FiGlobe, FiShield, FiTool, FiBell, FiHeart, FiServer, FiMonitor, FiCpu
} from 'react-icons/fi';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
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

  // Mock data for development and demonstration
  const mockDashboardData = {
    returns: {
      day: { return: 2.5, accuracy: 78.5 },
      historical: { return: 145.8, accuracy: 82.3, period: '90 dias' }
    },
    pendingRefunds: [],
    pendingSettlements: [],
    totalUsers: 1247,
    activeOperations: 15,
    totalVolume: 2847392.50
  };

  const mockMarketReading = {
    direction: 'LONG' as const,
    confidence: 85,
    ai_justification: 'Análise técnica indica rompimento de resistência em BTC com volume crescente. Indicadores RSI e MACD confluem para movimento de alta.',
    day_tracking: 'Bitcoin mantém força acima de $65,000. Altcoins seguem movimento. Volume institucional crescente.',
    created_at: new Date().toISOString()
  };

  const mockOperations: Operation[] = [
    {
      id: '1',
      symbol: 'BTC/USDT',
      entry_price: 64500,
      current_price: 66200,
      exchange: 'Binance',
      is_testnet: false,
      side: 'LONG',
      opened_at: new Date().toISOString(),
      return_percentage: 2.63
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      entry_price: 3200,
      current_price: 3150,
      exchange: 'Binance',
      is_testnet: false,
      side: 'LONG',
      opened_at: new Date().toISOString(),
      return_percentage: -1.56
    }
  ];

  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'REGISTRATION',
      description: 'Novo usuário registrado no sistema',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      user: 'sistema'
    },
    {
      id: '2',
      type: 'OPERATION',
      description: 'Operação LONG executada em BTC/USDT',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user: 'trading-bot'
    },
    {
      id: '3',
      type: 'SIGNAL',
      description: 'Sinal TradingView processado com sucesso',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: 'webhook'
    }
  ];

  const mockSignals: Signal[] = [
    {
      id: '1',
      source: 'TRADINGVIEW',
      symbol: 'BTC/USDT',
      type: 'BUY',
      price: 66200,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      source: 'COINTARS',
      symbol: 'ETH/USDT',
      type: 'ANALYSIS',
      price: 3150,
      created_at: new Date().toISOString(),
      indicator: 'RSI Oversold',
      data: { rsi: 28, macd: 'bullish_divergence' }
    }
  ];

  const mockSystemStatus = {
    api: 'online' as const,
    database: 'online' as const,
    payments: 'online' as const,
    email: 'online' as const
  };

  // Fetch data from backend (currently using mock data)
  const { data: dashboardData, error: dashboardError } = useSWR('/api/admin/dashboard', fetchAdminMetrics);
  const { data: marketReading, error: marketError } = useSWR('/api/admin/market-reading', fetchAdminMetrics);
  const { data: systemStatus, error: statusError } = useSWR('/api/admin/system-status', fetchAdminMetrics);
  const { data: operations, error: operationsError } = useSWR('/api/admin/operations', fetchAdminMetrics);
  const { data: signals, error: signalsError } = useSWR('/api/admin/signals', fetchAdminMetrics);
  const { data: recentActivities, error: activitiesError } = useSWR('/api/admin/activities', fetchRecentActivities);
  const { data: alerts, error: alertsError } = useSWR('/api/admin/alerts', fetchSystemAlerts);

  // Use mock data if API data is not available
  const currentDashboard = dashboardData?.data || mockDashboardData;
  const currentMarketReading = marketReading?.data || mockMarketReading;
  const currentOperations = operations?.data || mockOperations;
  const currentActivities = recentActivities?.data || mockActivities;
  const currentSignals = signals?.data || mockSignals;
  const currentSystemStatus = systemStatus?.data || mockSystemStatus;
  
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
    <AdminLayout 
      title="Dashboard Administrativo" 
      description="Painel de controle e métricas do sistema"
      currentPage="dashboard"
    >
      {/* Header com informações em tempo real */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-8 rounded-lg mx-4 sm:mx-6 lg:mx-8">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
              <p className="mt-2 text-blue-100">
                Sistema em tempo real • Última atualização: {currentTime}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors">
                <FiRefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* Métricas Principais com Design Moderno */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiTrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Retorno % Dia</dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900">
                        +2.5%
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <FiTrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiBarChart2 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Retorno % Histórico</dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900">
                        +145.8%
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        90d
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiTarget className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Assertividade % Dia</dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900">
                        78.5%
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-purple-600">
                        <FiTarget className="self-center flex-shrink-0 h-4 w-4" />
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiZap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Assertividade % Histórica</dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900">
                        82.3%
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-indigo-600">
                        <FiZap className="self-center flex-shrink-0 h-4 w-4" />
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* Leitura do Mercado */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 mb-8">
              <div className="px-8 py-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Leitura do Mercado IA</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500 font-medium">Tempo Real</span>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <span className={`inline-flex items-center px-6 py-3 rounded-full text-xl font-bold ${getMarketDirectionColor(currentMarketReading.direction)}`}>
                        {currentMarketReading.direction === 'LONG' && <FiTrendingUp className="mr-3 h-6 w-6" />}
                        {currentMarketReading.direction === 'SHORT' && <FiTrendingDown className="mr-3 h-6 w-6" />}
                        {currentMarketReading.direction === 'NEUTRO' && <FiMinus className="mr-3 h-6 w-6" />}
                        {currentMarketReading.direction}
                      </span>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">{currentMarketReading.confidence}%</div>
                        <div className="text-sm text-gray-500 font-medium">Confiança</div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(currentMarketReading.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                      <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <FiZap className="mr-3 h-6 w-6 text-blue-600" />
                        Justificativa da IA
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-lg">{currentMarketReading.ai_justification}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                      <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <FiActivity className="mr-3 h-6 w-6 text-green-600" />
                        Acompanhamento do Dia
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-lg">{currentMarketReading.day_tracking}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Operações em Andamento */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="px-8 py-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Operações em Andamento</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                      Ver Todas
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {currentOperations.map((operation: Operation) => (
                      <div key={operation.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-center space-x-6">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                            operation.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {operation.side}
                          </span>
                          <div>
                            <p className="text-xl font-bold text-gray-900">{operation.symbol}</p>
                            <p className="text-sm text-gray-500 font-medium">
                              {operation.exchange} {operation.is_testnet && '(Testnet)'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(operation.current_price)}
                          </p>
                          <p className={`text-sm font-bold ${operation.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(operation.return_percentage)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Atividades Recentes */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="px-8 py-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Atividades Recentes</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                      Ver Histórico
                    </button>
                  </div>
                  
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {currentActivities.map((activity: RecentActivity, index: number) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {index !== currentActivities.length - 1 && (
                              <span className="absolute top-6 left-6 -ml-px h-full w-0.5 bg-gray-200" />
                            )}
                            <div className="relative flex space-x-6">
                              <div>
                                <span className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-8 ring-white shadow-lg">
                                  <FiActivity className="h-6 w-6 text-white" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-lg text-gray-600 font-semibold">{activity.description}</p>
                                  {activity.user && (
                                    <p className="text-sm text-gray-400">por {activity.user}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500 font-medium">
                                  {new Date(activity.timestamp).toLocaleString('pt-BR')}
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
            </div>

            {/* Sinais e Status do Sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Sinais TradingView */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="px-8 py-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                      <FiBarChart2 className="h-5 w-5 text-white" />
                    </div>
                    TradingView
                  </h3>
                  
                  <div className="space-y-4">
                    {currentSignals.filter((s: Signal) => s.source === 'TRADINGVIEW').map((signal: Signal) => (
                      <div key={signal.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{signal.symbol}</p>
                          <p className="text-sm text-gray-500">{signal.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(signal.price)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(signal.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sinais CoinStars */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="px-8 py-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4">
                      <FiZap className="h-5 w-5 text-white" />
                    </div>
                    CoinStars
                  </h3>
                  
                  <div className="space-y-4">
                    {currentSignals.filter((s: Signal) => s.source === 'COINTARS').map((signal: Signal) => (
                      <div key={signal.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{signal.indicator || signal.symbol}</p>
                          <p className="text-sm text-gray-500">Dados: {JSON.stringify(signal.data)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(signal.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status do Sistema */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="px-8 py-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                      <FiServer className="h-5 w-5 text-white" />
                    </div>
                    Sistema
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FiWifi className="h-6 w-6 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-900">API Status</span>
                      </div>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getSystemStatusColor(currentSystemStatus.api)}`}>
                        {currentSystemStatus.api}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FiDatabase className="h-6 w-6 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-900">Database</span>
                      </div>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getSystemStatusColor(currentSystemStatus.database)}`}>
                        {currentSystemStatus.database}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FiCreditCard className="h-6 w-6 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-900">Payments</span>
                      </div>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getSystemStatusColor(currentSystemStatus.payments)}`}>
                        {currentSystemStatus.payments}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FiMail className="h-6 w-6 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-900">E-mail</span>
                      </div>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getSystemStatusColor(currentSystemStatus.email)}`}>
                        {currentSystemStatus.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solicitações Pendentes */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-8 py-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Solicitações Pendentes</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div>
                    <h4 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                      <FiCreditCard className="mr-3 h-6 w-6 text-yellow-600" />
                      Reembolsos de Usuário
                    </h4>
                    <div className="space-y-4">
                      {currentDashboard.pendingRefunds && currentDashboard.pendingRefunds.length > 0 ? 
                        currentDashboard.pendingRefunds.map((refund: RefundRequest) => (
                          <div key={refund.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <span className="text-lg font-semibold text-gray-900">{refund.user_name}</span>
                            <span className="text-lg font-bold text-yellow-800">
                              {formatCurrency(refund.amount_requested, refund.currency)}
                            </span>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                            <p className="text-lg text-gray-500 mt-4 font-medium">Nenhuma solicitação pendente</p>
                          </div>
                        )
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                      <FiUsers className="mr-3 h-6 w-6 text-blue-600" />
                      Acertos com Afiliados
                    </h4>
                    <div className="space-y-4">
                      {currentDashboard.pendingSettlements && currentDashboard.pendingSettlements.length > 0 ? 
                        currentDashboard.pendingSettlements.map((settlement: AffiliateSettlement) => (
                          <div key={settlement.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <span className="text-lg font-semibold text-gray-900">{settlement.affiliate_name}</span>
                            <span className="text-lg font-bold text-blue-800">
                              {formatCurrency(settlement.total_due, settlement.currency)}
                            </span>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                            <p className="text-lg text-gray-500 mt-4 font-medium">Nenhum acerto pendente</p>
                          </div>
                        )
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      );
    }
