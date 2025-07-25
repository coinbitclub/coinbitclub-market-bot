import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string;
  accountType: string;
}

interface Balance {
  exchange: string;
  environment: string;
  balance: number;
  balance_type: string;
  last_updated: string;
}

interface Operation {
  id: string;
  symbol: string;
  side: string;
  entry_price: number;
  exit_price?: number;
  profit: number;
  status: string;
  exchange: string;
  environment: string;
  opened_at: string;
  closed_at?: string;
}

interface Statistics {
  totalOperations: number;
  winningTrades: number;
  completedTrades: number;
  successRate: number;
  totalProfit: number;
  avgProfit: number;
}

interface Alerts {
  needsUpgrade: boolean;
  lowBalance: boolean;
  minBalance: number;
  currentBalance: number;
}

interface DashboardData {
  user: UserData;
  balances: Balance[];
  recentOperations: Operation[];
  statistics: Statistics;
  alerts: Alerts;
}

const UserDashboard: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar dados da API Railway integrada primeiro
      const railwayResponse = await fetch('http://localhost:9997/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (railwayResponse.ok) {
        const data = await railwayResponse.json();
        setDashboardData(data);
        return;
      }

      // Fallback para dados mockados
      const mockData: DashboardData = {
        user: {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          role: 'user',
          country: 'Brasil',
          accountType: 'testnet'
        },
        balances: [
          {
            exchange: 'binance',
            environment: 'testnet',
            balance: 1250.75,
            balance_type: 'demo',
            last_updated: new Date().toISOString()
          },
          {
            exchange: 'bybit',
            environment: 'testnet',
            balance: 890.50,
            balance_type: 'demo',
            last_updated: new Date().toISOString()
          }
        ],
        recentOperations: [
          {
            id: '1',
            symbol: 'BTCUSDT',
            side: 'LONG',
            entry_price: 43500.00,
            exit_price: 44200.00,
            profit: 70.00,
            status: 'completed',
            exchange: 'binance',
            environment: 'testnet',
            opened_at: '2024-01-20T10:30:00Z',
            closed_at: '2024-01-20T11:15:00Z'
          }
        ],
        statistics: {
          totalOperations: 45,
          winningTrades: 32,
          completedTrades: 42,
          successRate: 76.19,
          totalProfit: 1247.85,
          avgProfit: 29.71
        },
        alerts: {
          needsUpgrade: true,
          lowBalance: false,
          minBalance: 60,
          currentBalance: 2141.25
        }
      };
      
      setDashboardData(mockData);

    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'USD'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
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
              <Link href="/" className="text-2xl font-bold text-yellow-400">
                CoinBitClub
              </Link>
              <span className="ml-4 text-white/70">Dashboard do Usuário</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Olá, {user.name}</span>
              <Link 
                href="/user/settings"
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg text-sm font-medium"
              >
                Configurações
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                className="text-white/70 hover:text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <Link href="/user/dashboard" className="text-yellow-400 border-b-2 border-yellow-400 pb-2">
              Dashboard
            </Link>
            <Link href="/user/operations" className="text-white/70 hover:text-white pb-2">
              Operações
            </Link>
            <Link href="/user/plans" className="text-white/70 hover:text-white pb-2">
              Planos
            </Link>
            <Link href="/user/settings" className="text-white/70 hover:text-white pb-2">
              Configurações
            </Link>
            {user.role === 'affiliate' && (
              <>
                <Link href="/affiliate/dashboard" className="text-white/70 hover:text-white pb-2">
                  Gestão de Indicados
                </Link>
                <Link href="/affiliate/commissions" className="text-white/70 hover:text-white pb-2">
                  Comissões
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {(alerts.needsUpgrade || alerts.lowBalance) && (
          <div className="mb-8 space-y-4">
            {alerts.needsUpgrade && (
              <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                  <div>
                    <h3 className="text-yellow-400 font-medium">Migração para Conta Paga</h3>
                    <p className="text-white/70 text-sm">
                      Você está usando uma conta testnet. Migre para uma conta paga para operar com dinheiro real.
                    </p>
                  </div>
                  <Link 
                    href="/user/plans"
                    className="ml-auto bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium text-sm"
                  >
                    Ver Planos
                  </Link>
                </div>
              </div>
            )}
            
            {alerts.lowBalance && (
              <div className="bg-red-500/20 border border-red-400 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-red-400 font-medium">Saldo Baixo</h3>
                    <p className="text-white/70 text-sm">
                      Seu saldo está abaixo do mínimo de {formatCurrency(alerts.minBalance)}. 
                      O robô só abre novas operações com saldo suficiente.
                    </p>
                  </div>
                  <button className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                    Adicionar Saldo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total de Operações</p>
                <p className="text-2xl font-bold text-white">{statistics.totalOperations}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-green-400">{statistics.successRate.toFixed(1)}%</p>
                <p className="text-xs text-white/50">{statistics.winningTrades}/{statistics.completedTrades}</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Lucro Total</p>
                <p className={`text-2xl font-bold ${statistics.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(statistics.totalProfit, user.country === 'Brasil' ? 'BRL' : 'USD')}
                </p>
              </div>
              {statistics.totalProfit >= 0 ? (
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
              ) : (
                <ArrowTrendingDownIcon className="h-8 w-8 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Lucro Médio</p>
                <p className={`text-2xl font-bold ${statistics.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(statistics.avgProfit, user.country === 'Brasil' ? 'BRL' : 'USD')}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Saldos nas Exchanges */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Saldos nas Exchanges</h2>
              <BanknotesIcon className="h-6 w-6 text-yellow-400" />
            </div>
            
            <div className="space-y-4">
              {balances.map((balance, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      balance.exchange === 'binance' ? 'bg-yellow-400' : 'bg-orange-400'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium capitalize">{balance.exchange}</p>
                      <p className="text-white/50 text-sm capitalize">
                        {balance.environment} • {balance.balance_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {formatCurrency(balance.balance, user.country === 'Brasil' ? 'BRL' : 'USD')}
                    </p>
                    <p className="text-white/50 text-xs">
                      {formatDateTime(balance.last_updated)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Saldo Total:</span>
                <span className="text-xl font-bold text-yellow-400">
                  {formatCurrency(
                    balances.reduce((sum, balance) => sum + balance.balance, 0),
                    user.country === 'Brasil' ? 'BRL' : 'USD'
                  )}
                </span>
              </div>
            </div>

            <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium">
              + Adicionar Saldo Pré-pago
            </button>
          </div>

          {/* Operações Recentes */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Operações Recentes</h2>
              <Link href="/user/operations" className="text-yellow-400 hover:text-yellow-300 text-sm">
                Ver Todas
              </Link>
            </div>

            <div className="space-y-4">
              {recentOperations.length > 0 ? (
                recentOperations.map((operation) => (
                  <div key={operation.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          operation.side === 'LONG' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-white font-medium">{operation.symbol}</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          operation.side === 'LONG' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {operation.side}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {operation.status === 'completed' ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-400 mr-1" />
                        ) : operation.status === 'active' ? (
                          <ClockIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-400 mr-1" />
                        )}
                        <span className="text-white/70 text-sm capitalize">{operation.status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/50">Entrada:</p>
                        <p className="text-white">${operation.entry_price.toLocaleString()}</p>
                      </div>
                      {operation.exit_price && (
                        <div>
                          <p className="text-white/50">Saída:</p>
                          <p className="text-white">${operation.exit_price.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-white/50">Lucro:</p>
                        <p className={`font-medium ${operation.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(operation.profit, user.country === 'Brasil' ? 'BRL' : 'USD')}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/50">Exchange:</p>
                        <p className="text-white capitalize">{operation.exchange}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">Nenhuma operação encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relatório IA e Sinais */}
        <div className="mt-8 bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Relatório IA - Últimas 4 Horas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-lg p-4">
                <h3 className="text-blue-400 font-medium mb-2">Sinais Identificados</h3>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-white/50 text-sm">Últimas 4h</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500/20 rounded-lg p-4">
                <h3 className="text-green-400 font-medium mb-2">Confiança Média</h3>
                <p className="text-2xl font-bold text-white">87.5%</p>
                <p className="text-white/50 text-sm">Análise IA</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-lg p-4">
                <h3 className="text-purple-400 font-medium mb-2">Próximo Sinal</h3>
                <p className="text-2xl font-bold text-white">~15min</p>
                <p className="text-white/50 text-sm">Estimativa</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h4 className="text-white font-medium mb-2">Recomendação Atual:</h4>
            <p className="text-white/70">
              🤖 <strong>BTCUSDT LONG</strong> - Confiança: 92% | RSI oversold detectado, MACD em crossover bullish. 
              Entrada recomendada: $43,200 | Stop Loss: $42,500 | Take Profit: $44,800
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
