import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../src/store/authStore';
import { DashboardService } from '../src/services/api';

interface DashboardData {
  usuario?: {
    nome: string;
    email: string;
    perfil: string;
  };
  saldo_total?: number;
  operacoes_ativas?: number;
  lucro_hoje?: number;
  indice_acerto?: {
    percentual: number;
    total_operacoes: number;
    acertos: number;
  };
  operacoes_recentes?: Array<{
    id: string;
    symbol: string;
    side: string;
    profit: number;
    status: string;
    timestamp: string;
  }>;
  sistema?: {
    status: string;
    ultima_atualizacao: string;
  };
}

const DashboardPage: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/auth/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setError(null);
      let data;

      // Escolher serviço baseado no role do usuário
      switch (user.role) {
        case 'admin':
          data = await DashboardService.getAdminDashboard();
          break;
        case 'affiliate':
          data = await DashboardService.getAffiliateDashboard();
          break;
        default:
          data = await DashboardService.getUserDashboard();
      }

      setDashboardData(data || {});
      console.log('✅ Dashboard data loaded:', data);
    } catch (err: any) {
      console.error('❌ Dashboard load error:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  // Logout
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub MarketBot</title>
        <meta name="description" content="Dashboard de trading premium CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-black font-bold">
                  ₿
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CoinBitClub</h1>
                  <p className="text-sm text-gray-400">
                    Bem-vindo, {user?.name || dashboardData.usuario?.nome || 'Usuário'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Atualizar"
                >
                  <div className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}>🔄</div>
                </button>
                
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Online</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-all"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">⚠️</div>
                <div className="text-red-300">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Saldo Total</p>
                  <p className="text-2xl font-bold text-white">
                    ${(dashboardData.saldo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  💰
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Operações Ativas</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardData.operacoes_ativas || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                  📊
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Lucro Hoje</p>
                  <p className="text-2xl font-bold text-green-400">
                    +${(dashboardData.lucro_hoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  📈
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Taxa de Acerto</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {dashboardData.indice_acerto?.percentual || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  🎯
                </div>
              </div>
            </div>
          </div>

          {/* Recent Operations */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Operações Recentes</h2>
              <button className="text-yellow-400 hover:text-yellow-300 text-sm">
                Ver todas →
              </button>
            </div>

            {dashboardData.operacoes_recentes && dashboardData.operacoes_recentes.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.operacoes_recentes.slice(0, 5).map((op, index) => (
                  <div key={op.id || index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        op.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {op.side === 'BUY' ? '📈' : '📉'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{op.symbol}</p>
                        <p className="text-gray-400 text-sm">{op.side}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold ${op.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {op.profit >= 0 ? '+' : ''}${op.profit?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-gray-400 text-sm">{op.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400">Nenhuma operação encontrada</p>
                <p className="text-gray-500 text-sm mt-2">
                  As operações aparecerão aqui quando iniciadas
                </p>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="mt-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-400 font-semibold mb-2">🔧 Status do Sistema</h3>
                <p className="text-gray-300 text-sm">
                  Sistema operacional • Backend conectado • Dados em tempo real
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Ativo</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardPage;
