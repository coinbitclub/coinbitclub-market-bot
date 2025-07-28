import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye,
  RefreshCw,
  FileText,
  BarChart3,
  Activity,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Operation {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  side: 'LONG' | 'SHORT';
  amount: number;
  price: number;
  total: number;
  profit: number;
  profitPercentage: number;
  status: 'completed' | 'pending' | 'cancelled' | 'failed';
  exchange: string;
  strategy: string;
  executedAt: string;
  completedAt?: string;
  duration?: number;
  fees: number;
  slippage: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  aiScore?: number;
  tags: string[];
}

interface OperationsFilters {
  symbol: string;
  exchange: string;
  type: string;
  status: string;
  strategy: string;
  dateRange: string;
  minProfit: string;
  maxProfit: string;
}

interface OperationsStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalProfit: number;
  averageProfit: number;
  bestOperation: number;
  worstOperation: number;
  winRate: number;
  averageDuration: number;
  totalFees: number;
  totalVolume: number;
}

const UserOperations: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OperationsFilters>({
    symbol: '',
    exchange: '',
    type: '',
    status: '',
    strategy: '',
    dateRange: '',
    minProfit: '',
    maxProfit: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('executedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [stats, setStats] = useState<OperationsStats | null>(null);

  // Mock data
  const mockOperations: Operation[] = [
    {
      id: '1',
      symbol: 'BTC/USDT',
      type: 'BUY',
      side: 'LONG',
      amount: 0.5,
      price: 43500.00,
      total: 21750.00,
      profit: 125.50,
      profitPercentage: 0.58,
      status: 'completed',
      exchange: 'Binance',
      strategy: 'IA Águia Premium',
      executedAt: '2025-07-28T10:30:00Z',
      completedAt: '2025-07-28T10:45:00Z',
      duration: 15,
      fees: 21.75,
      slippage: 0.02,
      leverage: 1,
      stopLoss: 42000,
      takeProfit: 44000,
      aiScore: 8.5,
      tags: ['trending', 'high-volume', 'ai-recommended']
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      type: 'SELL',
      side: 'SHORT',
      amount: 2.1,
      price: 2850.00,
      total: 5985.00,
      profit: -45.20,
      profitPercentage: -0.75,
      status: 'completed',
      exchange: 'Binance',
      strategy: 'Scalping Pro',
      executedAt: '2025-07-28T09:15:00Z',
      completedAt: '2025-07-28T09:25:00Z',
      duration: 10,
      fees: 5.99,
      slippage: 0.01,
      leverage: 2,
      stopLoss: 2900,
      takeProfit: 2800,
      aiScore: 6.2,
      tags: ['scalping', 'quick-trade']
    },
    {
      id: '3',
      symbol: 'ADA/USDT',
      type: 'BUY',
      side: 'LONG',
      amount: 1000,
      price: 0.45,
      total: 450.00,
      profit: 23.75,
      profitPercentage: 5.28,
      status: 'completed',
      exchange: 'Bybit',
      strategy: 'DCA Strategy',
      executedAt: '2025-07-28T08:45:00Z',
      completedAt: '2025-07-28T12:30:00Z',
      duration: 225,
      fees: 0.45,
      slippage: 0.00,
      leverage: 1,
      stopLoss: 0.42,
      takeProfit: 0.48,
      aiScore: 7.8,
      tags: ['dca', 'long-term', 'stable']
    },
    {
      id: '4',
      symbol: 'BNB/USDT',
      type: 'BUY',
      side: 'LONG',
      amount: 5,
      price: 315.50,
      total: 1577.50,
      profit: 0,
      profitPercentage: 0,
      status: 'pending',
      exchange: 'Binance',
      strategy: 'Grid Trading',
      executedAt: '2025-07-28T11:00:00Z',
      fees: 1.58,
      slippage: 0,
      leverage: 1,
      stopLoss: 310,
      takeProfit: 320,
      aiScore: 7.1,
      tags: ['grid', 'automated', 'pending']
    },
    {
      id: '5',
      symbol: 'SOL/USDT',
      type: 'SELL',
      side: 'SHORT',
      amount: 10,
      price: 89.50,
      total: 895.00,
      profit: -67.80,
      profitPercentage: -7.57,
      status: 'failed',
      exchange: 'OKX',
      strategy: 'Breakout Strategy',
      executedAt: '2025-07-28T07:30:00Z',
      fees: 0.90,
      slippage: 0.05,
      leverage: 3,
      stopLoss: 95,
      takeProfit: 85,
      aiScore: 5.5,
      tags: ['breakout', 'high-risk', 'failed']
    }
  ];

  const mockStats: OperationsStats = {
    totalOperations: 247,
    successfulOperations: 169,
    failedOperations: 78,
    totalProfit: 2847.50,
    averageProfit: 11.53,
    bestOperation: 245.80,
    worstOperation: -89.20,
    winRate: 68.4,
    averageDuration: 45,
    totalFees: 127.45,
    totalVolume: 125400.00
  };

  useEffect(() => {
    fetchOperations();
    setStats(mockStats);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [operations, filters, searchQuery]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      // In production: const response = await fetch('/api/user/operations');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOperations(mockOperations);
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = operations;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(op =>
        op.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.exchange.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.symbol) {
      filtered = filtered.filter(op => op.symbol === filters.symbol);
    }
    if (filters.exchange) {
      filtered = filtered.filter(op => op.exchange === filters.exchange);
    }
    if (filters.type) {
      filtered = filtered.filter(op => op.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(op => op.status === filters.status);
    }
    if (filters.strategy) {
      filtered = filtered.filter(op => op.strategy === filters.strategy);
    }
    if (filters.minProfit) {
      filtered = filtered.filter(op => op.profit >= parseFloat(filters.minProfit));
    }
    if (filters.maxProfit) {
      filtered = filtered.filter(op => op.profit <= parseFloat(filters.maxProfit));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Operation];
      const bValue = b[sortBy as keyof Operation];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOperations(filtered);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'cancelled': return 'bg-gray-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const exportOperations = () => {
    // In production, this would generate and download a CSV/PDF report
    console.log('Exporting operations...');
  };

  const duplicateOperation = (operation: Operation) => {
    // In production, this would create a new operation based on the selected one
    console.log('Duplicating operation:', operation.id);
  };

  const paginatedOperations = filteredOperations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage);

  // Chart data for operations over time
  const chartData = operations.reduce((acc, op) => {
    const date = new Date(op.executedAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.operations += 1;
      existing.profit += op.profit;
    } else {
      acc.push({
        date,
        operations: 1,
        profit: op.profit
      });
    }
    
    return acc;
  }, [] as Array<{ date: string; operations: number; profit: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-white">Carregando operações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Histórico de Operações
          </h1>
          <p className="text-gray-400 mt-1">
            Visualize e analise todas as suas operações de trading.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={exportOperations}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            onClick={fetchOperations}
            variant="outline"
            className="border-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Operações</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalOperations}</div>
              <p className="text-xs text-gray-400 mt-2">
                {stats.successfulOperations} sucessos, {stats.failedOperations} falhas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Lucro Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(stats.totalProfit)}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Média: {formatCurrency(stats.averageProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Taxa de Sucesso</CardTitle>
              <Target className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.winRate}%</div>
              <p className="text-xs text-gray-400 mt-2">
                Duração média: {stats.averageDuration}min
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Volume Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {formatCurrency(stats.totalVolume)}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Taxas: {formatCurrency(stats.totalFees)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-yellow-400" />
            <span>Filtros e Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar operações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>
            
            <Select value={filters.exchange} onValueChange={(value) => setFilters(prev => ({ ...prev, exchange: value }))}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Exchange" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Exchanges</SelectItem>
                <SelectItem value="Binance">Binance</SelectItem>
                <SelectItem value="Bybit">Bybit</SelectItem>
                <SelectItem value="OKX">OKX</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Tipos</SelectItem>
                <SelectItem value="BUY">Compra</SelectItem>
                <SelectItem value="SELL">Venda</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Lucro mínimo"
              type="number"
              value={filters.minProfit}
              onChange={(e) => setFilters(prev => ({ ...prev, minProfit: e.target.value }))}
              className="bg-gray-800 border-gray-600"
            />
            
            <Input
              placeholder="Lucro máximo"
              type="number"
              value={filters.maxProfit}
              onChange={(e) => setFilters(prev => ({ ...prev, maxProfit: e.target.value }))}
              className="bg-gray-800 border-gray-600"
            />
            
            <Button
              onClick={() => setFilters({
                symbol: '',
                exchange: '',
                type: '',
                status: '',
                strategy: '',
                dateRange: '',
                minProfit: '',
                maxProfit: ''
              })}
              variant="outline"
              className="border-gray-600"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mb-8">
        <CardHeader>
          <CardTitle>Operações e Lucros por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
              <Bar dataKey="operations" fill="#3B82F6" name="Operações" />
              <Bar dataKey="profit" fill="#10B981" name="Lucro (USD)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Operations Table */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Operações</span>
            <span className="text-sm text-gray-400">
              {filteredOperations.length} operações encontradas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Símbolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Estratégia</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOperations.map((operation) => (
                  <TableRow key={operation.id} className="hover:bg-gray-800/50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(operation.status)}
                        <Badge className={`${getStatusColor(operation.status)} text-white text-xs`}>
                          {operation.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{operation.symbol}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {operation.type === 'BUY' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={operation.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                          {operation.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{operation.amount}</TableCell>
                    <TableCell>{formatCurrency(operation.price)}</TableCell>
                    <TableCell>{formatCurrency(operation.total)}</TableCell>
                    <TableCell>
                      <div className={`font-medium ${operation.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(operation.profit)}
                        <div className="text-xs">
                          {formatPercentage(operation.profitPercentage)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{operation.exchange}</TableCell>
                    <TableCell className="text-sm">
                      <div>{operation.strategy}</div>
                      {operation.aiScore && (
                        <div className="text-xs text-yellow-400 flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          AI: {operation.aiScore}/10
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(operation.executedAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(operation.executedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('View details', operation.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateOperation(operation)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportOperations()}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredOperations.length)} de {filteredOperations.length} operações
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gray-600"
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-yellow-600" : "border-gray-600"}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-600"
              >
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOperations;
