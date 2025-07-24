import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const UserDashboard: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('http://localhost:9997/api/user/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-red-400 mx-auto mb-4">❌</div>
          <p className="text-white mb-4">{error || 'Erro ao carregar dados'}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { user, balances, recentOperations, statistics, alerts } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-yellow-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-yellow-400">CoinBitClub</div>
              <div className="ml-4 text-white/70">Dashboard do Usuário</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-white/70">Bem-vindo, </span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alertas */}
        {alerts && (alerts.needsUpgrade || alerts.lowBalance) && (
          <div className="mb-6 space-y-4">
            {alerts.needsUpgrade && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-yellow-400 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-yellow-400 font-medium">Conta em Modo Testnet</h3>
                    <p className="text-white/70 text-sm">
                      Migre para uma conta real para acessar todas as funcionalidades.
                    </p>
                  </div>
                  <Link href="/user/plans" className="ml-auto bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium">
                    Migrar Agora
                  </Link>
                </div>
              </div>
            )}
            
            {alerts.lowBalance && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">🔻</div>
                  <div>
                    <h3 className="text-red-400 font-medium">Saldo Baixo</h3>
                    <p className="text-white/70 text-sm">
                      Saldo atual: R$ {alerts.currentBalance?.toFixed(2)} | Mínimo recomendado: R$ {alerts.minBalance}
                    </p>
                  </div>
                  <button className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Depositar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Operações */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total de Operações</p>
                <p className="text-3xl font-bold text-white">{statistics?.totalOperations || 0}</p>
              </div>
              <div className="text-blue-400">📊</div>
            </div>
          </div>

          {/* Taxa de Sucesso */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-white">{statistics?.successRate || 0}%</p>
              </div>
              <div className="text-green-400">📈</div>
            </div>
          </div>

          {/* Lucro Total */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Lucro Total</p>
                <p className="text-3xl font-bold text-white">R$ {statistics?.totalProfit?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-yellow-400">💰</div>
            </div>
          </div>

          {/* Saldo Total */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-purple-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Saldo Total</p>
                <p className="text-3xl font-bold text-white">
                  R$ {balances?.reduce((sum: number, b: any) => sum + parseFloat(b.balance), 0).toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="text-purple-400">💳</div>
            </div>
          </div>
        </div>

        {/* Saldos por Exchange */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">💼</span>
              Saldos nas Exchanges
            </h3>
            <div className="space-y-4">
              {balances?.map((balance: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3 text-xs font-bold">
                      {balance.exchange.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{balance.exchange}</p>
                      <p className="text-white/60 text-sm">{balance.environment}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">R$ {parseFloat(balance.balance).toFixed(2)}</p>
                    <p className="text-white/60 text-sm">{balance.balance_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operações Recentes */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Operações Recentes
            </h3>
            <div className="space-y-3">
              {recentOperations?.length > 0 ? (
                recentOperations.slice(0, 5).map((operation: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        operation.status === 'completed' && operation.profit > 0 ? 'bg-green-400' :
                        operation.status === 'completed' && operation.profit <= 0 ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`}></div>
                      <div>
                        <p className="text-white font-medium">{operation.symbol}</p>
                        <p className="text-white/60 text-sm">{operation.side}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${operation.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {operation.profit > 0 ? '+' : ''}R$ {operation.profit?.toFixed(2)}
                      </p>
                      <p className="text-white/60 text-sm">{operation.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-center py-4">Nenhuma operação encontrada</p>
              )}
            </div>
            <Link href="/user/operations" className="block mt-4 text-center text-yellow-400 hover:text-yellow-300 text-sm">
              Ver todas as operações →
            </Link>
          </div>
        </div>

        {/* Links de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/user/operations" className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Operações</h3>
              <p className="text-white/70">Visualize todas as suas operações e relatórios detalhados</p>
            </div>
          </Link>

          <Link href="/user/plans" className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-white mb-2">Planos</h3>
              <p className="text-white/70">Gerencie seus planos e assinaturas do sistema</p>
            </div>
          </Link>

          <Link href="/user/settings" className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md border border-green-400/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-2">Configurações</h3>
              <p className="text-white/70">Configure suas preferências e parâmetros de trading</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
