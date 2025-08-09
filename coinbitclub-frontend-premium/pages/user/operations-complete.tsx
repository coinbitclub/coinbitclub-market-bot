import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiActivity, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiRefreshCw, FiEye, FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiArrowUp, FiArrowDown, FiClock, FiZap, FiTarget, FiAlertTriangle
} from 'react-icons/fi';

interface Operation {
  id: string;
  exchange: 'binance' | 'bybit';
  environment: 'production' | 'testnet';
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry_price: number;
  current_price: number;
  quantity: number;
  leverage: number;
  take_profit: number;
  stop_loss: number;
  pnl: number;
  pnl_percentage: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  open_time: string;
  close_time?: string;
  close_reason?: 'TP' | 'SL' | 'MANUAL' | 'AI_INTERVENTION';
  commission_paid: number;
  currency: 'BRL' | 'USD';
}

export default function UserOperations() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [exchange, setExchange] = useState<'all' | 'binance' | 'bybit'>('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          window.location.href = '/auth/login';
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'usuario') {
          window.location.href = '/auth/login';
          return;
        }

        setUser(parsedUser);
        await fetchOperations();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/auth/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchOperations = async () => {
    try {
      const response = await fetch('/api/user/operations');
      const data = await response.json();
      
      if (data.success) {
        setOperations(data.operations);
      }
    } catch (error) {
      console.error('Erro ao buscar operações:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/login';
  };

  const filteredOperations = operations.filter(op => {
    const statusMatch = filter === 'all' || 
                       (filter === 'open' && op.status === 'OPEN') ||
                       (filter === 'closed' && op.status === 'CLOSED');
    const exchangeMatch = exchange === 'all' || op.exchange === exchange;
    return statusMatch && exchangeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'CLOSED': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'CANCELLED': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'LONG' ? 'text-green-400' : 'text-red-400';
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
        <title>Operações | CoinBitClub</title>
        <meta name="description" content="Operações do Usuário - CoinBitClub" />
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="/user/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
              
              <div className="border-t border-yellow-400/30 pt-4 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-6 py-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 border-2 border-transparent hover:border-red-400/50 rounded-xl transition-all duration-300 font-medium"
                >
                  <FiLogOut className="w-6 h-6 mr-4" />
                  <span>Sair</span>
                </button>
              </div>
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
                  onClick={fetchOperations}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Filters */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todas as Operações</option>
                  <option value="open">Operações Abertas</option>
                  <option value="closed">Operações Fechadas</option>
                </select>
                
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value as any)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todas as Exchanges</option>
                  <option value="binance">Binance</option>
                  <option value="bybit">Bybit</option>
                </select>

                <div className="text-yellow-400 text-sm flex items-center">
                  <FiActivity className="w-4 h-4 mr-2" />
                  Total: {filteredOperations.length} operações
                </div>
              </div>
            </div>

            {/* Operations Table */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Exchange/Par</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Direção/Entrada</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Preço Atual</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">TP/SL</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">P&L</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredOperations.map((operation) => (
                      <tr key={operation.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-yellow-400 font-bold">{operation.exchange.toUpperCase()}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${operation.environment === 'production' ? 'bg-green-400/20 text-green-400' : 'bg-orange-400/20 text-orange-400'}`}>
                                {operation.environment === 'production' ? 'PROD' : 'TEST'}
                              </span>
                            </div>
                            <p className="text-white font-bold">{operation.symbol}</p>
                            <p className="text-blue-400 text-sm">{operation.leverage}x leverage</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              {operation.side === 'LONG' ? 
                                <FiArrowUp className="w-4 h-4 text-green-400" /> : 
                                <FiArrowDown className="w-4 h-4 text-red-400" />
                              }
                              <span className={`font-bold ${getSideColor(operation.side)}`}>
                                {operation.side}
                              </span>
                            </div>
                            <p className="text-white font-bold">{operation.entry_price.toFixed(4)}</p>
                            <p className="text-blue-400 text-sm">{operation.quantity} unidades</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-bold text-lg">{operation.current_price.toFixed(4)}</p>
                            <p className="text-blue-400 text-sm">
                              {new Date(operation.open_time).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-1 mb-1">
                              <FiTarget className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 text-sm font-bold">TP: {operation.take_profit.toFixed(4)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FiAlertTriangle className="w-3 h-3 text-red-400" />
                              <span className="text-red-400 text-sm font-bold">SL: {operation.stop_loss.toFixed(4)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className={`text-lg font-bold ${operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {operation.pnl >= 0 ? '+' : ''}{operation.pnl.toFixed(2)} {operation.currency}
                            </p>
                            <p className={`text-sm font-bold ${operation.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {operation.pnl_percentage >= 0 ? '+' : ''}{operation.pnl_percentage.toFixed(2)}%
                            </p>
                            {operation.commission_paid > 0 && (
                              <p className="text-yellow-400 text-xs">
                                Comissão: {operation.commission_paid.toFixed(2)} {operation.currency}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(operation.status)}`}>
                              {operation.status === 'OPEN' && <FiClock className="w-3 h-3 mr-1" />}
                              {operation.status}
                            </span>
                            {operation.close_reason && (
                              <p className="text-blue-400 text-xs mt-1">
                                Fechada por: {operation.close_reason}
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
                            {operation.status === 'OPEN' && (
                              <button
                                className="p-2 text-red-400 hover:text-red-300 bg-red-400/20 hover:bg-red-400/30 rounded-lg transition-colors"
                                title="Fechar Operação"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            )}
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
                <p className="text-blue-400">Suas operações aparecerão aqui quando a IA abrir posições</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Operações - CoinBitClub ⚡</p>
              <p className="text-blue-300">Acompanhe suas operações em tempo real</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
