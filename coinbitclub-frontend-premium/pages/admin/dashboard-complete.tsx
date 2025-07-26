import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiUserCheck, FiDollarSign, FiActivity, FiAlertTriangle, FiCreditCard,
  FiTrendingUp, FiDatabase, FiRefreshCw, FiTarget, FiBell, FiClock,
  FiShield, FiWifi, FiCheckCircle, FiArrowUp, FiArrowDown, FiMinus,
  FiRadio, FiCpu, FiZap, FiEye, FiPercent, FiCalendar, FiTrendingDown,
  FiMonitor
} from 'react-icons/fi';

const AdminDashboard = () => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📊 Buscando dados completos do dashboard...');
      
      const response = await fetch('/api/admin/dashboard-complete-fixed');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Dados recebidos:', result);
      
      setData(result);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getMarketDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG': return <FiArrowUp className="text-green-500" />;
      case 'SHORT': return <FiArrowDown className="text-red-500" />;
      case 'NEUTRO': return <FiMinus className="text-yellow-500" />;
      default: return <FiMinus className="text-gray-500" />;
    }
  };

  const getMarketDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-600 bg-green-50';
      case 'SHORT': return 'text-red-600 bg-red-50';
      case 'NEUTRO': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return <FiCheckCircle className="text-green-500" />;
      case 'offline': return <FiAlertTriangle className="text-red-500" />;
      default: return <FiClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'success': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiAlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Erro: {error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Head>
        <title>Dashboard Admin - CoinBitClub</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {sidebarOpen ? <FiX /> : <FiMenu />}
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Completo - CoinBitClub
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Última atualização: {data?.timestamp ? formatDate(data.timestamp) : '--'}
              </span>
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                title="Atualizar dados"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <FiLogOut />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white shadow-lg transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 md:w-64'
        } ${sidebarOpen ? '' : 'overflow-hidden md:overflow-visible'}`}>
          <div className="p-6">
            <nav className="space-y-2">
              <Link href="/admin/dashboard-new" 
                className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 text-blue-600">
                <FiBarChart />
                <span>Dashboard</span>
              </Link>
              <Link href="/admin/users" 
                className="flex items-center space-x-2 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                <FiUsers />
                <span>Usuários</span>
              </Link>
              <Link href="/admin/operations" 
                className="flex items-center space-x-2 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                <FiActivity />
                <span>Operações</span>
              </Link>
              <Link href="/admin/affiliates" 
                className="flex items-center space-x-2 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                <FiUserCheck />
                <span>Afiliados</span>
              </Link>
              <Link href="/admin/settings" 
                className="flex items-center space-x-2 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                <FiSettings />
                <span>Configurações</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          
          {/* LEITURA DO MERCADO */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FiTarget className="mr-2 text-blue-600" />
                Leitura do Mercado
              </h2>
              <span className="text-sm text-gray-500">
                {data?.marketReading?.lastUpdate ? formatDate(data.marketReading.lastUpdate) : '--'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${getMarketDirectionColor(data?.marketReading?.direction || 'NEUTRO')}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getMarketDirectionIcon(data?.marketReading?.direction || 'NEUTRO')}
                  <span className="font-semibold text-lg">
                    {data?.marketReading?.direction || 'NEUTRO'}
                  </span>
                </div>
                <p className="text-sm opacity-75">Direção do Sistema</p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 text-purple-600">
                <div className="flex items-center space-x-2 mb-2">
                  <FiPercent className="text-purple-500" />
                  <span className="font-semibold text-lg">
                    {data?.marketReading?.confidence || 0}%
                  </span>
                </div>
                <p className="text-sm opacity-75">Confiança</p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50 text-blue-600">
                <div className="flex items-center space-x-2 mb-2">
                  <FiBell className="text-blue-500" />
                  <span className="font-semibold text-sm">
                    Análise Ativa
                  </span>
                </div>
                <p className="text-sm opacity-75">Status do Sistema</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Justificativa:</h3>
              <p className="text-gray-600 text-sm">
                {data?.marketReading?.justification || 'Análise em processamento...'}
              </p>
            </div>
          </div>

          {/* KPIs PRINCIPAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Usuários */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Total</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.users?.total || 0}</p>
                  <p className="text-xs text-green-600">+{data?.users?.newToday || 0} hoje</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <FiUsers className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Operações */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Operações</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.trading?.totalOperations || 0}</p>
                  <p className="text-xs text-orange-600">{data?.trading?.openOperations || 0} abertas</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <FiActivity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Assertividade */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assertividade Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(data?.performance?.accuracy?.today || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Histórico: {formatPercentage(data?.performance?.accuracy?.historical || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <FiTarget className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Retorno */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retorno Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data?.performance?.returns?.today || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(data?.performance?.returns?.historical || 0)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <FiDollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* SINAIS E MICROSERVIÇOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SINAIS COINSTARS */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiRadio className="mr-2 text-yellow-600" />
                Sinais CoinStars
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data?.signals?.coinStars?.slice(0, 5).map((signal: any) => (
                  <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">{signal.symbol}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        signal.signal === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.signal}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{signal.confidence}%</p>
                      <p className="text-xs text-gray-400">{formatDate(signal.time)}</p>
                    </div>
                  </div>
                ))}
                {(!data?.signals?.coinStars || data.signals.coinStars.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Nenhum sinal disponível</p>
                )}
              </div>
            </div>

            {/* SINAIS TRADINGVIEW */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiTrendingUp className="mr-2 text-blue-600" />
                Sinais TradingView
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data?.signals?.tradingView?.slice(0, 5).map((signal: any) => (
                  <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">{signal.symbol}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        signal.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.action}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{signal.source}</p>
                      <p className="text-xs text-gray-400">{formatDate(signal.time)}</p>
                    </div>
                  </div>
                ))}
                {(!data?.signals?.tradingView || data.signals.tradingView.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Nenhum sinal disponível</p>
                )}
              </div>
            </div>
          </div>

          {/* MICROSERVIÇOS */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiCpu className="mr-2 text-green-600" />
              Relatório de Microserviços
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Signal Ingestor</h4>
                  {getStatusIcon(data?.microservices?.signalIngestor?.status || 'offline')}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Processados 24h: {data?.microservices?.signalIngestor?.processed24h || 0}</p>
                  <p>Erros 24h: {data?.microservices?.signalIngestor?.errors24h || 0}</p>
                  <p className="text-xs">
                    Último: {data?.microservices?.signalIngestor?.lastReport ? 
                      formatDate(data.microservices.signalIngestor.lastReport) : '--'}
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Signal Processor</h4>
                  {getStatusIcon(data?.microservices?.signalProcessor?.status || 'offline')}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Processados 24h: {data?.microservices?.signalProcessor?.processed24h || 0}</p>
                  <p>Tempo médio: {data?.microservices?.signalProcessor?.avgProcessingTime || 0}s</p>
                  <p className="text-xs">
                    Último: {data?.microservices?.signalProcessor?.lastReport ? 
                      formatDate(data.microservices.signalProcessor.lastReport) : '--'}
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Decision Engine</h4>
                  {getStatusIcon(data?.microservices?.decisionEngine?.status || 'offline')}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Decisões 24h: {data?.microservices?.decisionEngine?.decisions24h || 0}</p>
                  <p>Precisão: {formatPercentage(data?.microservices?.decisionEngine?.accuracy || 0)}</p>
                  <p className="text-xs">
                    Último: {data?.microservices?.decisionEngine?.lastReport ? 
                      formatDate(data.microservices.decisionEngine.lastReport) : '--'}
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Order Executor</h4>
                  {getStatusIcon(data?.microservices?.orderExecutor?.status || 'offline')}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Executadas 24h: {data?.microservices?.orderExecutor?.executed24h || 0}</p>
                  <p>Taxa sucesso: {formatPercentage(data?.microservices?.orderExecutor?.successRate || 0)}</p>
                  <p className="text-xs">
                    Último: {data?.microservices?.orderExecutor?.lastReport ? 
                      formatDate(data.microservices.orderExecutor.lastReport) : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RELATÓRIOS IA E ATIVIDADES DO SISTEMA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* RELATÓRIOS IA 4H */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiZap className="mr-2 text-purple-600" />
                Relatórios IA (4h)
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data?.aiReports?.map((report: any) => (
                  <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 capitalize">{report.type}</span>
                      <span className="text-sm text-purple-600">{report.confidence}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{report.summary}</p>
                    <p className="text-xs text-gray-400">{formatDate(report.generated_at)}</p>
                  </div>
                ))}
                {(!data?.aiReports || data.aiReports.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Nenhum relatório nas últimas 4h</p>
                )}
              </div>
            </div>

            {/* ATIVIDADES DO SISTEMA */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiMonitor className="mr-2 text-blue-600" />
                Atividades do Sistema
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data?.systemActivities?.slice(0, 10).map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-1 rounded-full ${getSeverityColor(activity.severity)}`}>
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {(!data?.systemActivities || data.systemActivities.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                )}
              </div>
            </div>
          </div>

          {/* OPERAÇÕES EM ANDAMENTO */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiEye className="mr-2 text-orange-600" />
              Operações em Tempo Real
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">ID</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Símbolo</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Lado</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Entrada</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Atual</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">P&L</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Ambiente</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.liveOperations?.map((operation: any) => (
                    <tr key={operation.id} className="border-b">
                      <td className="py-2 text-sm text-gray-800">#{operation.id}</td>
                      <td className="py-2 text-sm font-medium text-gray-800">{operation.symbol}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          operation.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {operation.side}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(operation.status)}`}>
                          {operation.status}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-600">{formatCurrency(operation.entryPrice)}</td>
                      <td className="py-2 text-sm text-gray-600">{formatCurrency(operation.currentPrice)}</td>
                      <td className="py-2">
                        <span className={`text-sm font-medium ${
                          operation.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(operation.unrealizedPnL)}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          operation.environment === 'mainnet' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {operation.environment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.liveOperations || data.liveOperations.length === 0) && (
                <p className="text-gray-500 text-center py-8">Nenhuma operação em andamento</p>
              )}
            </div>
          </div>

          {/* CRESCIMENTO DE USUÁRIOS */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiUsers className="mr-2 text-blue-600" />
              Evolução de Usuários
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Novos Usuários Hoje</p>
                <p className="text-2xl font-bold text-blue-800">{data?.users?.newToday || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Testnet Ativos</p>
                <p className="text-2xl font-bold text-green-800">{data?.users?.activeTestnet || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Mainnet Ativos</p>
                <p className="text-2xl font-bold text-purple-800">{data?.users?.activeMainnet || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Crescimento Diário</p>
                <p className="text-lg font-semibold text-green-600">+{formatPercentage(data?.users?.growth?.daily || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Crescimento Semanal</p>
                <p className="text-lg font-semibold text-blue-600">+{formatPercentage(data?.users?.growth?.weekly || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Crescimento Mensal</p>
                <p className="text-lg font-semibold text-purple-600">+{formatPercentage(data?.users?.growth?.monthly || 0)}</p>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
