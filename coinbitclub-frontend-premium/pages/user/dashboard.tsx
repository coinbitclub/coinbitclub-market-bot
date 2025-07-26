import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiBarChart, FiSettings, FiMenu, FiX, FiActivity,
  FiDollarSign, FiTrendingUp, FiRefreshCw, FiZap, FiShield,
  FiClock, FiCheckCircle, FiAlertTriangle, FiEye, FiCreditCard
} from 'react-icons/fi';

interface AIReport {
  id: string;
  timestamp: string;
  market_sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence_score: number;
  key_insights: string[];
  recommended_actions: string[];
  risk_level: 'low' | 'medium' | 'high';
}

interface PerformanceMetrics {
  daily_accuracy: number;
  historical_accuracy: number;
  total_operations: number;
  successful_operations: number;
  avg_profit_per_trade: number;
  sharpe_ratio: number;
}

interface ReturnData {
  period: string;
  percentage: number;
  absolute_value: number;
  comparison_benchmark: number;
}

interface ExchangeBalance {
  exchange: 'binance' | 'bybit';
  status: 'connected' | 'disconnected' | 'error';
  balances: {
    total_usd: number;
    available_usd: number;
    in_orders_usd: number;
    last_updated: string;
  };
}

interface Operation {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  entry_price: number;
  current_price?: number;
  pnl: number;
  pnl_percentage: number;
  start_time: string;
}

interface DashboardData {
  ai_report: AIReport;
  performance: PerformanceMetrics;
  returns: ReturnData[];
  exchange_balances: ExchangeBalance[];
  prepaid_balance: {
    current_balance: number;
    currency: string;
    last_recharge: string;
    auto_recharge_enabled: boolean;
  };
  active_operations: Operation[];
  warnings: {
    low_balance: boolean;
    api_failures: string[];
    system_maintenance: boolean;
  };
  user: {
    name: string;
    country: string;
    plan_type: string;
    account_type: string;
  };
}

export default function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReturnPeriod, setSelectedReturnPeriod] = useState('30d');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/dashboard');
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Erro ao buscar dados do dashboard');
        setDashboardData(getMockData());
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setDashboardData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): DashboardData => ({
    ai_report: {
      id: '1',
      timestamp: '2024-07-25T12:00:00Z',
      market_sentiment: 'bullish',
      confidence_score: 8.7,
      key_insights: [
        'Bitcoin mostra forte resistência acima de $43,000',
        'Volume de negociação aumentou 23% nas últimas 4 horas',
        'Indicadores técnicos sugerem continuação da tendência de alta',
        'Correlação com mercado de ações permanece baixa'
      ],
      recommended_actions: [
        'Manter posições LONG em BTC e ETH',
        'Considerar entrada em MATIC devido ao breakout',
        'Aguardar pullback em SOL antes de nova entrada',
        'Monitorar resistência em $44,200 no Bitcoin'
      ],
      risk_level: 'medium'
    },
    performance: {
      daily_accuracy: 87.5,
      historical_accuracy: 84.2,
      total_operations: 1247,
      successful_operations: 1050,
      avg_profit_per_trade: 2.34,
      sharpe_ratio: 1.89
    },
    returns: [
      { period: '7d', percentage: 5.7, absolute_value: 1247.80, comparison_benchmark: 2.1 },
      { period: '30d', percentage: 18.3, absolute_value: 4890.50, comparison_benchmark: 8.7 },
      { period: '90d', percentage: 47.2, absolute_value: 12450.30, comparison_benchmark: 15.4 }
    ],
    exchange_balances: [
      {
        exchange: 'binance',
        status: 'connected',
        balances: {
          total_usd: 25847.65,
          available_usd: 18200.40,
          in_orders_usd: 7647.25,
          last_updated: '2024-07-25T11:58:00Z'
        }
      },
      {
        exchange: 'bybit',
        status: 'connected',
        balances: {
          total_usd: 15200.80,
          available_usd: 12100.60,
          in_orders_usd: 3100.20,
          last_updated: '2024-07-25T11:59:00Z'
        }
      }
    ],
    prepaid_balance: {
      current_balance: 850.75,
      currency: 'BRL',
      last_recharge: '2024-07-20T10:30:00Z',
      auto_recharge_enabled: true
    },
    active_operations: [
      {
        id: '1',
        symbol: 'BTCUSDT',
        side: 'LONG',
        status: 'RUNNING',
        entry_price: 43250.75,
        current_price: 43890.20,
        pnl: 319.73,
        pnl_percentage: 1.48,
        start_time: '2024-07-25T08:30:00Z'
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        side: 'LONG',
        status: 'RUNNING',
        entry_price: 2680.50,
        current_price: 2745.30,
        pnl: 129.60,
        pnl_percentage: 2.42,
        start_time: '2024-07-25T07:15:00Z'
      }
    ],
    warnings: {
      low_balance: false,
      api_failures: [],
      system_maintenance: false
    },
    user: {
      name: 'João Silva',
      country: 'BR',
      plan_type: 'premium',
      account_type: 'production'
    }
  });

  const getCurrency = () => {
    return dashboardData?.user.country === 'BR' ? 'R$' : '$';
  };

  const formatCurrency = (value: number) => {
    const currency = getCurrency();
    return `${currency} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/20';
      case 'neutral': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const data = dashboardData || getMockData();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | CoinBitClub</title>
        <meta name="description" content="Dashboard completo do usuário - CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64`}>
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
            <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-yellow-400 hover:text-pink-400"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-3">
              <a href="/user/dashboard" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/user/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiCreditCard className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="/user/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 border border-yellow-400/30 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-400">
                <FiShield className="w-4 h-4 mr-2 text-pink-400" />
                {data.user.name}
              </div>
              <p className="text-xs text-blue-400 mt-1">
                {data.user.plan_type} • {data.user.account_type}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:w-0">
          {/* Header */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400">Dashboard</h2>
                  <p className="text-blue-400 text-sm">
                    Bem-vindo de volta, {data.user.name}!
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-black min-h-screen">
            {/* Avisos e Alertas */}
            {(data.warnings.low_balance || data.warnings.api_failures.length > 0 || data.warnings.system_maintenance) && (
              <div className="mb-8 space-y-4">
                {data.warnings.low_balance && (
                  <div className="bg-yellow-400/10 border border-yellow-400/50 rounded-xl p-4">
                    <div className="flex items-center">
                      <FiAlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                      <p className="text-yellow-400 font-medium">
                        Saldo baixo detectado. Considere fazer uma recarga para manter as operações ativas.
                      </p>
                    </div>
                  </div>
                )}
                
                {data.warnings.api_failures.length > 0 && (
                  <div className="bg-red-400/10 border border-red-400/50 rounded-xl p-4">
                    <div className="flex items-center">
                      <FiAlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                      <p className="text-red-400 font-medium">
                        Falhas de API detectadas: {data.warnings.api_failures.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Relatório AI (4 horas) */}
            <div className="mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                    <FiZap className="w-6 h-6 mr-3" />
                    Relatório AI - Últimas 4 Horas
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(data.ai_report.market_sentiment)}`}>
                      {data.ai_report.market_sentiment === 'bullish' ? 'Otimista' : 
                       data.ai_report.market_sentiment === 'bearish' ? 'Pessimista' : 'Neutro'}
                    </span>
                    <span className="text-blue-400 text-sm">
                      Confiança: {data.ai_report.confidence_score}/10
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-blue-400 font-bold mb-3">🔍 Insights Principais</h4>
                    <ul className="space-y-2">
                      {data.ai_report.key_insights.map((insight, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <span className="text-blue-300 text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-green-400 font-bold mb-3">💡 Ações Recomendadas</h4>
                    <ul className="space-y-2">
                      {data.ai_report.recommended_actions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-400 mr-2">→</span>
                          <span className="text-blue-300 text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-yellow-400/20 flex items-center justify-between">
                  <span className="text-blue-300 text-sm">
                    Nível de Risco: <span className={`font-bold ${getRiskColor(data.ai_report.risk_level)}`}>
                      {data.ai_report.risk_level === 'low' ? 'Baixo' : 
                       data.ai_report.risk_level === 'medium' ? 'Médio' : 'Alto'}
                    </span>
                  </span>
                  <span className="text-gray-400 text-xs">
                    Atualizado: {new Date(data.ai_report.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Métricas de Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiTrendingUp className="w-8 h-8 text-green-400" />
                  <span className="text-xs text-green-300 bg-green-400/20 px-2 py-1 rounded-full">
                    Diário
                  </span>
                </div>
                <p className="text-green-300 text-sm mb-1">Precisão Diária</p>
                <p className="text-3xl font-bold text-green-400">{data.performance.daily_accuracy}%</p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiBarChart className="w-8 h-8 text-blue-400" />
                  <span className="text-xs text-blue-300 bg-blue-400/20 px-2 py-1 rounded-full">
                    Histórico
                  </span>
                </div>
                <p className="text-blue-300 text-sm mb-1">Precisão Histórica</p>
                <p className="text-3xl font-bold text-blue-400">{data.performance.historical_accuracy}%</p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiDollarSign className="w-8 h-8 text-purple-400" />
                  <span className="text-xs text-purple-300 bg-purple-400/20 px-2 py-1 rounded-full">
                    Média
                  </span>
                </div>
                <p className="text-purple-300 text-sm mb-1">Lucro por Trade</p>
                <p className="text-3xl font-bold text-purple-400">{data.performance.avg_profit_per_trade}%</p>
              </div>
            </div>

            {/* Percentual de Retorno */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                  <FiTrendingUp className="w-6 h-6 mr-3" />
                  Percentual de Retorno
                </h3>
                <select
                  value={selectedReturnPeriod}
                  onChange={(e) => setSelectedReturnPeriod(e.target.value)}
                  className="px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                >
                  <option value="7d">7 dias</option>
                  <option value="30d">30 dias</option>
                  <option value="90d">90 dias</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.returns.map((returnData) => (
                  <div key={returnData.period} className={`bg-black/50 rounded-lg p-4 border ${returnData.period === selectedReturnPeriod ? 'border-yellow-400/50' : 'border-blue-400/30'}`}>
                    <div className="text-center">
                      <p className="text-blue-300 text-sm mb-2">{returnData.period}</p>
                      <p className={`text-2xl font-bold mb-2 ${returnData.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {returnData.percentage > 0 ? '+' : ''}{returnData.percentage}%
                      </p>
                      <p className="text-blue-400 text-sm mb-1">
                        {formatCurrency(returnData.absolute_value)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        vs Benchmark: {returnData.comparison_benchmark > 0 ? '+' : ''}{returnData.comparison_benchmark}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saldos das Exchanges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {data.exchange_balances.map((exchange) => (
                <div key={exchange.exchange} className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-yellow-400 capitalize">
                      {exchange.exchange}
                    </h3>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                      exchange.status === 'connected' ? 'bg-green-400/20 text-green-400' :
                      exchange.status === 'disconnected' ? 'bg-gray-400/20 text-gray-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        exchange.status === 'connected' ? 'bg-green-400' :
                        exchange.status === 'disconnected' ? 'bg-gray-400' :
                        'bg-red-400'
                      }`}></div>
                      {exchange.status === 'connected' ? 'Conectado' :
                       exchange.status === 'disconnected' ? 'Desconectado' : 'Erro'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-300">Total:</span>
                      <span className="text-blue-400 font-bold">
                        ${exchange.balances.total_usd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300">Disponível:</span>
                      <span className="text-green-400 font-bold">
                        ${exchange.balances.available_usd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-300">Em Ordens:</span>
                      <span className="text-yellow-400 font-bold">
                        ${exchange.balances.in_orders_usd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-yellow-400/20">
                    <p className="text-gray-400 text-xs">
                      Última atualização: {new Date(exchange.balances.last_updated).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Saldo Pré-pago */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                  <FiCreditCard className="w-6 h-6 mr-3" />
                  Saldo Pré-pago
                </h3>
                <button className="px-4 py-2 bg-green-400/20 text-green-400 border border-green-400/50 rounded-lg hover:bg-green-400/30 transition-colors">
                  Recarregar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-blue-300 text-sm mb-2">Saldo Atual</p>
                  <p className="text-3xl font-bold text-green-400">
                    {data.prepaid_balance.currency === 'BRL' ? 'R$' : '$'} {data.prepaid_balance.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-blue-300 text-sm mb-2">Última Recarga</p>
                  <p className="text-lg text-blue-400">
                    {new Date(data.prepaid_balance.last_recharge).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-blue-300 text-sm mb-2">Recarga Automática</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    data.prepaid_balance.auto_recharge_enabled 
                      ? 'bg-green-400/20 text-green-400' 
                      : 'bg-gray-400/20 text-gray-400'
                  }`}>
                    <FiCheckCircle className="w-4 h-4 mr-2" />
                    {data.prepaid_balance.auto_recharge_enabled ? 'Ativada' : 'Desativada'}
                  </div>
                </div>
              </div>
            </div>

            {/* Operações Ativas */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                  <FiActivity className="w-6 h-6 mr-3" />
                  Operações em Tempo Real
                </h3>
                <a 
                  href="/user/operations"
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-blue-400/10 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiEye className="w-4 h-4 mr-2" />
                  Ver Todas
                </a>
              </div>

              <div className="space-y-4">
                {data.active_operations.map((operation) => (
                  <div key={operation.id} className="bg-black/50 rounded-lg p-4 border border-blue-400/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-blue-400 font-bold">{operation.symbol}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            operation.side === 'LONG' 
                              ? 'bg-green-400/20 text-green-400' 
                              : 'bg-red-400/20 text-red-400'
                          }`}>
                            {operation.side}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-blue-300 text-sm">Entrada: ${operation.entry_price.toLocaleString()}</p>
                          <p className="text-blue-300 text-sm">Atual: ${operation.current_price?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-bold ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {operation.pnl >= 0 ? '+' : ''}${operation.pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm ${operation.pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {operation.pnl >= 0 ? '+' : ''}{operation.pnl_percentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-blue-400/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          Iniciado: {new Date(operation.start_time).toLocaleTimeString('pt-BR')}
                        </span>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-yellow-400">
                            {Math.floor((Date.now() - new Date(operation.start_time).getTime()) / (1000 * 60))} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data.active_operations.length === 0 && (
                <div className="text-center py-8">
                  <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma operação ativa no momento</p>
                  <p className="text-gray-500 text-sm mt-2">As operações aparecerão aqui quando iniciadas</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
