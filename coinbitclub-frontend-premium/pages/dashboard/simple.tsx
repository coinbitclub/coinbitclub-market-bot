import { NextPage } from 'next';
import { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVolume: number;
  totalTrades: number;
  successRate: number;
  averageProfit: number;
  todayProfit: number;
  weeklyGrowth: number;
}

interface RecentTrade {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  profit: number;
  timestamp: string;
  status: 'completed' | 'pending';
}

const DashboardPage: NextPage = () => {
  const [stats] = useState<DashboardStats>({
    totalUsers: 1247,
    activeUsers: 892,
    totalVolume: 2567890,
    totalTrades: 15674,
    successRate: 87.5,
    averageProfit: 12.8,
    todayProfit: 3456,
    weeklyGrowth: 15.2
  });
  
  const [recentTrades] = useState<RecentTrade[]>([
    {
      id: '1',
      pair: 'BTC/USD',
      type: 'buy',
      amount: 0.5,
      profit: 245.50,
      timestamp: '2024-01-20T10:30:00Z',
      status: 'completed'
    },
    {
      id: '2',
      pair: 'ETH/USD',
      type: 'sell',
      amount: 2.3,
      profit: -89.20,
      timestamp: '2024-01-20T10:15:00Z',
      status: 'completed'
    },
    {
      id: '3',
      pair: 'ADA/USD',
      type: 'buy',
      amount: 1000,
      profit: 156.30,
      timestamp: '2024-01-20T09:45:00Z',
      status: 'completed'
    }
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="size-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">Visão geral do CoinBitClub MarketBot</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Lucro Hoje</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.todayProfit)}</p>
                <p className="mt-1 text-xs text-green-500">{formatPercentage(stats.weeklyGrowth)} vs semana anterior</p>
              </div>
              <CurrencyDollarIcon className="size-8 text-green-400" />
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Volume Total</p>
                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(stats.totalVolume)}</p>
                <p className="mt-1 text-xs text-cyan-500">+{stats.totalTrades.toLocaleString()} trades</p>
              </div>
              <ChartBarIcon className="size-8 text-cyan-400" />
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Usuários Ativos</p>
                <p className="text-2xl font-bold text-blue-400">{stats.activeUsers.toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-500">de {stats.totalUsers.toLocaleString()} total</p>
              </div>
              <UsersIcon className="size-8 text-blue-400" />
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.successRate}%</p>
                <p className="mt-1 text-xs text-yellow-500">Lucro médio: {formatPercentage(stats.averageProfit)}</p>
              </div>
              <CheckCircleIcon className="size-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="mb-8 rounded-lg bg-gray-800 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Performance do Bot</h3>
            <div className="flex items-center space-x-2">
              <ArrowTrendingUpIcon className="size-5 text-green-400" />
              <span className="text-sm text-green-400">+15.2% esta semana</span>
            </div>
          </div>
          
          <div className="flex h-64 items-end justify-around space-x-2 rounded-lg bg-gray-700 p-4">
            {[65, 78, 82, 90, 75, 88, 95].map((height, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className="w-8 rounded-t-sm bg-gradient-to-t from-cyan-500 to-cyan-300 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-200"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-400">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="mb-8 rounded-lg bg-gray-800 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Trades Recentes</h3>
            <button className="text-sm text-cyan-400 hover:text-cyan-300">
              Ver todos
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Par</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Quantidade</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Lucro/Perda</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Horário</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-white">{trade.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${
                        trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{trade.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.profit >= 0 ? '+' : ''}{formatCurrency(trade.profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        trade.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {trade.status === 'completed' ? 'Completo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(trade.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg bg-gray-800 p-6">
          <h3 className="mb-6 text-xl font-semibold">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <button className="rounded-lg bg-green-600 p-4 text-center text-white transition-colors duration-200 hover:bg-green-700">
              <BoltIcon className="mx-auto mb-2 size-6" />
              <span className="block font-medium">Ativar Bot</span>
              <span className="text-sm opacity-80">Iniciar trading</span>
            </button>

            <button className="rounded-lg bg-red-600 p-4 text-center text-white transition-colors duration-200 hover:bg-red-700">
              <ClockIcon className="mx-auto mb-2 size-6" />
              <span className="block font-medium">Pausar Bot</span>
              <span className="text-sm opacity-80">Interromper trades</span>
            </button>

            <button className="rounded-lg bg-blue-600 p-4 text-center text-white transition-colors duration-200 hover:bg-blue-700">
              <ChartBarIcon className="mx-auto mb-2 size-6" />
              <span className="block font-medium">Relatórios</span>
              <span className="text-sm opacity-80">Ver análises</span>
            </button>

            <button className="rounded-lg bg-purple-600 p-4 text-center text-white transition-colors duration-200 hover:bg-purple-700">
              <UsersIcon className="mx-auto mb-2 size-6" />
              <span className="block font-medium">Usuários</span>
              <span className="text-sm opacity-80">Gerenciar contas</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
