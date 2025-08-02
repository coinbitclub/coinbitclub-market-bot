import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { 
  FiUsers, 
  FiTrendingUp, 
  FiDollarSign, 
  FiActivity,
  FiLogOut,
  FiSettings,
  FiShield
} from 'react-icons/fi';

const AdminDashboard: NextPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [stats, setStats] = useState({
    totalUsers: 1247,
    totalOperations: 3891,
    totalProfit: 125430.50,
    totalVolume: 2847392.75,
    activeUsers: 342,
    pendingOperations: 23
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login-premium');
      return;
    }
    
    if (user && user.role !== 'admin' && user.role !== 'ADMIN') {
      router.replace('/auth/login-premium');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.replace('/auth/login-premium');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - {user.name}</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  👑 Admin CoinBitClub
                </h1>
                <p className="text-gray-300 text-sm">
                  Bem-vindo, {user.name} - Administrador
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-white text-sm">
                  <span className="bg-red-600/30 px-3 py-1 rounded-full">
                    👑 {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-red-400 transition-colors"
                >
                  <FiLogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-400">
                    +{stats.activeUsers} ativos
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <FiUsers className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Total Operations */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Operações</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalOperations.toLocaleString()}
                  </p>
                  <p className="text-sm text-yellow-400">
                    {stats.pendingOperations} pendentes
                  </p>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-lg">
                  <FiActivity className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Total Profit */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Lucro Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${stats.totalProfit.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-400">
                    +24.8% este mês
                  </p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            {/* Total Volume */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Volume Total</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalVolume.toLocaleString()}
                  </p>
                  <p className="text-sm text-purple-400">
                    Último mês
                  </p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <FiTrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.activeUsers}
                  </p>
                  <p className="text-sm text-blue-400">
                    Online agora
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <FiShield className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Status do Sistema</p>
                  <p className="text-2xl font-bold text-green-400">
                    100%
                  </p>
                  <p className="text-sm text-green-400">
                    Operacional
                  </p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <FiActivity className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Ações Administrativas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-blue-600/30 hover:bg-blue-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiUsers className="w-5 h-5" />
                <span>Gerenciar Usuários</span>
              </button>
              
              <button className="bg-green-600/30 hover:bg-green-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiTrendingUp className="w-5 h-5" />
                <span>Relatórios</span>
              </button>
              
              <button className="bg-purple-600/30 hover:bg-purple-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiSettings className="w-5 h-5" />
                <span>Configurações</span>
              </button>
              
              <button className="bg-yellow-600/30 hover:bg-yellow-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiShield className="w-5 h-5" />
                <span>Segurança</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Atividade Recente
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <FiUsers className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">Novo usuário registrado</span>
                </div>
                <span className="text-gray-400 text-sm">2 min atrás</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <FiTrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white">Operação bem-sucedida</span>
                </div>
                <span className="text-gray-400 text-sm">5 min atrás</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <FiSettings className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-white">Configuração atualizada</span>
                </div>
                <span className="text-gray-400 text-sm">10 min atrás</span>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-8 bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-lg">
            <h4 className="font-bold">👑 Painel Administrativo Ativo!</h4>
            <p className="text-sm mt-1">
              Sistema funcionando com acesso total de administrador. Todas as funcionalidades disponíveis.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
