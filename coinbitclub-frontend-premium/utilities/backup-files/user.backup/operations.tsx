import React, { useState, useEffect } from 'react';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import FormInput from '../../src/components/FormInput';
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Operation {
  id: string;
  exchange: string;
  symbol: string;
  type: string;
  status: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit?: number;
  result?: number;
  resultPercentage?: number;
  investedAmount: number;
  openedAt: string;
  closedAt?: string;
  aiJustification?: string;
  commission: number;
  fees: number;
  duration?: number; // in hours
}

interface OperationsStats {
  totalOperations: number;
  profitableOperations: number;
  lossOperations: number;
  successRate: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  averageResult: number;
  totalFees: number;
}

const UserOperations: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [stats, setStats] = useState<OperationsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [showJustificationModal, setShowJustificationModal] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    exchange: '',
    symbol: '',
    type: '',
    status: 'closed'
  });

  // Paginação
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadOperations();
  }, [filters, pagination.page]);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/user/operations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations);
        setStats(data.stats);
        setPagination({
          ...pagination,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        });
      } else {
        toast.error('Erro ao carregar operações');
      }
    } catch (error) {
      toast.error('Erro ao carregar operações');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (operations.length === 0) {
      toast.error('Nenhuma operação para exportar');
      return;
    }

    const headers = [
      'Data Abertura',
      'Data Fechamento',
      'Moeda',
      'Exchange',
      'Tipo',
      'Entrada',
      'Saída',
      'Quantidade',
      'Alavancagem',
      'Stop Loss',
      'Take Profit',
      'Resultado USD',
      'Resultado %',
      'Investido',
      'Comissão',
      'Taxas',
      'Duração (h)',
      'Justificativa IA'
    ];

    const csvData = operations.map(op => [
      new Date(op.openedAt).toLocaleString('pt-BR'),
      op.closedAt ? new Date(op.closedAt).toLocaleString('pt-BR') : '',
      op.symbol,
      op.exchange.toUpperCase(),
      op.type,
      op.entryPrice.toFixed(4),
      op.exitPrice?.toFixed(4) || '',
      op.quantity.toFixed(4),
      op.leverage,
      op.stopLoss.toFixed(4),
      op.takeProfit?.toFixed(4) || '',
      op.result?.toFixed(2) || '',
      op.resultPercentage?.toFixed(2) || '',
      op.investedAmount.toFixed(2),
      op.commission.toFixed(2),
      op.fees.toFixed(2),
      op.duration || '',
      op.aiJustification || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `operacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      exchange: '',
      symbol: '',
      type: '',
      status: 'closed'
    });
    setPagination({ ...pagination, page: 1 });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getResultColor = (result?: number) => {
    if (!result) return 'text-gray-500';
    return result > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operações de Trading</h1>
          <p className="text-gray-600">Histórico completo das suas operações</p>
        </div>

        {/* Estatísticas do Período */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resultado Líquido</p>
                  <p className={`text-2xl font-bold ${getResultColor(stats.netResult)}`}>
                    {formatCurrency(stats.netResult)}
                  </p>
                </div>
                {stats.netResult > 0 ? (
                  <TrendingUp className="size-12 text-green-500" />
                ) : (
                  <TrendingDown className="size-12 text-red-500" />
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Lucro: {formatCurrency(stats.totalProfit)} • 
                Perda: {formatCurrency(stats.totalLoss)}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.successRate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {stats.profitableOperations}/{stats.totalOperations}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resultado Médio</p>
                  <p className={`text-2xl font-bold ${getResultColor(stats.averageResult)}`}>
                    {formatCurrency(stats.averageResult)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total em Taxas</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.totalFees)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtros</h3>
            <div className="flex gap-2">
              <Button onClick={resetFilters} className="bg-gray-500 hover:bg-gray-600">
                Limpar Filtros
              </Button>
              <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 size-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1 inline size-4" />
                Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) = /> setFilters({ ...filters, startDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1 inline size-4" />
                Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) = /> setFilters({ ...filters, endDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Exchange</label>
              <select
                value={filters.exchange}
                onChange={(e) => setFilters({ ...filters, exchange: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Todas</option>
                <option value="binance">Binance</option>
                <option value="bybit">Bybit</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Símbolo</label>
              <input
                type="text"
                value={filters.symbol}
                onChange={(e) = /> setFilters({ ...filters, symbol: e.target.value })}
                placeholder="Ex: BTC, ETH..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="open">Abertas</option>
                <option value="closed">Fechadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={() => setPagination({ ...pagination, page: 1 })} className="bg-blue-600 hover:bg-blue-700">
              <Filter className="mr-2 size-4" />
              Aplicar Filtros
            </Button>
          </div>
        </Card>

        {/* Tabela de Operações */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Operações ({pagination.total})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : operations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Moeda</th>
                    <th className="p-3 text-left">Exchange</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Entrada</th>
                    <th className="p-3 text-left">Saída</th>
                    <th className="p-3 text-left">Alavancagem</th>
                    <th className="p-3 text-left">Resultado</th>
                    <th className="p-3 text-left">%</th>
                    <th className="p-3 text-left">Duração</th>
                    <th className="p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((operation) => (
                    <tr key={operation.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{formatDate(operation.openedAt)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(operation.openedAt).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{operation.symbol}</span>
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs uppercase">
                          {operation.exchange}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs ${
                          operation.type === 'LONG' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {operation.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs ${getStatusColor(operation.status)}`}>
                          {operation.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm">
                          ${operation.entryPrice.toFixed(4)}
                        </span>
                      </td>
                      <td className="p-3">
                        {operation.exitPrice ? (
                          <span className="font-mono text-sm">
                            ${operation.exitPrice.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{operation.leverage}x</span>
                      </td>
                      <td className="p-3">
                        {operation.result !== undefined ? (
                          <span className={`font-medium ${getResultColor(operation.result)}`}>
                            {formatCurrency(operation.result)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {operation.resultPercentage !== undefined ? (
                          <span className={`font-medium ${getResultColor(operation.result)}`}>
                            {operation.resultPercentage > 0 ? '+' : ''}{operation.resultPercentage.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {operation.duration ? (
                          <span className="text-sm">{operation.duration}h</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {operation.result !== undefined && operation.result < 0 && operation.aiJustification && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOperation(operation);
                              setShowJustificationModal(true);
                            }}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Eye className="size-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto mb-4 size-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">Nenhuma operação encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou aguarde novas operações</p>
            </div>
          )}

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Anterior
                </Button>
                <span className="rounded bg-gray-100 px-3 py-1">
                  {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Justificativa da IA */}
      {showJustificationModal && selectedOperation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-xl font-bold">Justificativa da IA</h2>
                <Button
                  onClick={() => setShowJustificationModal(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Fechar
                </Button>
              </div>
              
              <div className="mb-4 rounded-lg bg-red-50 p-4">
                <div className="mb-2 flex items-center">
                  <AlertTriangle className="mr-2 size-5 text-red-500" />
                  <span className="font-medium text-red-800">Operação com Resultado Negativo</span>
                </div>
                <div className="text-sm text-red-700">
                  <strong>{selectedOperation.symbol}</strong> • 
                  <strong> {selectedOperation.type}</strong> • 
                  <strong> {formatCurrency(selectedOperation.result!)}</strong>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <h3 className="mb-3 text-lg font-semibold">Análise da IA:</h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedOperation.aiJustification}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4 text-sm text-gray-500">
                <div><strong>Operação:</strong> {selectedOperation.id}</div>
                <div><strong>Data:</strong> {formatDateTime(selectedOperation.openedAt)}</div>
                {selectedOperation.closedAt && (
                  <div><strong>Fechada em:</strong> {formatDateTime(selectedOperation.closedAt)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOperations;
