import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Banknote,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Download,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Repeat,
  Shield,
  Bell,
  Settings,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface BalanceData {
  total: number;
  available: number;
  invested: number;
  profit: number;
  profitPercentage: number;
  currency: string;
  lastUpdate: string;
}

interface ExchangeBalance {
  id: string;
  name: string;
  balance: number;
  available: number;
  invested: number;
  profit: number;
  profitPercentage: number;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  apiKeyStatus: 'active' | 'expired' | 'invalid';
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trading_profit' | 'trading_loss' | 'fee' | 'transfer';
  amount: number;
  currency: string;
  exchange: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  timestamp: string;
  confirmations?: number;
  txHash?: string;
  fee?: number;
  reference?: string;
}

interface BalanceAlert {
  id: string;
  type: 'low_balance' | 'high_profit' | 'high_loss' | 'api_error';
  threshold: number;
  enabled: boolean;
  exchanges: string[];
}

interface DepositWithdrawData {
  exchange: string;
  currency: string;
  amount: number;
  type: 'deposit' | 'withdraw';
}

const UserBalance: React.FC = () => {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [exchangeBalances, setExchangeBalances] = useState<ExchangeBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [depositWithdrawOpen, setDepositWithdrawOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [formData, setFormData] = useState<DepositWithdrawData>({
    exchange: '',
    currency: 'USDT',
    amount: 0,
    type: 'deposit'
  });

  // Mock data
  const mockBalanceData: BalanceData = {
    total: 25847.50,
    available: 12500.00,
    invested: 13347.50,
    profit: 2847.50,
    profitPercentage: 12.4,
    currency: 'USD',
    lastUpdate: '2025-07-28T11:30:00Z'
  };

  const mockExchangeBalances: ExchangeBalance[] = [
    {
      id: '1',
      name: 'Binance',
      balance: 15847.50,
      available: 8000.00,
      invested: 7847.50,
      profit: 1847.50,
      profitPercentage: 13.2,
      status: 'connected',
      lastSync: '2025-07-28T11:30:00Z',
      apiKeyStatus: 'active'
    },
    {
      id: '2',
      name: 'Bybit',
      balance: 10000.00,
      available: 4500.00,
      invested: 5500.00,
      profit: 1000.00,
      profitPercentage: 11.1,
      status: 'connected',
      lastSync: '2025-07-28T11:25:00Z',
      apiKeyStatus: 'active'
    },
    {
      id: '3',
      name: 'OKX',
      balance: 0,
      available: 0,
      invested: 0,
      profit: 0,
      profitPercentage: 0,
      status: 'disconnected',
      lastSync: '2025-07-27T18:00:00Z',
      apiKeyStatus: 'expired'
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'trading_profit',
      amount: 125.50,
      currency: 'USDT',
      exchange: 'Binance',
      status: 'completed',
      description: 'Lucro de operação BTC/USDT',
      timestamp: '2025-07-28T10:30:00Z',
      reference: 'OP-001'
    },
    {
      id: '2',
      type: 'deposit',
      amount: 1000.00,
      currency: 'USDT',
      exchange: 'Binance',
      status: 'completed',
      description: 'Depósito via Stripe',
      timestamp: '2025-07-28T09:00:00Z',
      confirmations: 12,
      txHash: '0x1234...abcd',
      fee: 5.00
    },
    {
      id: '3',
      type: 'trading_loss',
      amount: -45.20,
      currency: 'USDT',
      exchange: 'Binance',
      status: 'completed',
      description: 'Perda de operação ETH/USDT',
      timestamp: '2025-07-28T08:15:00Z',
      reference: 'OP-002'
    },
    {
      id: '4',
      type: 'withdrawal',
      amount: -500.00,
      currency: 'USDT',
      exchange: 'Bybit',
      status: 'pending',
      description: 'Saque para carteira externa',
      timestamp: '2025-07-28T07:45:00Z',
      confirmations: 3,
      txHash: '0x5678...efgh',
      fee: 2.50
    },
    {
      id: '5',
      type: 'fee',
      amount: -2.30,
      currency: 'USDT',
      exchange: 'Binance',
      status: 'completed',
      description: 'Taxa de trading',
      timestamp: '2025-07-28T06:30:00Z',
      reference: 'FEE-001'
    }
  ];

  // Chart data for balance evolution
  const balanceEvolutionData = [
    { date: '2025-07-21', balance: 23000, profit: 0 },
    { date: '2025-07-22', balance: 23250, profit: 250 },
    { date: '2025-07-23', balance: 23800, profit: 800 },
    { date: '2025-07-24', balance: 24200, profit: 1200 },
    { date: '2025-07-25', balance: 24800, profit: 1800 },
    { date: '2025-07-26', balance: 25200, profit: 2200 },
    { date: '2025-07-27', balance: 25600, profit: 2600 },
    { date: '2025-07-28', balance: 25847.50, profit: 2847.50 }
  ];

  // Pie chart data for balance distribution
  const balanceDistributionData = exchangeBalances
    .filter(ex => ex.balance > 0)
    .map((ex, index) => ({
      name: ex.name,
      value: ex.balance,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] || '#6B7280'
    }));

  useEffect(() => {
    fetchBalanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchBalanceData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      // In production: API calls to fetch real data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBalanceData(mockBalanceData);
      setExchangeBalances(mockExchangeBalances);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching balance data:', error);
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'trading_profit': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'trading_loss': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'fee': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'transfer': return <Repeat className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDepositWithdraw = async () => {
    try {
      console.log('Processing transaction:', formData);
      // In production: API call to process deposit/withdrawal
      setDepositWithdrawOpen(false);
      await fetchBalanceData(); // Refresh data
    } catch (error) {
      console.error('Transaction error:', error);
    }
  };

  const syncExchange = async (exchangeId: string) => {
    console.log('Syncing exchange:', exchangeId);
    // In production: API call to sync exchange balance
    await fetchBalanceData();
  };

  if (loading && !balanceData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-white">Carregando saldo...</p>
        </div>
      </div>
    );
  }

  if (!balanceData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Saldo & Transações
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus fundos e acompanhe todas as transações.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Dialog open={depositWithdrawOpen} onOpenChange={setDepositWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Depositar/Sacar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle>Depositar ou Sacar Fundos</DialogTitle>
                <DialogDescription>
                  Adicione fundos à sua conta ou faça um saque.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs value={selectedAction} onValueChange={(value) => setSelectedAction(value as 'deposit' | 'withdraw')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit">Depositar</TabsTrigger>
                    <TabsTrigger value="withdraw">Sacar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="deposit" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Exchange</label>
                      <Select 
                        value={formData.exchange} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, exchange: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Selecione a exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="binance">Binance</SelectItem>
                          <SelectItem value="bybit">Bybit</SelectItem>
                          <SelectItem value="okx">OKX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Valor</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    
                    <Button onClick={handleDepositWithdraw} className="w-full bg-green-600 hover:bg-green-700">
                      Depositar {formatCurrency(formData.amount)}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="withdraw" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Exchange</label>
                      <Select 
                        value={formData.exchange} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, exchange: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Selecione a exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="binance">Binance</SelectItem>
                          <SelectItem value="bybit">Bybit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Valor</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    
                    <Button onClick={handleDepositWithdraw} className="w-full bg-red-600 hover:bg-red-700">
                      Sacar {formatCurrency(formData.amount)}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            onClick={fetchBalanceData}
            variant="outline"
            className="border-gray-600"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Saldo Total</CardTitle>
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-yellow-400" />
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
              {balanceVisible ? formatCurrency(balanceData.total) : '****'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {balanceData.profitPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <p className={`text-xs ${balanceData.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(balanceData.profitPercentage)} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {balanceVisible ? formatCurrency(balanceData.available) : '****'}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Pronto para trading
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Investido</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {balanceVisible ? formatCurrency(balanceData.invested) : '****'}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Em operações ativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Lucro Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {balanceVisible ? formatCurrency(balanceData.profit) : '****'}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Última atualização: {new Date(balanceData.lastUpdate).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Balance Evolution */}
        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
          <CardHeader>
            <CardTitle>Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={balanceEvolutionData}>
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

        {/* Balance Distribution */}
        <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
          <CardHeader>
            <CardTitle>Distribuição por Exchange</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={balanceDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {balanceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Exchanges Status */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-yellow-400" />
            <span>Status das Exchanges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exchangeBalances.map((exchange) => (
              <Card key={exchange.id} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(exchange.status)}`}></div>
                      <h3 className="font-medium">{exchange.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncExchange(exchange.id)}
                      className="p-1 h-auto"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Saldo Total:</span>
                      <span className="font-medium">{formatCurrency(exchange.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Disponível:</span>
                      <span className="text-green-400">{formatCurrency(exchange.available)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Investido:</span>
                      <span className="text-blue-400">{formatCurrency(exchange.invested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Lucro:</span>
                      <span className={exchange.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(exchange.profit)} ({formatPercentage(exchange.profitPercentage)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>API Status:</span>
                      <Badge className={`${exchange.apiKeyStatus === 'active' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        {exchange.apiKeyStatus}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Última sincronização: {new Date(exchange.lastSync).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-yellow-400" />
              <span>Transações Recentes</span>
            </div>
            <Button variant="outline" size="sm" className="border-gray-600">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-gray-800/50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <Badge className={`${
                          transaction.status === 'completed' ? 'bg-green-600' :
                          transaction.status === 'pending' ? 'bg-yellow-600' :
                          'bg-red-600'
                        } text-white text-xs`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      {transaction.fee && (
                        <div className="text-xs text-gray-400">
                          Taxa: {formatCurrency(transaction.fee)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{transaction.exchange}</TableCell>
                    <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(transaction.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.txHash ? (
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">{transaction.reference || '-'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserBalance;
