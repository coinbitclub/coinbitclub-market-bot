import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiAlertTriangle, FiAlertCircle, FiInfo, FiCheck, FiX, 
  FiRefreshCw, FiFilter, FiSearch, FiClock, FiActivity 
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'system' | 'refund' | 'commission' | 'ai' | 'operation';
  title: string;
  message: string;
  data?: any;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export default function AlertsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showResolved, setShowResolved] = useState(false);

  const { data: alertsData, error, mutate } = useSWR('/api/admin/alerts', {
    refreshInterval: 10000 // Refresh every 10 seconds
  });

  const alerts = alertsData?.alerts || [];

  // Filter alerts
  const filteredAlerts = alerts.filter((alert: Alert) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;
    const matchesResolved = showResolved || !alert.resolved;
    return matchesSearch && matchesType && matchesCategory && matchesResolved;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <FiAlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <FiAlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <FiInfo className="h-5 w-5 text-blue-500" />;
      case 'success': return <FiCheck className="h-5 w-5 text-green-500" />;
      default: return <FiInfo className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      system: 'bg-purple-100 text-purple-800',
      refund: 'bg-yellow-100 text-yellow-800',
      commission: 'bg-blue-100 text-blue-800',
      ai: 'bg-green-100 text-green-800',
      operation: 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  // Count alerts by type
  const alertCounts = alerts.reduce((acc: any, alert: Alert) => {
    if (!alert.resolved) {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Alertas do Sistema - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Alertas do Sistema</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Monitor de problemas críticos e notificações importantes
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => mutate()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiRefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Alert Counts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiAlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Críticos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {alertCounts.critical || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Avisos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {alertCounts.warning || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiInfo className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Informativos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {alertCounts.info || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiActivity className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Ativos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {alerts.filter((a: Alert) => !a.resolved).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar alertas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="critical">Crítico</option>
                  <option value="warning">Aviso</option>
                  <option value="info">Informativo</option>
                  <option value="success">Sucesso</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="system">Sistema</option>
                  <option value="refund">Reembolso</option>
                  <option value="commission">Comissão</option>
                  <option value="ai">IA</option>
                  <option value="operation">Operação</option>
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar resolvidos</span>
                </label>
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <FiCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum alerta encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {alerts.length === 0 ? 'Não há alertas no sistema.' : 'Tente ajustar os filtros.'}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert: Alert) => (
                  <div
                    key={alert.id}
                    className={`p-6 rounded-lg border ${getAlertColor(alert.type)} ${
                      alert.resolved ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {alert.title}
                            </h3>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(alert.category)}`}>
                              {alert.category}
                            </span>
                            {alert.resolved && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Resolvido
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {alert.message}
                          </p>
                          
                          {alert.data && (
                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Dados Adicionais:</h4>
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(alert.data, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center space-x-1">
                              <FiClock className="h-3 w-3" />
                              <span>{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            {alert.resolved_at && (
                              <div className="flex items-center space-x-1">
                                <FiCheck className="h-3 w-3" />
                                <span>
                                  Resolvido em {new Date(alert.resolved_at).toLocaleString('pt-BR')}
                                  {alert.resolved_by && ` por ${alert.resolved_by}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!alert.resolved && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                          >
                            <FiCheck className="mr-1 h-3 w-3" />
                            Resolver
                          </button>
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <FiX className="mr-1 h-3 w-3" />
                            Dispensar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
