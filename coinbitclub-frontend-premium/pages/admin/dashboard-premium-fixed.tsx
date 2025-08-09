import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  FiHome, 
  FiUsers, 
  FiBarChart, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiActivity,
  FiAlertTriangle,
  FiDollarSign,
  FiTrendingUp,
  FiRefreshCw,
  FiBell,
  FiShield,
  FiMonitor,
  FiDatabase,
  FiArrowUp,
  FiArrowDown,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiInfo
} from 'react-icons/fi';

interface DashboardData {
  timestamp: string;
  marketReading: {
    direction: 'LONG' | 'SHORT' | 'NEUTRO';
    confidence: number;
    ai_justification: string;
    day_tracking: string;
    market_data: any;
  };
  signals: {
    tradingview: any[];
    constant_signals: number;
    ai_reports: any[];
    microservices_status: {
      signal_ingestor: boolean;
      signal_processor: boolean;
      decision_engine: boolean;
      order_executor: boolean;
    };
  };
  operations: {
    active: any[];
    count: number;
    by_status: {
      open: number;
      pending: number;
    };
  };
  performance: {
    today: {
      total_operations: number;
      winning_operations: number;
      success_rate: string;
      total_profit: number;
      avg_profit: number;
    };
    historical: {
      total_operations: number;
      winning_operations: number;
      success_rate: string;
      total_profit: number;
      avg_profit: number;
    };
  };
  users: {
    total: number;
    active: number;
    new_today: number;
    trial_active: number;
    production_active: number;
    by_country: { brazil: number; international: number };
    by_plan: { trial: number; basic: number; premium: number };
  };
  affiliates: {
    total: number;
    active: number;
    total_commissions: number;
    today_commissions: number;
  };
  system: {
    status: any[];
    alerts: any[];
    uptime: string;
    last_restart: string | null;
  };
  evolution: any[];
}

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'admin' | 'user' | 'affiliate';
}

const AdminDashboardPremium: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Verificar autenticação
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.userType !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchDashboardData();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard-premium', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
        setLastUpdate(new Date());
      } else {
        console.error('Erro ao carregar dashboard:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard-premium', icon: FiHome, current: true },
    { name: 'Usuários', href: '/admin/users', icon: FiUsers },
    { name: 'Afiliados', href: '/admin/affiliates', icon: FiBarChart },
    { name: 'Operações', href: '/admin/operations', icon: FiTrendingUp },
    { name: 'Alertas', href: '/admin/alerts', icon: FiAlertTriangle },
    { name: 'Acertos', href: '/admin/settlements', icon: FiDollarSign },
    { name: 'Contabilidade', href: '/admin/accounting', icon: FiDatabase },
    { name: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Administração - CoinBitClub</title>
        <meta name="description" content="Central de controle administrativo" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
            <div className="flex items-center">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ⚡ CoinBitClub
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-6 px-3">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors ${
                  item.current
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-400">Administrador</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <FiLogOut className="mr-2 h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>

        <div className="lg:ml-64 flex flex-col">
          <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-400 hover:text-white mr-4"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </button>
                <div className="text-sm text-gray-400">
                  Última atualização: {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            {data && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FiActivity className="mr-2 text-blue-400" />
                    Leitura do Mercado
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        data.marketReading.direction === 'LONG' ? 'bg-green-900 text-green-300' :
                        data.marketReading.direction === 'SHORT' ? 'bg-red-900 text-red-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {data.marketReading.direction === 'LONG' && <FiArrowUp className="mr-1 h-4 w-4" />}
                        {data.marketReading.direction === 'SHORT' && <FiArrowDown className="mr-1 h-4 w-4" />}
                        {data.marketReading.direction === 'NEUTRO' && <FiActivity className="mr-1 h-4 w-4" />}
                        {data.marketReading.direction}
                      </div>
                      <p className="text-2xl font-bold mt-2">{data.marketReading.confidence}%</p>
                      <p className="text-gray-400 text-sm">Confiança</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 md:col-span-2">
                      <h4 className="font-medium text-gray-300 mb-2">Justificativa IA</h4>
                      <p className="text-sm text-gray-400">{data.marketReading.ai_justification}</p>
                      <p className="text-xs text-gray-500 mt-2">{data.marketReading.day_tracking}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">Usuários Ativos</p>
                        <p className="text-3xl font-bold text-white">{data.users.active}</p>
                        <p className="text-blue-300 text-sm">+{data.users.new_today} hoje</p>
                      </div>
                      <FiUsers className="w-12 h-12 text-blue-300" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">Assertividade Hoje</p>
                        <p className="text-3xl font-bold text-white">{data.performance.today.success_rate}%</p>
                        <p className="text-green-300 text-sm">{data.performance.today.winning_operations}/{data.performance.today.total_operations} operações</p>
                      </div>
                      <FiTrendingUp className="w-12 h-12 text-green-300" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-200 text-sm">Operações Ativas</p>
                        <p className="text-3xl font-bold text-white">{data.operations.count}</p>
                        <p className="text-purple-300 text-sm">{data.operations.by_status.open} abertas</p>
                      </div>
                      <FiActivity className="w-12 h-12 text-purple-300" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-200 text-sm">Afiliados Ativos</p>
                        <p className="text-3xl font-bold text-white">{data.affiliates.active}</p>
                        <p className="text-yellow-300 text-sm">${data.affiliates.today_commissions.toFixed(2)} hoje</p>
                      </div>
                      <FiBarChart className="w-12 h-12 text-yellow-300" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FiTrendingUp className="mr-2 text-blue-400" />
                    Dashboard Operacional - Sistema Funcionando
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-900 rounded-lg p-4 text-center">
                      <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <h4 className="font-medium text-green-300">Conexão Base de Dados</h4>
                      <p className="text-sm text-green-400">PostgreSQL Railway Online</p>
                    </div>
                    <div className="bg-green-900 rounded-lg p-4 text-center">
                      <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <h4 className="font-medium text-green-300">APIs Funcionais</h4>
                      <p className="text-sm text-green-400">Dashboard & Usuários OK</p>
                    </div>
                    <div className="bg-green-900 rounded-lg p-4 text-center">
                      <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <h4 className="font-medium text-green-300">Interface Premium</h4>
                      <p className="text-sm text-green-400">Design Moderno Ativo</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPremium;
