import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiPlay, FiPause, FiCheckCircle, FiXCircle,
  FiClock, FiTarget, FiZap, FiTrendingDown, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

interface Operation {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: 'RUNNING' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  entry_price: number;
  current_price: number;
  quantity: number;
  pnl: number;
  pnl_percentage: number;
  start_time: string;
  end_time?: string;
  signal_source: 'tradingview' | 'coinstar' | 'ai_analysis' | 'manual';
  confidence: number;
  risk_level: 'low' | 'medium' | 'high';
  leverage: number;
  stop_loss?: number;
  take_profit?: number;
  user_id?: string;
  user_name?: string;
}

export default function OperationsManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSymbol, setFilterSymbol] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
    total_pnl: 0,
    success_rate: 0
  });

  // Buscar dados reais da API
  const fetchOperations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterSymbol !== 'all') params.append('symbol', filterSymbol);
      if (filterSource !== 'all') params.append('source', filterSource);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/operations?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOperations(data.operations);
        setStats(data.stats);
      } else {
        console.error('Erro ao buscar operações:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [searchTerm, filterStatus, filterSymbol, filterSource]);

  // Atualizar a cada 60 segundos (1 minuto)
  useEffect(() => {
    const interval = setInterval(fetchOperations, 60000);
    return () => clearInterval(interval);
  }, []);

  // Funções para manipular operações
  const handleStopOperation = async (operationId: string) => {
    try {
      const response = await fetch(`/api/admin/operations?id=${operationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      if (response.ok) {
        fetchOperations();
        alert('Operação parada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao parar operação:', error);
    }
  };

  const handleResumeOperation = async (operationId: string) => {
    try {
      const response = await fetch(`/api/admin/operations?id=${operationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' })
      });
      
      if (response.ok) {
        fetchOperations();
        alert('Operação retomada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao retomar operação:', error);
    }
  };

  // Filtrar operações
  const filteredOperations = operations.filter(operation => {
    const matchesSearch = operation.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (operation.user_name && operation.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || operation.status === filterStatus;
    const matchesSymbol = filterSymbol === 'all' || operation.symbol === filterSymbol;
    const matchesSource = filterSource === 'all' || operation.signal_source === filterSource;
    
    return matchesSearch && matchesStatus && matchesSymbol && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-pink-400/20 text-pink-400 border border-pink-400/50';
      case 'PENDING': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'COMPLETED': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'CANCELLED': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'FAILED': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <FiPlay className="w-4 h-4" />;
      case 'PENDING': return <FiClock className="w-4 h-4" />;
      case 'COMPLETED': return <FiCheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <FiPause className="w-4 h-4" />;
      case 'FAILED': return <FiXCircle className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'tradingview': return <FiBarChart className="w-4 h-4" />;
      case 'coinstar': return <FiTarget className="w-4 h-4" />;
      case 'ai_analysis': return <FiZap className="w-4 h-4" />;
      case 'manual': return <FiEdit className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
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
        <title>Operações | CoinBitClub Admin</title>
        <meta name="description" content="Operações - CoinBitClub Admin" />
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
              <a href="/admin/dashboard-executive" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Dashboard Executivo</span>
              </a>
              <a href="/admin/users" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Usuários</span>
              </a>
              <a href="/admin/affiliates" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiShare2 className="w-6 h-6 mr-4" />
                <span>Gestão de Afiliados</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/admin/alerts" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiAlertTriangle className="w-6 h-6 mr-4" />
                <span>Alertas</span>
              </a>
              <a href="/admin/adjustments" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Acertos</span>
              </a>
              <a href="/admin/accounting" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Contabilidade</span>
              </a>
              <a href="/admin/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>
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
                <h2 className="text-2xl font-bold text-yellow-400">Operações</h2>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Atualizar</span>
                </button>
                <button className="flex items-center px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold">
                  <FiPlus className="w-5 h-5 mr-2" />
                  <span>Nova Operação</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Total</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.total}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Ativas</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.running}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Pendentes</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.pending}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="text-center">
                  <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Completas</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.completed}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Canceladas</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.cancelled}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Falharam</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.failed}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">PnL Total</p>
                  <p className={`text-2xl font-bold ${stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${stats.total_pnl.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Taxa Sucesso</p>
                  <p className="text-2xl font-bold text-pink-400">{stats.success_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por símbolo ou usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Status</option>
                  <option value="RUNNING">Ativas</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="COMPLETED">Completas</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="FAILED">Falharam</option>
                </select>
                <select
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Símbolos</option>
                  <option value="BTCUSDT">BTCUSDT</option>
                  <option value="ETHUSDT">ETHUSDT</option>
                  <option value="SOLUSDT">SOLUSDT</option>
                  <option value="ADAUSDT">ADAUSDT</option>
                  <option value="BNBUSDT">BNBUSDT</option>
                </select>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todas as Fontes</option>
                  <option value="tradingview">TradingView</option>
                  <option value="coinstar">CoinStar</option>
                  <option value="ai_analysis">Análise IA</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>

            {/* Tabela de Operações */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Operação</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Entrada/Atual</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">PnL</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Detalhes</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Fonte</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredOperations.map((operation) => (
                      <tr key={operation.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold text-lg">{operation.symbol}</p>
                            <div className="flex items-center mt-1">
                              {operation.side === 'LONG' ? (
                                <FiArrowUp className="w-4 h-4 mr-1 text-green-400" />
                              ) : (
                                <FiArrowDown className="w-4 h-4 mr-1 text-red-400" />
                              )}
                              <span className={`text-sm font-bold ${operation.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                                {operation.side}
                              </span>
                              <span className="ml-2 text-xs text-blue-400">x{operation.leverage}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-blue-400 text-sm">Entrada: <span className="text-yellow-400 font-bold">${operation.entry_price.toFixed(2)}</span></p>
                            <p className="text-blue-400 text-sm">Atual: <span className="text-pink-400 font-bold">${operation.current_price.toFixed(2)}</span></p>
                            <p className="text-blue-400 text-sm">Qty: <span className="text-yellow-400">{operation.quantity}</span></p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className={`text-lg font-bold ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {operation.pnl >= 0 ? '+' : ''}${operation.pnl.toFixed(2)}
                            </p>
                            <p className={`text-sm font-bold ${operation.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {operation.pnl_percentage >= 0 ? '+' : ''}{operation.pnl_percentage.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-blue-400 text-sm">SL: <span className="text-red-400">${operation.stop_loss?.toFixed(2) || 'N/A'}</span></p>
                            <p className="text-blue-400 text-sm">TP: <span className="text-green-400">${operation.take_profit?.toFixed(2) || 'N/A'}</span></p>
                            <p className={`text-xs font-bold ${getRiskColor(operation.risk_level)}`}>
                              Risco: {operation.risk_level.toUpperCase()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getSourceIcon(operation.signal_source)}
                            <div className="ml-2">
                              <p className="text-yellow-400 text-sm font-bold capitalize">{operation.signal_source.replace('_', ' ')}</p>
                              <p className="text-blue-400 text-xs">Conf: {operation.confidence}%</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(operation.status)}`}>
                            {getStatusIcon(operation.status)}
                            <span className="ml-2">{operation.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold">{operation.user_name || 'Sistema'}</p>
                            <p className="text-blue-400 text-xs">
                              Início: {new Date(operation.start_time).toLocaleString('pt-BR')}
                            </p>
                            {operation.end_time && (
                              <p className="text-pink-400 text-xs">
                                Fim: {new Date(operation.end_time).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              className="p-2 text-yellow-400 hover:text-pink-400 bg-yellow-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                              title="Visualizar Detalhes"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {operation.status === 'RUNNING' && (
                              <button
                                onClick={() => handleStopOperation(operation.id)}
                                className="p-2 text-red-400 hover:text-pink-400 bg-red-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                title="Parar Operação"
                              >
                                <FiPause className="w-4 h-4" />
                              </button>
                            )}
                            {operation.status === 'PENDING' && (
                              <button
                                onClick={() => handleResumeOperation(operation.id)}
                                className="p-2 text-green-400 hover:text-pink-400 bg-green-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                title="Iniciar Operação"
                              >
                                <FiPlay className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Relatório"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredOperations.length === 0 && (
              <div className="text-center py-12">
                <FiActivity className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhuma operação encontrada</p>
                <p className="text-blue-400">Ajuste os filtros ou inicie novas operações</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Operações - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema de operações automatizadas em tempo real</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
