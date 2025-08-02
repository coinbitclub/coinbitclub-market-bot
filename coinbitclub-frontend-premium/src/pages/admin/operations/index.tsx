import React from 'react';
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface Operation {
  id: string;
  user_name: string;
  user_email: string;
  symbol: string;
  side: string;
  entry_price: number;
  exit_price: number;
  profit_usd: number;
  commission_usd: number;
  affiliate_commission: number;
  affiliate_name: string;
  signal_type: string;
  strategy_used: string;
  opened_at: string;
  closed_at: string;
  status: string;
}

interface OperationStats {
  total_operations: number;
  profitable_operations: number;
  losing_operations: number;
  total_profit: number;
  avg_profit: number;
  operations_24h: number;
  operations_7d: number;
  operations_30d: number;
  top_symbols: Array<{
    symbol: string;
    operation_count: number;
    total_profit: number;
    avg_profit: number;
  }>;
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [stats, setStats] = useState<OperationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [filters, setFilters] = useState({
    symbol: '',
    user_id: '',
    status: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    fetchOperations();
    fetchStats();
  }, [filters]);

  const fetchOperations = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/operations?${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setOperations(data.data);
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/operations/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getWinRate = () => {
    if (!stats || stats.total_operations === 0) return 0;
    return ((stats.profitable_operations / stats.total_operations) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Operações</h1>
          <div className="flex space-x-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Exportar
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Nova Operação
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total de Operações</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_operations}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.operations_24h} nas últimas 24h
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Taxa de Sucesso</h3>
              <p className="text-2xl font-bold text-green-600">{getWinRate()}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.profitable_operations} de {stats.total_operations}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Lucro Total</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_profit)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Média: {formatCurrency(stats.avg_profit)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Período de Atividade</h3>
              <p className="text-lg font-semibold text-blue-600">{stats.operations_7d} (7d)</p>
              <p className="text-lg font-semibold text-purple-600">{stats.operations_30d} (30d)</p>
            </div>
          </div>
        )}

        {/* Top Symbols */}
        {stats?.top_symbols && stats.top_symbols.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Símbolos por Lucro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.top_symbols.slice(0, 5).map((symbol, index) => (
                <div key={symbol.symbol} className="text-center">
                  <div className="font-bold text-lg text-gray-900">{symbol.symbol}</div>
                  <div className="text-sm text-gray-500">{symbol.operation_count} ops</div>
                  <div className={`text-sm font-medium ${getProfitColor(symbol.total_profit)}`}>
                    {formatCurrency(symbol.total_profit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Filtrar por símbolo"
              value={filters.symbol}
              onChange={(e) => setFilters({ ...filters, symbol: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="ID do usuário"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="open">Aberta</option>
              <option value="closed">Fechada</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <button
              onClick={() => setFilters({ symbol: '', user_id: '', status: '', page: 1, limit: 50 })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Operations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Símbolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preços
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lucro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comissões
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{operation.user_name}</div>
                        <div className="text-sm text-gray-500">{operation.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{operation.symbol}</div>
                      <div className="text-sm text-gray-500">{operation.strategy_used}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        operation.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {operation.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Entrada: ${operation.entry_price?.toFixed(4)}</div>
                      <div>Saída: ${operation.exit_price?.toFixed(4)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getProfitColor(operation.profit_usd)}`}>
                        {formatCurrency(operation.profit_usd)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Sistema: {formatCurrency(operation.commission_usd)}</div>
                      {operation.affiliate_commission > 0 && (
                        <div className="text-xs text-gray-500">
                          Afiliado: {formatCurrency(operation.affiliate_commission)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(operation.closed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedOperation(operation)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {operations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Nenhuma operação encontrada</div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}



