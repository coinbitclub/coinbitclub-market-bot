import React from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiActivity, FiUser, FiServer, FiAlertTriangle, FiInfo, FiCheckCircle,
  FiFilter, FiDownload, FiRefreshCw, FiEye, FiSearch, FiClock, FiDatabase 
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'auth' | 'api' | 'system' | 'trading' | 'payment' | 'user_action' | 'ai' | 'webhook';
  message: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  response_time?: number;
  error_details?: string;
  metadata?: any;
}

interface LogStatistics {
  total_logs: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  unique_users: number;
  avg_response_time: number;
  top_endpoints: Array<{endpoint: string, count: number}>;
  error_rate: number;
}

export default function LogsManagement() {
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [dateRange, setDateRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs, error, mutate } = useSWR(`/api/admin/logs?level=${filter}&category=${categoryFilter}&search=${searchTerm}&range=${dateRange}`, {
    refreshInterval: autoRefresh ? 10000 : 0 // Refresh every 10 seconds if auto-refresh is enabled
  });

  const { data: statistics } = useSWR(`/api/admin/logs/stats?range=${dateRange}`);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <FiAlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <FiAlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <FiInfo className="h-4 w-4 text-blue-500" />;
      case 'debug': return <FiActivity className="h-4 w-4 text-gray-500" />;
      default: return <FiInfo className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <FiUser className="h-4 w-4" />;
      case 'api': return <FiServer className="h-4 w-4" />;
      case 'system': return <FiServer className="h-4 w-4" />;
      case 'trading': return <FiActivity className="h-4 w-4" />;
      case 'payment': return <FiCheckCircle className="h-4 w-4" />;
      case 'user_action': return <FiUser className="h-4 w-4" />;
      case 'ai': return <FiDatabase className="h-4 w-4" />;
      case 'webhook': return <FiServer className="h-4 w-4" />;
      default: return <FiInfo className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'auth': return 'Autenticação';
      case 'api': return 'API';
      case 'system': return 'Sistema';
      case 'trading': return 'Trading';
      case 'payment': return 'Pagamento';
      case 'user_action': return 'Ação do Usuário';
      case 'ai': return 'IA';
      case 'webhook': return 'Webhook';
      default: return category;
    }
  };

  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          level: filter, 
          category: categoryFilter, 
          search: searchTerm, 
          range: dateRange 
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Tem certeza que deseja limpar os logs? Esta ação não pode ser desfeita.')) {
      try {
        const response = await fetch('/api/admin/logs/clear', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ range: dateRange })
        });
        
        if (response.ok) {
          mutate();
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
      }
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return '-';
    return `${time}ms`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>LOGS - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">LOGS do Sistema</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Monitoramento e auditoria completa do sistema
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="text-sm text-gray-700">Auto-refresh</span>
                  </label>
                  
                  <button
                    onClick={handleExportLogs}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Exportar
                  </button>
                  
                  <button
                    onClick={handleClearLogs}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    Limpar Logs
                  </button>
                  
                  <button
                    onClick={() => mutate()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiActivity className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total de Logs</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.total_logs}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiAlertTriangle className="h-6 w-6 text-red-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Erros</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.error_count}</dd>
                          <dd className="text-sm text-red-600">{statistics.error_rate.toFixed(2)}% taxa de erro</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiUser className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Usuários Únicos</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.unique_users}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiClock className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Tempo Médio</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {formatResponseTime(statistics.avg_response_time)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1h">Última hora</option>
                      <option value="24h">Últimas 24 horas</option>
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="error">Erros</option>
                      <option value="warning">Avisos</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Todas</option>
                      <option value="auth">Autenticação</option>
                      <option value="api">API</option>
                      <option value="system">Sistema</option>
                      <option value="trading">Trading</option>
                      <option value="payment">Pagamento</option>
                      <option value="user_action">Ação do Usuário</option>
                      <option value="ai">IA</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Endpoints */}
            {statistics && statistics.top_endpoints && statistics.top_endpoints.length > 0 && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Endpoints Mais Acessados
                  </h3>
                  <div className="space-y-2">
                    {statistics.top_endpoints.slice(0, 5).map((endpoint, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{endpoint.endpoint}</span>
                        <span className="text-sm font-medium text-gray-900">{endpoint.count} requests</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Logs Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nível
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mensagem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(logs || []).map((log: LogEntry) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getLevelIcon(log.level)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(log.category)}
                            <span className="text-sm text-gray-900">{getCategoryText(log.category)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.user_email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Detalhes do Log"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Timestamp</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Nível</label>
                <div className="flex items-center space-x-2">
                  {getLevelIcon(selectedLog.level)}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Categoria</label>
              <div className="flex items-center space-x-2">
                {getCategoryIcon(selectedLog.category)}
                <span className="text-sm text-gray-900">{getCategoryText(selectedLog.category)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Mensagem</label>
              <p className="text-sm text-gray-900">{selectedLog.message}</p>
            </div>

            {selectedLog.user_email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Usuário</label>
                <p className="text-sm text-gray-900">{selectedLog.user_email}</p>
              </div>
            )}

            {selectedLog.endpoint && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Endpoint</label>
                  <p className="text-sm text-gray-900">{selectedLog.method} {selectedLog.endpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status / Tempo</label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.status_code} - {formatResponseTime(selectedLog.response_time)}
                  </p>
                </div>
              </div>
            )}

            {selectedLog.ip_address && (
              <div>
                <label className="text-sm font-medium text-gray-500">IP</label>
                <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
              </div>
            )}

            {selectedLog.error_details && (
              <div>
                <label className="text-sm font-medium text-gray-500">Detalhes do Erro</label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-2 rounded overflow-x-auto">
                  {selectedLog.error_details}
                </pre>
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <label className="text-sm font-medium text-gray-500">Metadados</label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}



