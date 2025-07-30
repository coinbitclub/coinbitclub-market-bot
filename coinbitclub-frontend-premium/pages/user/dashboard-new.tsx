import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { UserLayout } from '../../src/components/Layout/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  AlertCircle,
  Clock,
  Target,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

interface PerformanceMetrics {
  total_balance: number;
  today_pnl: number;
  today_pnl_percentage: number;
  monthly_return: number;
  monthly_return_percentage: number;
  total_operations: number;
  success_rate: number;
  best_operation: number;
  worst_operation: number;
}

interface ReturnData {
  period: string;
  return_value: number;
  return_percentage: number;
}

interface ExchangeBalance {
  exchange: string;
  balance: number;
  currency: string;
  status: 'connected' | 'error' | 'maintenance';
}

interface Operation {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  amount: number;
  entry_price: number;
  current_price?: number;
  pnl: number;
  pnl_percentage: number;
  start_time: string;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
}

interface UserDashboardData {
  performance: PerformanceMetrics;
  returns: ReturnData[];
  exchange_balances: ExchangeBalance[];
  prepaid_balance: {
    current_balance: number;
    currency: string;
    last_recharge: string;
    auto_recharge_enabled: boolean;
  };
  active_operations: Operation[];
  warnings: {
    low_balance: boolean;
    api_failures: string[];
    system_maintenance: boolean;
  };
}

const UserDashboard: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulated data - replace with actual API call
      const mockData: UserDashboardData = {
        performance: {
          total_balance: 15750.50,
          today_pnl: 425.75,
          today_pnl_percentage: 2.78,
          monthly_return: 2180.30,
          monthly_return_percentage: 16.08,
          total_operations: 247,
          success_rate: 78.5,
          best_operation: 890.45,
          worst_operation: -125.80
        },
        returns: [
          { period: 'Hoje', return_value: 425.75, return_percentage: 2.78 },
          { period: 'Esta Semana', return_value: 1250.40, return_percentage: 8.64 },
          { period: 'Este Mês', return_value: 2180.30, return_percentage: 16.08 },
          { period: 'Últimos 3 Meses', return_value: 4760.85, return_percentage: 43.25 }
        ],
        exchange_balances: [
          { exchange: 'Binance', balance: 8950.25, currency: 'USDT', status: 'connected' },
          { exchange: 'Bybit', balance: 4200.15, currency: 'USDT', status: 'connected' },
          { exchange: 'OKX', balance: 2600.10, currency: 'USDT', status: 'maintenance' }
        ],
        prepaid_balance: {
          current_balance: 450.00,
          currency: 'USD',
          last_recharge: '2024-01-15T10:30:00Z',
          auto_recharge_enabled: true
        },
        active_operations: [
          {
            id: 'OP001',
            type: 'BUY',
            symbol: 'BTC/USDT',
            amount: 0.5,
            entry_price: 42500.00,
            current_price: 43150.00,
            pnl: 325.00,
            pnl_percentage: 1.53,
            start_time: '2024-01-15T14:20:00Z',
            status: 'ACTIVE'
          },
          {
            id: 'OP002',
            type: 'SELL',
            symbol: 'ETH/USDT',
            amount: 2.0,
            entry_price: 2580.00,
            current_price: 2595.50,
            pnl: -31.00,
            pnl_percentage: -0.60,
            start_time: '2024-01-15T15:45:00Z',
            status: 'ACTIVE'
          }
        ],
        warnings: {
          low_balance: false,
          api_failures: [],
          system_maintenance: false
        }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
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
        {/* Header com resumo da performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100">
                Saldo Total
              </CardTitle>
              <Wallet className="h-4 w-4 text-indigo-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(dashboardData.performance.total_balance)}
              </div>
              <p className="text-xs text-indigo-300">
                Saldo em todas as exchanges
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                P&L Hoje
              </CardTitle>
              {dashboardData.performance.today_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-300" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-300" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(dashboardData.performance.today_pnl)}
              </div>
              <p className={`text-xs ${dashboardData.performance.today_pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {formatPercentage(dashboardData.performance.today_pnl_percentage)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Operações Ativas
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {dashboardData.active_operations.length}
              </div>
              <p className="text-xs text-purple-300">
                Taxa de sucesso: {dashboardData.performance.success_rate}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Saldo Pré-pago
              </CardTitle>
              <Zap className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(dashboardData.prepaid_balance.current_balance)}
              </div>
              <p className="text-xs text-blue-300">
                Auto-recarga: {dashboardData.prepaid_balance.auto_recharge_enabled ? 'Ativa' : 'Inativa'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Performance e Retornos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                Performance por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.returns.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <span className="text-slate-300">{item.period}</span>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {formatCurrency(item.return_value)}
                      </div>
                      <div className={`text-sm ${item.return_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(item.return_percentage)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Saldos das Exchanges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.exchange_balances.map((exchange, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(exchange.status)}`}></div>
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
            </CardContent>
          </Card>
        </div>

        {/* Operações Ativas */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              Operações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.active_operations.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                Nenhuma operação ativa no momento
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.active_operations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={operation.type === 'BUY' ? 'default' : 'secondary'}>
                        {operation.type}
                      </Badge>
                      <div>
                        <div className="text-white font-medium">{operation.symbol}</div>
                        <div className="text-sm text-slate-400">
                          {operation.amount} @ {formatCurrency(operation.entry_price)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-medium ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {operation.pnl >= 0 ? (
                          <ArrowUpRight className="inline w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="inline w-4 h-4 mr-1" />
                        )}
                        {formatCurrency(Math.abs(operation.pnl))}
                      </div>
                      <div className={`text-sm ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(operation.pnl_percentage)}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-white">
                        {operation.current_price ? formatCurrency(operation.current_price) : '---'}
                      </div>
                      <div className="text-sm text-slate-400">
                        <Clock className="inline w-3 h-3 mr-1" />
                        {new Date(operation.start_time).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="border-indigo-600 text-indigo-400 hover:bg-indigo-600 hover:text-white"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Recarregar Saldo
              </Button>
              
              <Button 
                variant="outline" 
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <Activity className="w-4 h-4 mr-2" />
                Nova Operação
              </Button>
              
              <Button 
                variant="outline" 
                className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warnings se houver */}
        {(dashboardData.warnings.low_balance || 
          dashboardData.warnings.api_failures.length > 0 || 
          dashboardData.warnings.system_maintenance) && (
          <Card className="bg-amber-900 border-amber-700">
            <CardHeader>
              <CardTitle className="text-amber-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Avisos Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.warnings.low_balance && (
                  <div className="text-amber-200">⚠️ Saldo baixo detectado</div>
                )}
                {dashboardData.warnings.api_failures.map((failure, index) => (
                  <div key={index} className="text-amber-200">⚠️ Falha na API: {failure}</div>
                ))}
                {dashboardData.warnings.system_maintenance && (
                  <div className="text-amber-200">🔧 Sistema em manutenção</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
