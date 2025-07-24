import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface Operation {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  entryPrice: number;
  currentPrice?: number;
  exitPrice?: number;
  quantity: number;
  exchange: string;
  pnl?: number;
  pnlPercent?: number;
  entryTime: string;
  exitTime?: string;
  stopLoss?: number;
  takeProfit?: number;
  signal_source: 'TRADINGVIEW' | 'COINSTATS' | 'MANUAL';
  confidence?: number;
}

const OperacoesAdmin: NextPage = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      // Mock data - integração real será feita aqui
      const mockOperations: Operation[] = [
        {
          id: '1',
          symbol: 'BTCUSDT',
          type: 'LONG',
          status: 'ACTIVE',
          entryPrice: 42500,
          currentPrice: 43200,
          quantity: 0.1,
          exchange: 'Binance',
          pnl: 70,
          pnlPercent: 1.65,
          entryTime: '2024-01-20 09:30:00',
          stopLoss: 41500,
          takeProfit: 44000,
          signal_source: 'TRADINGVIEW',
          confidence: 85
        },
        {
          id: '2',
          symbol: 'ETHUSDT',
          type: 'LONG',
          status: 'CLOSED',
          entryPrice: 2580,
          exitPrice: 2620,
          quantity: 1,
          exchange: 'Bybit',
          pnl: 40,
          pnlPercent: 1.55,
          entryTime: '2024-01-20 08:15:00',
          exitTime: '2024-01-20 10:45:00',
          signal_source: 'COINSTATS',
          confidence: 78
        },
        {
          id: '3',
          symbol: 'ADAUSDT',
          type: 'SHORT',
          status: 'CLOSED',
          entryPrice: 0.52,
          exitPrice: 0.48,
          quantity: 1000,
          exchange: 'Binance',
          pnl: 40,
          pnlPercent: 7.69,
          entryTime: '2024-01-19 14:20:00',
          exitTime: '2024-01-19 18:30:00',
          signal_source: 'TRADINGVIEW',
          confidence: 92
        },
        {
          id: '4',
          symbol: 'SOLUSDT',
          type: 'LONG',
          status: 'CANCELLED',
          entryPrice: 98.5,
          quantity: 2,
          exchange: 'Bybit',
          entryTime: '2024-01-19 11:00:00',
          signal_source: 'MANUAL',
          confidence: 65
        }
      ];
      
      setOperations(mockOperations);
    } catch (error) {
      console.error('Erro ao carregar operações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'CLOSED':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'CANCELLED':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-yellow-400';
      case 'CLOSED': return 'text-green-400';
      case 'CANCELLED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'LONG' 
      ? <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
      : <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />;
  };

  const filteredOperations = operations.filter(op => {
    if (filter !== 'all' && op.status.toLowerCase() !== filter) return false;
    
    if (dateFilter !== 'all') {
      const entryDate = new Date(op.entryTime);
      const now = new Date();
      const diffTime = now.getTime() - entryDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      switch (dateFilter) {
        case 'today':
          if (diffDays > 1) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }
    
    return true;
  });

  const totalPnL = filteredOperations.reduce((sum, op) => sum + (op.pnl || 0), 0);
  const activeOperations = operations.filter(op => op.status === 'ACTIVE').length;
  const closedOperations = operations.filter(op => op.status === 'CLOSED').length;
  const successRate = closedOperations > 0 
    ? (operations.filter(op => op.status === 'CLOSED' && (op.pnl || 0) > 0).length / closedOperations * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando operações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Operações - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Operações">
        <div className="min-h-screen" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{
              background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Gestão de Operações
            </h1>
            <p className="text-gray-400">Controle completo das operações de trading</p>
          </div>

          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Total P&L</h3>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalPnL.toFixed(2)}
              </p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">Operações Ativas</h3>
              <p className="text-2xl font-bold text-white">{activeOperations}</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-green-400">Operações Fechadas</h3>
              <p className="text-2xl font-bold text-white">{closedOperations}</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Taxa de Sucesso</h3>
              <p className="text-2xl font-bold text-white">{successRate}%</p>
            </div>
          </div>

          {/* Filtros */}
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="active">Ativas</option>
                  <option value="closed">Fechadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Operações */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Operações ({filteredOperations.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Tipo</th>
                    <th className="text-left p-3 text-gray-300">Moeda</th>
                    <th className="text-left p-3 text-gray-300">Entrada</th>
                    <th className="text-left p-3 text-gray-300">Atual/Saída</th>
                    <th className="text-left p-3 text-gray-300">Quantidade</th>
                    <th className="text-left p-3 text-gray-300">P&L</th>
                    <th className="text-left p-3 text-gray-300">Exchange</th>
                    <th className="text-left p-3 text-gray-300">Fonte</th>
                    <th className="text-left p-3 text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperations.map((operation) => (
                    <tr key={operation.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(operation.status)}
                          <span className={getStatusColor(operation.status)}>
                            {operation.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(operation.type)}
                          <span className={operation.type === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                            {operation.type}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-white font-semibold">{operation.symbol}</td>
                      <td className="p-3 text-gray-300">${operation.entryPrice.toLocaleString()}</td>
                      <td className="p-3 text-gray-300">
                        {operation.status === 'ACTIVE' && operation.currentPrice
                          ? `$${operation.currentPrice.toLocaleString()}`
                          : operation.exitPrice
                          ? `$${operation.exitPrice.toLocaleString()}`
                          : '-'
                        }
                      </td>
                      <td className="p-3 text-gray-300">{operation.quantity}</td>
                      <td className="p-3">
                        {operation.pnl !== undefined ? (
                          <div className={operation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            <div className="font-semibold">${operation.pnl.toFixed(2)}</div>
                            <div className="text-xs">
                              ({operation.pnl >= 0 ? '+' : ''}{operation.pnlPercent?.toFixed(2)}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-300">{operation.exchange}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          operation.signal_source === 'TRADINGVIEW' ? 'bg-blue-900/50 text-blue-300' :
                          operation.signal_source === 'COINSTATS' ? 'bg-purple-900/50 text-purple-300' :
                          'bg-gray-900/50 text-gray-300'
                        }`}>
                          {operation.signal_source}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedOperation(operation)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOperations.length === 0 && (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhuma operação encontrada</h3>
                <p className="text-gray-500">Não há operações para os filtros selecionados.</p>
              </div>
            )}
          </div>

          {/* Modal de Detalhes */}
          {selectedOperation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div style={cardStyle} className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Detalhes da Operação</h3>
                  <button
                    onClick={() => setSelectedOperation(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">ID da Operação</label>
                      <p className="text-white">{selectedOperation.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Moeda</label>
                      <p className="text-white font-semibold">{selectedOperation.symbol}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(selectedOperation.type)}
                        <span className={selectedOperation.type === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                          {selectedOperation.type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedOperation.status)}
                        <span className={getStatusColor(selectedOperation.status)}>
                          {selectedOperation.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Preço de Entrada</label>
                      <p className="text-white">${selectedOperation.entryPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {selectedOperation.status === 'ACTIVE' ? 'Preço Atual' : 'Preço de Saída'}
                      </label>
                      <p className="text-white">
                        {selectedOperation.status === 'ACTIVE' && selectedOperation.currentPrice
                          ? `$${selectedOperation.currentPrice.toLocaleString()}`
                          : selectedOperation.exitPrice
                          ? `$${selectedOperation.exitPrice.toLocaleString()}`
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade</label>
                      <p className="text-white">{selectedOperation.quantity}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Exchange</label>
                      <p className="text-white">{selectedOperation.exchange}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Fonte do Sinal</label>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedOperation.signal_source === 'TRADINGVIEW' ? 'bg-blue-900/50 text-blue-300' :
                        selectedOperation.signal_source === 'COINSTATS' ? 'bg-purple-900/50 text-purple-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {selectedOperation.signal_source}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Confiança</label>
                      <p className="text-white">{selectedOperation.confidence || '-'}%</p>
                    </div>
                  </div>
                  
                  {selectedOperation.pnl !== undefined && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Resultado</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">P&L</label>
                          <p className={`text-xl font-bold ${selectedOperation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${selectedOperation.pnl.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">P&L %</label>
                          <p className={`text-xl font-bold ${selectedOperation.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedOperation.pnl >= 0 ? '+' : ''}{selectedOperation.pnlPercent?.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Timestamps</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Entrada</label>
                        <p className="text-white">{new Date(selectedOperation.entryTime).toLocaleString('pt-BR')}</p>
                      </div>
                      {selectedOperation.exitTime && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Saída</label>
                          <p className="text-white">{new Date(selectedOperation.exitTime).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
};

export default OperacoesAdmin;
