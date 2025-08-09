import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiBarChart, FiSettings, FiMenu, FiX, FiActivity,
  FiDollarSign, FiTrendingUp, FiRefreshCw, FiSearch, FiFilter,
  FiShield, FiClock, FiCheckCircle, FiXCircle, FiPlay, FiPause,
  FiArrowUp, FiArrowDown, FiEye, FiDownload, FiCreditCard
} from 'react-icons/fi';

interface Operation {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  entry_price: number;
  exit_price?: number;
  current_price?: number;
  quantity: number;
  pnl: number;
  pnl_percentage: number;
  exchange: 'binance' | 'bybit';
  environment: 'testnet' | 'production';
  start_time: string;
  end_time?: string;
  signal_source: string;
}

interface OperationsData {
  operations: Operation[];
  stats: {
    total_operations: number;
    running_operations: number;
    completed_operations: number;
    success_rate: number;
    total_pnl: number;
    avg_pnl: number;
  };
  user: {
    name: string;
    plan_type: string;
    account_type: string;
  };
}

export default function UserOperations() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [operationsData, setOperationsData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExchange, setFilterExchange] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterExchange !== 'all') params.append('exchange', filterExchange);
      if (searchTerm) params.append('search', searchTerm);
      params.append('period', selectedPeriod);

      const response = await fetch(`/api/user/operations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setOperationsData(data);
      } else {
        console.error('Erro ao buscar operações');
        setOperationsData(getMockData());
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setOperationsData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): OperationsData => ({
    operations: [
      {
        id: '1',
        symbol: 'BTCUSDT',
        side: 'LONG',
        status: 'RUNNING',
        entry_price: 43250.75,
        current_price: 43890.20,
        quantity: 0.5,
        pnl: 319.73,
        pnl_percentage: 1.48,
        exchange: 'binance',
        environment: 'production',
        start_time: '2024-07-25T08:30:00Z',
        signal_source: 'TradingView'
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        side: 'LONG',
        status: 'COMPLETED',
        entry_price: 2680.50,
        exit_price: 2745.30,
        quantity: 2.0,
        pnl: 129.60,
        pnl_percentage: 2.42,
        exchange: 'bybit',
        environment: 'production',
        start_time: '2024-07-24T07:15:00Z',
        end_time: '2024-07-25T02:30:00Z',
        signal_source: 'AI Analysis'
      },
      {
        id: '3',
        symbol: 'SOLUSDT',
        side: 'SHORT',
        status: 'COMPLETED',
        entry_price: 195.75,
        exit_price: 188.20,
        quantity: 10.0,
        pnl: 755.00,
        pnl_percentage: 3.86,
        exchange: 'binance',
        environment: 'testnet',
        start_time: '2024-07-23T14:20:00Z',
        end_time: '2024-07-24T10:15:00Z',
        signal_source: 'CoinStar'
      }
    ],
    stats: {
      total_operations: 156,
      running_operations: 3,
      completed_operations: 153,
      success_rate: 87.2,
      total_pnl: 15847.65,
      avg_pnl: 103.44
    },
    user: {
      name: 'João Silva',
      plan_type: 'premium',
      account_type: 'production'
    }
  });

  useEffect(() => {
    fetchOperations();
  }, [searchTerm, filterStatus, filterExchange, selectedPeriod]);

  useEffect(() => {
    const interval = setInterval(fetchOperations, 60000);
    return () => clearInterval(interval);
  }, []);

  const data = operationsData || getMockData();

  const filteredOperations = data.operations.filter(operation => {
    const matchesSearch = operation.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'COMPLETED': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'CANCELLED': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <FiPlay className="w-4 h-4" />;
      case 'COMPLETED': return <FiCheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <FiXCircle className="w-4 h-4" />;
      default: return <FiPause className="w-4 h-4" />;
    }
  };

  const getSideIcon = (side: string) => {
    return side === 'LONG' ? <FiArrowUp className="w-4 h-4 text-green-400" /> : <FiArrowDown className="w-4 h-4 text-red-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Operações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Minhas Operações | CoinBitClub</title>
        <meta name="description" content="Extrato completo de operações - CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64`}>
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
            <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-yellow-400 hover:text-pink-400"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-3">
              <a href="/user/dashboard" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/user/operations" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiCreditCard className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="/user/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 border border-yellow-400/30 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-400">
                <FiShield className="w-4 h-4 mr-2 text-pink-400" />
                {data.user.name}
              </div>
              <p className="text-xs text-blue-400 mt-1">
                {data.user.plan_type} • {data.user.account_type}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:w-0">
          {/* Header */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-yellow-400">Minhas Operações</h2>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchOperations}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  <span>Atualizar</span>
                </button>
                <button className="flex items-center px-4 py-2 text-green-400 bg-green-400/20 border border-green-400/50 rounded-lg hover:bg-green-400/30 transition-colors">
                  <FiDownload className="w-4 h-4 mr-2" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-black min-h-screen">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center">
                  <FiBarChart className="w-8 h-8 text-blue-400 mr-4" />
                  <div>
                    <p className="text-blue-300 text-sm">Total</p>
                    <p className="text-2xl font-bold text-blue-400">{data.stats.total_operations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center">
                  <FiPlay className="w-8 h-8 text-green-400 mr-4" />
                  <div>
                    <p className="text-green-300 text-sm">Ativas</p>
                    <p className="text-2xl font-bold text-green-400">{data.stats.running_operations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <div className="flex items-center">
                  <FiCheckCircle className="w-8 h-8 text-purple-400 mr-4" />
                  <div>
                    <p className="text-purple-300 text-sm">Finalizadas</p>
                    <p className="text-2xl font-bold text-purple-400">{data.stats.completed_operations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="flex items-center">
                  <FiTrendingUp className="w-8 h-8 text-yellow-400 mr-4" />
                  <div>
                    <p className="text-yellow-300 text-sm">Assertividade</p>
                    <p className="text-2xl font-bold text-yellow-400">{data.stats.success_rate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="flex items-center">
                  <FiDollarSign className="w-8 h-8 text-pink-400 mr-4" />
                  <div>
                    <p className="text-pink-300 text-sm">P&L Total</p>
                    <p className="text-2xl font-bold text-pink-400">
                      ${data.stats.total_pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <div className="flex items-center">
                  <FiActivity className="w-8 h-8 text-cyan-400 mr-4" />
                  <div>
                    <p className="text-cyan-300 text-sm">P&L Médio</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      ${data.stats.avg_pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Buscar por símbolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 placeholder-blue-400/50 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="RUNNING">Em Andamento</option>
                    <option value="COMPLETED">Finalizadas</option>
                    <option value="CANCELLED">Canceladas</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterExchange}
                    onChange={(e) => setFilterExchange(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">Todas as Exchanges</option>
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="all">Todas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabela de Operações */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border border-yellow-400/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Símbolo</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Lado</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Entrada</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Saída/Atual</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">P&L</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Exchange</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperations.map((operation) => (
                      <tr key={operation.id} className="border-t border-yellow-400/20 hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getSideIcon(operation.side)}
                            <span className="ml-2 text-blue-400 font-medium">{operation.symbol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            operation.side === 'LONG' 
                              ? 'bg-green-400/20 text-green-400 border border-green-400/50' 
                              : 'bg-red-400/20 text-red-400 border border-red-400/50'
                          }`}>
                            {operation.side}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-blue-400 font-medium">
                            ${operation.entry_price.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-blue-400 font-medium">
                            ${(operation.exit_price || operation.current_price || 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className={`font-medium ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {operation.pnl >= 0 ? '+' : ''}${operation.pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm ${operation.pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {operation.pnl >= 0 ? '+' : ''}{operation.pnl_percentage.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-blue-400 font-medium capitalize">{operation.exchange}</p>
                            <p className={`text-sm ${operation.environment === 'production' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {operation.environment === 'production' ? 'Produção' : 'Testnet'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(operation.status)}`}>
                            {getStatusIcon(operation.status)}
                            <span className="ml-2">
                              {operation.status === 'RUNNING' ? 'Em Andamento' : 
                               operation.status === 'COMPLETED' ? 'Finalizada' : 'Cancelada'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-blue-400 text-sm">
                              {new Date(operation.start_time).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-blue-300 text-xs">
                              {new Date(operation.start_time).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOperations.length === 0 && (
                <div className="text-center py-12">
                  <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma operação encontrada</p>
                  <p className="text-gray-500 text-sm mt-2">Ajuste os filtros para ver mais resultados</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
