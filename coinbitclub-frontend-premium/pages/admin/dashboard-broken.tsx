import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { 
  FiHome, 
  FiUsers, 
  FiActivity, 
  FiTrendingUp, 
  FiDollarSign,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiUserCheck,
  FiBarChart3
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  user_type: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOperations: number;
  totalVolume: number;
  totalProfit: number;
  monthlyGrowth: number;
}

interface SystemMetrics {
  serverStatus: string;
  apiResponseTime: number;
  tradingBotStatus: string;
  lastUpdate: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = localStorage.getItem('user_data');
      const authToken = localStorage.getItem('auth_token');

      if (!userData || !authToken) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      
      if (parsedUser.role?.toLowerCase() !== 'admin') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
        router.push('/dashboard');
        return;
      }

      setUser(parsedUser);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Carregar estatísticas do dashboard
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
        setSystemMetrics(data.metrics);
      } else {
        // Dados de fallback para desenvolvimento
        setDashboardStats({
          totalUsers: 1247,
          activeUsers: 89,
          totalOperations: 5632,
          totalVolume: 2850000,
          totalProfit: 142500,
          monthlyGrowth: 12.5
        });
        
        setSystemMetrics({
          serverStatus: 'Online',
          apiResponseTime: 45,
          tradingBotStatus: 'Ativo',
          lastUpdate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };
      const totalVolume = operationsData
        .reduce((sum, op) => sum + (op.amount || 0), 0);
      const pendingOperations = operationsData.filter(op => op.status === 'pending').length;

      setStats({
        totalUsers: usersData.length,
        totalOperations: operationsData.length,
        totalProfit,
        totalVolume,
        activeUsers,
        pendingOperations
      });

    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PremiumLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Carregando dados administrativos...</p>
          </div>
        </div>
      </PremiumLayout>
    );
  }

  return (
    <PremiumLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              Painel Administrativo Premium
            </h1>
            <p className="text-gray-400 mt-2">
              Olá, {user?.name || 'Administrador'}! Controle total da plataforma.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={loadAdminData}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              🔄 Atualizar Dados
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl">
                👥
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Usuários</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-gray-400 text-sm">Usuários Ativos</p>
                <p className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
                🔄
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Operações</p>
                <p className="text-2xl font-bold text-white">{stats.totalOperations.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                ⏳
              </div>
              <div>
                <p className="text-gray-400 text-sm">Operações Pendentes</p>
                <p className="text-2xl font-bold text-white">{stats.pendingOperations.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl">
                💰
              </div>
              <div>
                <p className="text-gray-400 text-sm">Lucro Total</p>
                <p className="text-2xl font-bold text-green-400">
                  ${stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <p className="text-gray-400 text-sm">Volume Total</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-2xl border border-blue-700/50 hover:border-blue-500/50 transition-all duration-300 text-left group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              👥
            </div>
            <h3 className="text-white font-semibold mb-2">Gerenciar Usuários</h3>
            <p className="text-gray-400 text-sm">Administrar contas, permissões e status</p>
          </button>

          <button className="p-6 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-2xl border border-green-700/50 hover:border-green-500/50 transition-all duration-300 text-left group">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📊
            </div>
            <h3 className="text-white font-semibold mb-2">Relatórios</h3>
            <p className="text-gray-400 text-sm">Análises detalhadas e métricas</p>
          </button>

          <button className="p-6 bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 rounded-2xl border border-yellow-700/50 hover:border-yellow-500/50 transition-all duration-300 text-left group">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <h3 className="text-white font-semibold mb-2">Configurações</h3>
            <p className="text-gray-400 text-sm">Parâmetros do sistema e bot</p>
          </button>

          <button className="p-6 bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-2xl border border-red-700/50 hover:border-red-500/50 transition-all duration-300 text-left group">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🚨
            </div>
            <h3 className="text-white font-semibold mb-2">Sistema</h3>
            <p className="text-gray-400 text-sm">Monitoramento e alertas</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Usuários Recentes</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm">Ver todos</button>
            </div>
            <div className="space-y-4">
              {users.slice(0, 5).map((user: any, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{user.name || 'Nome não disponível'}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.status || 'indefinido'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Operations */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Operações Recentes</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm">Ver todas</button>
            </div>
            <div className="space-y-4">
              {operations.slice(0, 5).map((operation: any, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm">
                    ₿
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{operation.pair || 'BTC/USDT'}</p>
                    <p className="text-gray-400 text-sm">
                      ${operation.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      operation.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : operation.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {operation.status || 'indefinido'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
