import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { UserLayout } from '../../src/components/layout/UserLayout';
import RobotOperationTimeline from '../../src/components/trading/RobotOperationTimeline';
import CompactRobotStatus from '../../src/components/trading/CompactRobotStatus';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiActivity,
  FiTarget,
  FiArrowUpRight,
  FiArrowDownRight,
  FiWallet,
  FiZap
} from 'react-icons/fi';

interface UserDashboardData {
  performance: {
    total_balance: number;
    today_pnl: number;
    today_pnl_percentage: number;
    monthly_return: number;
    monthly_return_percentage: number;
    total_operations: number;
    success_rate: number;
  };
  active_operations: Array<{
    id: string;
    type: 'BUY' | 'SELL';
    symbol: string;
    amount: number;
    pnl: number;
    pnl_percentage: number;
    status: 'ACTIVE' | 'CLOSED';
  }>;
  exchange_balances: Array<{
    exchange: string;
    balance: number;
    currency: string;
    status: 'connected' | 'error' | 'maintenance';
  }>;
}

const UserDashboard: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data para demonstração
      const mockData: UserDashboardData = {
        performance: {
          total_balance: 15750.50,
          today_pnl: 425.75,
          today_pnl_percentage: 2.78,
          monthly_return: 2180.30,
          monthly_return_percentage: 16.08,
          total_operations: 247,
          success_rate: 78.5
        },
        active_operations: [
          {
            id: 'OP001',
            type: 'BUY',
            symbol: 'BTC/USDT',
            amount: 0.5,
            pnl: 325.00,
            pnl_percentage: 1.53,
            status: 'ACTIVE'
          },
          {
            id: 'OP002',
            type: 'SELL',
            symbol: 'ETH/USDT',
            amount: 2.0,
            pnl: -31.00,
            pnl_percentage: -0.60,
            status: 'ACTIVE'
          }
        ],
        exchange_balances: [
          { exchange: 'Binance', balance: 8950.25, currency: 'USDT', status: 'connected' },
          { exchange: 'Bybit', balance: 4200.15, currency: 'USDT', status: 'connected' },
          { exchange: 'OKX', balance: 2600.10, currency: 'USDT', status: 'maintenance' }
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </UserLayout>
    );
  }

  if (!dashboardData) {
    return (
      <UserLayout>
        <div className="text-center text-red-400">
          Erro ao carregar dados do dashboard
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Timeline do Robô */}
        <div className="mb-8">
          <RobotOperationTimeline 
            isActive={true} 
            speed="normal"
            compact={false}
          />
        </div>

        {/* Header com resumo da performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700 rounded-xl p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-indigo-100">
                Saldo Total
              </h3>
              <FiWallet className="h-4 w-4 text-indigo-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(dashboardData.performance.total_balance)}
            </div>
            <p className="text-xs text-indigo-300">
              Saldo em todas as exchanges
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 border-green-700 rounded-xl p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-green-100">
                P&L Hoje
              </h3>
              {dashboardData.performance.today_pnl >= 0 ? (
                <FiTrendingUp className="h-4 w-4 text-green-300" />
              ) : (
                <FiTrendingDown className="h-4 w-4 text-red-300" />
              )}
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(dashboardData.performance.today_pnl)}
            </div>
            <p className={`text-xs ${dashboardData.performance.today_pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatPercentage(dashboardData.performance.today_pnl_percentage)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 rounded-xl p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-purple-100">
                Operações Ativas
              </h3>
              <FiActivity className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {dashboardData.active_operations.length}
            </div>
            <p className="text-xs text-purple-300">
              Taxa de sucesso: {dashboardData.performance.success_rate}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 rounded-xl p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-blue-100">
                Retorno Mensal
              </h3>
              <FiTarget className="h-4 w-4 text-blue-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(dashboardData.performance.monthly_return)}
            </div>
            <p className="text-xs text-blue-300">
              {formatPercentage(dashboardData.performance.monthly_return_percentage)}
            </p>
          </div>
        </div>

        {/* Saldos das Exchanges */}
        <div className="bg-slate-900 border-slate-700 rounded-xl p-6 border">
          <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
            <FiTarget className="h-5 w-5 text-green-400" />
            Saldos das Exchanges
          </h3>
          <div className="space-y-4">
            {dashboardData.exchange_balances.map((exchange, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    exchange.status === 'connected' ? 'bg-green-500' :
                    exchange.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-slate-300">{exchange.exchange}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {formatCurrency(exchange.balance)}
                  </div>
                  <div className="text-sm text-slate-400">{exchange.currency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operações Ativas */}
        <div className="bg-slate-900 border-slate-700 rounded-xl p-6 border">
          <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
            <FiActivity className="h-5 w-5 text-orange-400" />
            Operações Ativas
          </h3>
          {dashboardData.active_operations.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              Nenhuma operação ativa no momento
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.active_operations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      operation.type === 'BUY' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {operation.type}
                    </div>
                    <div>
                      <div className="text-white font-medium">{operation.symbol}</div>
                      <div className="text-sm text-slate-400">
                        {operation.amount} unidades
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {operation.pnl >= 0 ? (
                        <FiArrowUpRight className="inline w-4 h-4 mr-1" />
                      ) : (
                        <FiArrowDownRight className="inline w-4 h-4 mr-1" />
                      )}
                      {formatCurrency(Math.abs(operation.pnl))}
                    </div>
                    <div className={`text-sm ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(operation.pnl_percentage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="bg-slate-900 border-slate-700 rounded-xl p-6 border">
          <h3 className="text-white text-lg font-semibold mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <FiDollarSign className="w-4 h-4" />
              Recarregar Saldo
            </button>
            
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <FiActivity className="w-4 h-4" />
              Nova Operação
            </button>
            
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <FiTarget className="w-4 h-4" />
              Relatórios
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
