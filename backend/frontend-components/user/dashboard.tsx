import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Users,
  BarChart3,
  Bell,
  Settings,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Plus,
  Minus,
  Target,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  balance: {
    total: number;
    available: number;
    invested: number;
    profit: number;
    evolution: number;
    currency: string;
  };
  performance: {
    totalOperations: number;
    successRate: number;
    averageProfit: number;
    monthlyReturn: number;
    dailyReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  recentOperations: Array<{
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    amount: number;
    price: number;
    profit: number;
    status: 'completed' | 'pending' | 'cancelled';
    timestamp: string;
    exchange: string;
  }>;
  notifications: Array<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  charts: {
    balanceEvolution: Array<{
      date: string;
      balance: number;
      profit: number;
    }>;
    performanceDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  exchanges: Array<{
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    balance: number;
    lastUpdate: string;
  }>;
}

const UserDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Simulated data for demonstration
  const mockData: DashboardData = {
    balance: {
      total: 25847.50,
      available: 12500.00,
      invested: 13347.50,
      profit: 2847.50,
      evolution: 12.4,
      currency: 'USD'
    },
    performance: {
      totalOperations: 1247,
      successRate: 68.5,
      averageProfit: 2.3,
      monthlyReturn: 8.7,
      dailyReturn: 0.31,
      sharpeRatio: 1.85,
      maxDrawdown: 4.2,
      winRate: 72.1
    },
    recentOperations: [
      {
        id: '1',
        symbol: 'BTC/USDT',
        type: 'BUY',
        amount: 0.5,
        price: 43500.00,
        profit: 125.50,
        status: 'completed',
        timestamp: '2025-07-28T10:30:00Z',
        exchange: 'Binance'
      },
      {
        id: '2',
        symbol: 'ETH/USDT',
        type: 'SELL',
        amount: 2.1,
        price: 2850.00,
        profit: -45.20,
        status: 'completed',
        timestamp: '2025-07-28T09:15:00Z',
        exchange: 'Binance'
      },
      {
        id: '3',
        symbol: 'ADA/USDT',
        type: 'BUY',
        amount: 1000,
        price: 0.45,
        profit: 23.75,
        status: 'completed',
        timestamp: '2025-07-28T08:45:00Z',
        exchange: 'Bybit'
      }
    ],
    notifications: [
      {
        id: '1',
        type: 'success',
        title: 'Operação Concluída',
        message: 'Compra de BTC/USDT executada com sucesso (+$125.50)',
        timestamp: '2025-07-28T10:30:00Z',
        read: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'API Rate Limit',
        message: 'Aproximando do limite de requisições da Binance',
        timestamp: '2025-07-28T09:20:00Z',
        read: false
      },
      {
        id: '3',
        type: 'info',
        title: 'Atualização de Sistema',
        message: 'Nova versão da IA Águia disponível',
        timestamp: '2025-07-28T08:00:00Z',
        read: true
      }
    ],
    charts: {
      balanceEvolution: [
        { date: '2025-07-21', balance: 23000, profit: 0 },
        { date: '2025-07-22', balance: 23250, profit: 250 },
        { date: '2025-07-23', balance: 23800, profit: 800 },
        { date: '2025-07-24', balance: 24200, profit: 1200 },
        { date: '2025-07-25', balance: 24800, profit: 1800 },
        { date: '2025-07-26', balance: 25200, profit: 2200 },
        { date: '2025-07-27', balance: 25600, profit: 2600 },
        { date: '2025-07-28', balance: 25847.50, profit: 2847.50 }
      ],
      performanceDistribution: [
        { name: 'Lucros', value: 68.5, color: '#10B981' },
        { name: 'Prejuízos', value: 31.5, color: '#EF4444' }
      ]
    },
    exchanges: [
      { name: 'Binance', status: 'connected', balance: 15847.50, lastUpdate: '2025-07-28T10:30:00Z' },
      { name: 'Bybit', status: 'connected', balance: 10000.00, lastUpdate: '2025-07-28T10:25:00Z' },
      { name: 'OKX', status: 'disconnected', balance: 0, lastUpdate: '2025-07-27T18:00:00Z' }
    ]
  };

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // In production, this would be a real API call
      // const response = await fetch('/api/user/dashboard');
      // const data = await response.json();
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboardData(mockData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertDescription className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertDescription className="h-4 w-4 text-red-500" />;
      default: return <AlertDescription className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
        <Alert className="border-red-500 bg-red-950/50">
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={fetchDashboardData} 
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Dashboard do Usuário
          </h1>
          <p className="text-gray-400 mt-1">
            Bem-vindo de volta! Aqui está um resumo das suas atividades.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-gray-600 ${autoRefresh ? 'text-green-400' : 'text-gray-400'}`}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="border-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 hover:border-blue-400/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Saldo Total</CardTitle>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-0 h-auto"
              >
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {balanceVisible ? formatCurrency(dashboardData.balance.total) : '****'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {dashboardData.balance.evolution >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <p className={`text-xs ${dashboardData.balance.evolution >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(dashboardData.balance.evolution)} este mês
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 hover:border-blue-400/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {balanceVisible ? formatCurrency(dashboardData.balance.profit) : '****'}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {dashboardData.performance.totalOperations} operações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 hover:border-blue-400/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Taxa de Sucesso</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {dashboardData.performance.successRate}%
            </div>
            <Progress 
              value={dashboardData.performance.successRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 hover:border-blue-400/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Retorno Mensal</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {formatPercentage(dashboardData.performance.monthlyReturn)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sharpe: {dashboardData.performance.sharpeRatio}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span>Ações Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button className="bg-green-600 hover:bg-green-700 flex flex-col items-center p-4 h-auto">
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-sm">Depositar</span>
            </Button>
            
            <Button className="bg-red-600 hover:bg-red-700 flex flex-col items-center p-4 h-auto">
              <Minus className="h-6 w-6 mb-2" />
              <span className="text-sm">Sacar</span>
            </Button>
            
            <Button className="bg-blue-600 hover:bg-blue-700 flex flex-col items-center p-4 h-auto">
              <Activity className="h-6 w-6 mb-2" />
              <span className="text-sm">Trading</span>
            </Button>
            
            <Button className="bg-purple-600 hover:bg-purple-700 flex flex-col items-center p-4 h-auto">
              <Settings className="h-6 w-6 mb-2" />
              <span className="text-sm">API Keys</span>
            </Button>
            
            <Button className="bg-orange-600 hover:bg-orange-700 flex flex-col items-center p-4 h-auto">
              <Download className="h-6 w-6 mb-2" />
              <span className="text-sm">Relatórios</span>
            </Button>
            
            <Button className="bg-yellow-600 hover:bg-yellow-700 flex flex-col items-center p-4 h-auto">
              <Bell className="h-6 w-6 mb-2" />
              <span className="text-sm">Alertas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-black/60">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Evolution Chart */}
            <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardHeader>
                <CardTitle>Evolução do Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData.charts.balanceEvolution}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E6C200" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#E6C200" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#E6C200" 
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Operations */}
            <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardHeader>
                <CardTitle>Operações Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.recentOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${operation.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {operation.type === 'BUY' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{operation.symbol}</p>
                        <p className="text-sm text-gray-400">{operation.exchange}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${operation.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(operation.profit)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(operation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle>Histórico Completo de Operações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Badge variant={operation.status === 'completed' ? 'default' : 'secondary'}>
                        {operation.status}
                      </Badge>
                      <div>
                        <p className="font-medium">{operation.symbol}</p>
                        <p className="text-sm text-gray-400">
                          {operation.type} • {operation.amount} • {formatCurrency(operation.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${operation.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(operation.profit)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(operation.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gray-800/50">
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-2xl font-bold text-green-400">{dashboardData.performance.winRate}%</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-800/50">
                    <p className="text-sm text-gray-400">Drawdown Máximo</p>
                    <p className="text-2xl font-bold text-red-400">{dashboardData.performance.maxDrawdown}%</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-800/50">
                    <p className="text-sm text-gray-400">Retorno Diário</p>
                    <p className="text-2xl font-bold text-blue-400">{formatPercentage(dashboardData.performance.dailyReturn)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-800/50">
                    <p className="text-sm text-gray-400">Lucro Médio</p>
                    <p className="text-2xl font-bold text-purple-400">{formatPercentage(dashboardData.performance.averageProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardHeader>
                <CardTitle>Distribuição de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.charts.performanceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {dashboardData.charts.performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-6">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle>Status das Exchanges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.exchanges.map((exchange) => (
                <div key={exchange.name} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(exchange.status)}`}></div>
                    <div>
                      <p className="font-medium">{exchange.name}</p>
                      <p className="text-sm text-gray-400">
                        Última atualização: {new Date(exchange.lastUpdate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(exchange.balance)}</p>
                    <Badge variant={exchange.status === 'connected' ? 'default' : 'secondary'}>
                      {exchange.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notifications Panel */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            <span>Notificações</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboardData.notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className={`p-3 rounded-lg ${notification.read ? 'bg-gray-800/30' : 'bg-gray-800/70'} border-l-4 ${
              notification.type === 'success' ? 'border-green-500' :
              notification.type === 'warning' ? 'border-yellow-500' :
              notification.type === 'error' ? 'border-red-500' : 'border-blue-500'
            }`}>
              <div className="flex items-start space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-gray-400">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
