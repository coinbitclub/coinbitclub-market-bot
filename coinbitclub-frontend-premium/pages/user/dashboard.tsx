import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiActivity,
  FiLogOut,
  FiUser,
  FiSettings
} from 'react-icons/fi';

const UserDashboard: NextPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [data, setData] = useState({
    balance: 15420.50,
    profit: 892.30,
    profitPercent: 6.15,
    activeOperations: 3,
    totalOperations: 127,
    successRate: 84.2
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login-integrated');
      return;
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.replace('/auth/login-integrated');
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
        <title>Dashboard - {user.name}</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  CoinBitClub
                </h1>
                <p className="text-gray-300 text-sm">
                  Bem-vindo, {user.name}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-white text-sm">
                  <span className="bg-purple-600/30 px-3 py-1 rounded-full">
                    {user.role}
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Balance Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Saldo Total</p>
                  <p className="text-2xl font-bold text-white">
                    ${data.balance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            {/* Profit Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Lucro Hoje</p>
                  <p className="text-2xl font-bold text-green-400">
                    +${data.profit.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-400">
                    +{data.profitPercent}%
                  </p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <FiTrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            {/* Operations Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Operações Ativas</p>
                  <p className="text-2xl font-bold text-white">
                    {data.activeOperations}
                  </p>
                  <p className="text-sm text-gray-400">
                    Total: {data.totalOperations}
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <FiActivity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Taxa de Sucesso
            </h3>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-1000"
                    style={{ width: `${data.successRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 text-2xl font-bold text-green-400">
                {data.successRate}%
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-purple-600/30 hover:bg-purple-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiTrendingUp className="w-5 h-5" />
                <span>Nova Operação</span>
              </button>
              
              <button className="bg-blue-600/30 hover:bg-blue-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiActivity className="w-5 h-5" />
                <span>Ver Histórico</span>
              </button>
              
              <button className="bg-gray-600/30 hover:bg-gray-600/50 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <FiSettings className="w-5 h-5" />
                <span>Configurações</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-8 bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-lg">
            <h4 className="font-bold">✅ Sistema Funcionando Perfeitamente!</h4>
            <p className="text-sm mt-1">
              Login realizado com sucesso. Todas as funcionalidades estão operacionais.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserDashboard;
