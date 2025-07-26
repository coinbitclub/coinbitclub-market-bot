import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiActivity, FiDollarSign, FiTrendingUp, FiRefreshCw, FiEye,
  FiUser, FiShield, FiZap, FiTarget, FiArrowUp, FiArrowDown,
  FiCreditCard, FiWifi, FiCalendar, FiPercent, FiBell
} from 'react-icons/fi';

interface UserDashboardData {
  user: {
    name: string;
    email: string;
    profile: 'usuario';
    plan: {
      name: string;
      type: 'BRASIL_PRO' | 'BRASIL_FLEX' | 'GLOBAL_PRO' | 'GLOBAL_FLEX';
      commission_rate: number;
      monthly_fee: number;
      currency: 'BRL' | 'USD';
    };
    validation_status: boolean;
  };
  performance: {
    accuracy_rate: number;
    daily_return: number;
    lifetime_return: number;
  };
  balances: {
    binance_balance: number;
    bybit_balance: number;
    prepaid_balance: number;
    currency: 'BRL' | 'USD';
  };
  ai_reading: {
    market_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    fear_greed_index: number;
    recommendation: string;
    last_update: string;
  };
  active_operations: number;
}

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          window.location.href = '/auth/login';
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'usuario') {
          window.location.href = '/auth/login';
          return;
        }

        setUser(parsedUser);
        await fetchDashboardData();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/auth/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/login';
  };

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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiShield className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <p className="text-red-400 text-2xl font-bold mb-2">Erro ao carregar dados</p>
          <p className="text-blue-400 text-lg">Tente novamente em alguns minutos</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | CoinBitClub</title>
        <meta name="description" content="Dashboard do Usuário - CoinBitClub" />
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/user/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="/user/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
              
              <div className="border-t border-yellow-400/30 pt-4 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-6 py-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 border-2 border-transparent hover:border-red-400/50 rounded-xl transition-all duration-300 font-medium"
                >
                  <FiLogOut className="w-6 h-6 mr-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </nav>
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
                <h2 className="text-2xl font-bold text-yellow-400">Dashboard</h2>
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-blue-400 text-sm">Olá, {dashboardData.user.name}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${dashboardData.user.validation_status ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                    {dashboardData.user.validation_status ? 'Validado' : 'Pendente Validação'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-green-400 font-bold">Índice de Acerto</h3>
                  <FiTarget className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-yellow-400">{dashboardData.performance.accuracy_rate.toFixed(1)}%</p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-blue-400 font-bold">Retorno do Dia</h3>
                  <FiArrowUp className="w-6 h-6 text-blue-400" />
                </div>
                <p className={`text-3xl font-bold ${dashboardData.performance.daily_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dashboardData.performance.daily_return >= 0 ? '+' : ''}{dashboardData.performance.daily_return.toFixed(2)}%
                </p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-purple-400 font-bold">Retorno Histórico</h3>
                  <FiTrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <p className={`text-3xl font-bold ${dashboardData.performance.lifetime_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dashboardData.performance.lifetime_return >= 0 ? '+' : ''}{dashboardData.performance.lifetime_return.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-yellow-400 font-bold">Saldo Binance</h3>
                  <FiDollarSign className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {dashboardData.balances.binance_balance.toFixed(2)} {dashboardData.balances.currency}
                </p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-orange-400 font-bold">Saldo Bybit</h3>
                  <FiDollarSign className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {dashboardData.balances.bybit_balance.toFixed(2)} {dashboardData.balances.currency}
                </p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-pink-400 font-bold">Saldo Pré-pago</h3>
                  <FiCreditCard className="w-6 h-6 text-pink-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {dashboardData.balances.prepaid_balance.toFixed(2)} {dashboardData.balances.currency}
                </p>
              </div>
            </div>

            {/* AI Reading & Plan Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* AI Reading */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-cyan-400 font-bold text-lg">Leitura Atual da IA</h3>
                  <FiZap className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Direção do Mercado:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      dashboardData.ai_reading.market_direction === 'BULLISH' ? 'bg-green-400/20 text-green-400' :
                      dashboardData.ai_reading.market_direction === 'BEARISH' ? 'bg-red-400/20 text-red-400' :
                      'bg-yellow-400/20 text-yellow-400'
                    }`}>
                      {dashboardData.ai_reading.market_direction}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Fear & Greed Index:</span>
                    <span className="text-yellow-400 font-bold">{dashboardData.ai_reading.fear_greed_index}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-white text-sm">{dashboardData.ai_reading.recommendation}</p>
                  </div>
                  <div className="text-xs text-blue-400 mt-2">
                    Última atualização: {new Date(dashboardData.ai_reading.last_update).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Plan Info */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-indigo-400/50 shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-indigo-400 font-bold text-lg">Plano Ativo</h3>
                  <FiShield className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Plano:</span>
                    <span className="text-yellow-400 font-bold">{dashboardData.user.plan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Comissão:</span>
                    <span className="text-white font-bold">{dashboardData.user.plan.commission_rate}%</span>
                  </div>
                  {dashboardData.user.plan.monthly_fee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400">Taxa Mensal:</span>
                      <span className="text-white font-bold">
                        {dashboardData.user.plan.monthly_fee} {dashboardData.user.plan.currency}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Operações Ativas:</span>
                    <span className="text-green-400 font-bold">{dashboardData.active_operations}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center justify-center px-6 py-4 text-green-400 hover:text-white bg-green-400/20 hover:bg-green-400/30 border-2 border-green-400/50 hover:border-green-400/70 rounded-lg transition-all duration-300 font-bold">
                <FiUsers className="w-5 h-5 mr-2" />
                <span>Tornar-se Afiliado</span>
              </button>
              
              <button className="flex items-center justify-center px-6 py-4 text-blue-400 hover:text-white bg-blue-400/20 hover:bg-blue-400/30 border-2 border-blue-400/50 hover:border-blue-400/70 rounded-lg transition-all duration-300 font-bold">
                <FiUser className="w-5 h-5 mr-2" />
                <span>Editar Dados</span>
              </button>
              
              <button className="flex items-center justify-center px-6 py-4 text-yellow-400 hover:text-black bg-yellow-400/20 hover:bg-yellow-400 border-2 border-yellow-400/50 hover:border-yellow-400 rounded-lg transition-all duration-300 font-bold">
                <FiDollarSign className="w-5 h-5 mr-2" />
                <span>Solicitar Saque</span>
              </button>
              
              <button className="flex items-center justify-center px-6 py-4 text-purple-400 hover:text-white bg-purple-400/20 hover:bg-purple-400/30 border-2 border-purple-400/50 hover:border-purple-400/70 rounded-lg transition-all duration-300 font-bold">
                <FiEye className="w-5 h-5 mr-2" />
                <span>Ver Operações</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Dashboard - CoinBitClub ⚡</p>
              <p className="text-blue-300">Plataforma de Trading Inteligente com IA</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
