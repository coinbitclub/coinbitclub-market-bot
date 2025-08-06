// ============================================================================
// 👑 DASHBOARD ADMIN INTEGRADO - SEM DADOS MOCK
// ============================================================================
// Dashboard administrativo 100% integrado com backend
// Dados em tempo real via API Railway
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth, withAuth } from '../../src/contexts/AuthContextIntegrated';
import { adminService } from '../../src/lib/api-client-integrated';
import { 
  FiHome, 
  FiUsers, 
  FiBarChart, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUserCheck,
  FiDollarSign,
  FiActivity,
  FiAlertTriangle,
  FiCreditCard,
  FiTrendingUp,
  FiDatabase,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';

// 📊 Interfaces dos dados
interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    growth_percentage: number;
  };
  trading: {
    volume_24h: number;
    operations_count: number;
    profit_total: number;
    growth_percentage: number;
  };
  revenue: {
    total_month: number;
    subscriptions: number;
    commissions: number;
    growth_percentage: number;
  };
  system: {
    uptime: number;
    api_response_time: number;
    active_sessions: number;
    last_update: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'new_operation' | 'payment' | 'withdrawal';
  description: string;
  user_name: string;
  timestamp: string;
  amount?: number;
}

const AdminDashboardIntegrated: NextPage = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados dos dados
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [error, setError] = useState('');

  // 🚀 Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError('');
      
      const [statsResponse, activitiesResponse] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivities(10)
      ]);

      setDashboardStats(statsResponse);
      setRecentActivities(activitiesResponse);
      
      console.log('✅ Dashboard data loaded:', {
        stats: statsResponse,
        activities: activitiesResponse
      });
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      setError(error.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleLogout = async () => {
    await logout();
  };

  // 📊 Componente de Card de Estatística
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    trend?: number;
    trendLabel?: string;
    color: string;
  }> = ({ title, value, icon: Icon, trend, trendLabel, color }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-gray-500 text-xs ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${color.replace('text-', 'bg-').replace('400', '600')} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // 🕐 Componente de Atividade Recente
  const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'user_registration': return FiUserCheck;
        case 'new_operation': return FiTrendingUp;
        case 'payment': return FiCreditCard;
        case 'withdrawal': return FiDollarSign;
        default: return FiActivity;
      }
    };

    const getActivityColor = (type: string) => {
      switch (type) {
        case 'user_registration': return 'text-green-400';
        case 'new_operation': return 'text-blue-400';
        case 'payment': return 'text-yellow-400';
        case 'withdrawal': return 'text-red-400';
        default: return 'text-gray-400';
      }
    };

    const Icon = getActivityIcon(activity.type);
    const colorClass = getActivityColor(activity.type);

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
        <div className={`w-10 h-10 ${colorClass.replace('text-', 'bg-').replace('400', '600')} rounded-full flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">
            {activity.user_name}
          </p>
          <p className="text-gray-400 text-xs truncate">
            {activity.description}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(activity.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
        {activity.amount && (
          <div className="text-right">
            <p className={`text-sm font-medium ${colorClass}`}>
              {activity.type === 'withdrawal' ? '-' : '+'}R$ {activity.amount.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-white mt-4">⚡ Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome, active: true },
    { name: 'Usuários', href: '/admin/users', icon: FiUsers },
    { name: 'Operações', href: '/admin/operations', icon: FiTrendingUp },
    { name: 'Afiliados', href: '/admin/affiliates', icon: FiUserCheck },
    { name: 'Financeiro', href: '/admin/accounting', icon: FiDollarSign },
    { name: 'Alertas', href: '/admin/alerts', icon: FiAlertTriangle },
    { name: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ];

  return (
    <>
      <Head>
        <title>Dashboard Admin - CoinBitClub</title>
        <meta name="description" content="Painel administrativo CoinBitClub" />
      </Head>

      <div className="flex h-screen bg-gray-900">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-black">₿</span>
              </div>
              <span className="ml-2 text-white font-semibold">Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-4 px-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      item.active
                        ? 'bg-yellow-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-white text-sm font-medium">{user?.name}</p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4 mr-3" />
              Sair
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-4"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-white">Dashboard Administrativo</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-2 text-sm text-red-300 hover:text-red-200"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Stats Cards */}
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Usuários Ativos"
                  value={dashboardStats.users.active}
                  icon={FiUsers}
                  trend={dashboardStats.users.growth_percentage}
                  trendLabel="este mês"
                  color="text-blue-400"
                />
                <StatCard
                  title="Volume 24h"
                  value={`R$ ${(dashboardStats.trading.volume_24h / 1000).toFixed(1)}K`}
                  icon={FiTrendingUp}
                  trend={dashboardStats.trading.growth_percentage}
                  trendLabel="vs ontem"
                  color="text-green-400"
                />
                <StatCard
                  title="Receita Mensal"
                  value={`R$ ${(dashboardStats.revenue.total_month / 1000).toFixed(1)}K`}
                  icon={FiDollarSign}
                  trend={dashboardStats.revenue.growth_percentage}
                  trendLabel="este mês"
                  color="text-yellow-400"
                />
                <StatCard
                  title="Operações Hoje"
                  value={dashboardStats.trading.operations_count}
                  icon={FiActivity}
                  color="text-purple-400"
                />
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-xl border border-gray-700">
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Atividades Recentes</h2>
                      <Link
                        href="/admin/activities"
                        className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center"
                      >
                        Ver todas <FiEye className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    {recentActivities.length > 0 ? (
                      <div className="space-y-2">
                        {recentActivities.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiActivity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Nenhuma atividade recente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="space-y-6">
                {/* System Health */}
                {dashboardStats && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Status do Sistema</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Uptime</span>
                        <span className="text-green-400">{dashboardStats.system.uptime}%</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">API Response</span>
                        <span className="text-blue-400">{dashboardStats.system.api_response_time}ms</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Sessões Ativas</span>
                        <span className="text-purple-400">{dashboardStats.system.active_sessions}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-500">
                          Última atualização: {new Date(dashboardStats.system.last_update).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
                  
                  <div className="space-y-3">
                    <Link
                      href="/admin/users/new"
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors text-center"
                    >
                      Novo Usuário
                    </Link>
                    
                    <Link
                      href="/admin/operations"
                      className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors text-center"
                    >
                      Ver Operações
                    </Link>
                    
                    <Link
                      href="/admin/reports"
                      className="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors text-center"
                    >
                      Relatórios
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default withAuth(AdminDashboardIntegrated, {
  allowedRoles: ['admin'],
  requireEmailVerification: false,
  requirePhoneVerification: false
});
