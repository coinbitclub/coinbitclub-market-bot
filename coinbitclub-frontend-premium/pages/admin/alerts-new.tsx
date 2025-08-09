import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiBell, FiCheckCircle, FiXCircle, FiClock,
  FiMail, FiMessageSquare, FiPhoneCall, FiZap, FiTarget, FiShield
} from 'react-icons/fi';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  scheduled_for?: string;
  sent_at?: string;
  delivery_status: string;
  recipient: string;
  channels: string[];
  read_count: number;
  click_count: number;
  approval_status: string;
  approved_by?: string;
  approved_at?: string;
}

export default function AlertsManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    sent: 0,
    pending_approval: 0,
    total_reads: 0,
    total_clicks: 0
  });

  // Buscar dados reais da API
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/alerts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts);
        setStats(data.stats);
      } else {
        console.error('Erro ao buscar alertas:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [searchTerm, filterStatus, filterType, filterPriority]);

  // Mock data para demonstração
  useEffect(() => {
    setLoading(true);
    const mockAlerts: Alert[] = [
      {
        id: '1',
        title: 'Operação de Alto Lucro Detectada',
        message: 'BTCUSDT LONG atingiu +5.8% de lucro. Considere realizar parcial.',
        type: 'profit',
        priority: 'high',
        status: 'active',
        created_at: '2024-07-25T09:30:00Z',
        target_users: ['admin', 'traders'],
        channels: ['email', 'push', 'telegram'],
        related_operation: 'OP001',
        action_required: true,
        auto_resolve: false,
        metadata: {
          symbol: 'BTCUSDT',
          amount: 2580.45,
          percentage: 5.8,
          source: 'trading_bot'
        }
      },
      {
        id: '2',
        title: 'Risco de Stop Loss Acionado',
        message: 'ETHUSDT SHORT próxima do stop loss. Preço atual: $2,745.30',
        type: 'warning',
        priority: 'critical',
        status: 'active',
        created_at: '2024-07-25T09:25:00Z',
        target_users: ['admin', 'risk_managers'],
        channels: ['email', 'sms', 'push'],
        related_operation: 'OP002',
        action_required: true,
        auto_resolve: false,
        metadata: {
          symbol: 'ETHUSDT',
          amount: -125.80,
          percentage: -1.2,
          source: 'risk_monitor'
        }
      },
      {
        id: '3',
        title: 'Sistema de Pagamento Restaurado',
        message: 'Conectividade com gateway de pagamento totalmente restaurada.',
        type: 'success',
        priority: 'medium',
        status: 'acknowledged',
        created_at: '2024-07-25T08:45:00Z',
        acknowledged_at: '2024-07-25T08:50:00Z',
        target_users: ['admin', 'finance'],
        channels: ['email', 'push'],
        action_required: false,
        auto_resolve: true,
        metadata: {
          source: 'payment_system'
        }
      },
      {
        id: '4',
        title: 'Novo Usuário VIP Registrado',
        message: 'Cliente premium com depósito inicial de $50,000 completou registro.',
        type: 'info',
        priority: 'medium',
        status: 'resolved',
        created_at: '2024-07-25T07:20:00Z',
        acknowledged_at: '2024-07-25T07:25:00Z',
        resolved_at: '2024-07-25T08:00:00Z',
        target_users: ['admin', 'sales'],
        channels: ['email'],
        related_user: 'user_789',
        action_required: false,
        auto_resolve: true,
        metadata: {
          amount: 50000,
          source: 'registration_system'
        }
      },
      {
        id: '5',
        title: 'Falha na Análise de IA',
        message: 'Módulo de análise AI apresentou erro. Operações manuais recomendadas.',
        type: 'error',
        priority: 'high',
        status: 'active',
        created_at: '2024-07-25T06:15:00Z',
        target_users: ['admin', 'developers'],
        channels: ['email', 'sms', 'push'],
        action_required: true,
        auto_resolve: false,
        metadata: {
          source: 'ai_analysis_module'
        }
      },
      {
        id: '6',
        title: 'Meta de Lucro Mensal Atingida',
        message: 'Parabéns! Meta de 15% de lucro mensal foi atingida com 5 dias de antecedência.',
        type: 'success',
        priority: 'low',
        status: 'dismissed',
        created_at: '2024-07-24T23:30:00Z',
        acknowledged_at: '2024-07-25T08:00:00Z',
        target_users: ['admin', 'investors'],
        channels: ['email', 'push'],
        action_required: false,
        auto_resolve: true,
        metadata: {
          percentage: 15.2,
          source: 'performance_tracker'
        }
      }
    ];

    setAlerts(mockAlerts);
    
    // Calcular estatísticas
    const newStats = {
      total: mockAlerts.length,
      active: mockAlerts.filter(a => a.status === 'active').length,
      acknowledged: mockAlerts.filter(a => a.status === 'acknowledged').length,
      resolved: mockAlerts.filter(a => a.status === 'resolved').length,
      dismissed: mockAlerts.filter(a => a.status === 'dismissed').length,
      critical: mockAlerts.filter(a => a.priority === 'critical').length,
      high: mockAlerts.filter(a => a.priority === 'high').length,
      pending_action: mockAlerts.filter(a => a.action_required && a.status === 'active').length
    };
    
    setStats(newStats);
    setLoading(false);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { 
        ...a, 
        status: 'acknowledged' as const, 
        acknowledged_at: new Date().toISOString() 
      } : a
    ));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { 
        ...a, 
        status: 'resolved' as const, 
        resolved_at: new Date().toISOString() 
      } : a
    ));
  };

  const handleDismiss = (alertId: string) => {
    if (confirm('Confirma a dismissão deste alerta?')) {
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, status: 'dismissed' as const } : a
      ));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'warning': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'error': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'info': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'profit': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'loss': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'system': return 'bg-purple-400/20 text-purple-400 border border-purple-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-yellow-400';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-pink-400/20 text-pink-400 border border-pink-400/50';
      case 'acknowledged': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'resolved': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'dismissed': return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
      default: return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="w-5 h-5" />;
      case 'warning': return <FiAlertTriangle className="w-5 h-5" />;
      case 'error': return <FiXCircle className="w-5 h-5" />;
      case 'info': return <FiBell className="w-5 h-5" />;
      case 'profit': return <FiTrendingUp className="w-5 h-5" />;
      case 'loss': return <FiTarget className="w-5 h-5" />;
      case 'system': return <FiZap className="w-5 h-5" />;
      default: return <FiBell className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Alertas | CoinBitClub Admin</title>
        <meta name="description" content="Alertas - CoinBitClub Admin" />
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
              <a href="/admin/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
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
                <h2 className="text-2xl font-bold text-yellow-400">Alertas</h2>
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
                  <span>Novo Alerta</span>
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
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Ativos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.active}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Confirmados</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.acknowledged}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="text-center">
                  <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Resolvidos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.resolved}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-400/50 shadow-[0_0_20px_rgba(156,163,175,0.3)]">
                <div className="text-center">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Dispensados</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.dismissed}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Críticos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.critical}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Alta Prioridade</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.high}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Ação Req.</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pending_action}</p>
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
                    placeholder="Buscar alertas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                  <option value="info">Informação</option>
                  <option value="profit">Lucro</option>
                  <option value="loss">Perda</option>
                  <option value="system">Sistema</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todas as Prioridades</option>
                  <option value="critical">Crítica</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="acknowledged">Confirmado</option>
                  <option value="resolved">Resolvido</option>
                  <option value="dismissed">Dispensado</option>
                </select>
              </div>
            </div>

            {/* Lista de Alertas */}
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(alert.type)}`}>
                            {getTypeIcon(alert.type)}
                          </div>
                          <div>
                            <h3 className="text-yellow-400 font-bold text-lg">{alert.title}</h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`text-sm font-bold ${getPriorityColor(alert.priority)}`}>
                                {alert.priority.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(alert.status)}`}>
                                {alert.status.toUpperCase()}
                              </span>
                              {alert.action_required && (
                                <span className="px-2 py-1 bg-red-400/20 text-red-400 border border-red-400/50 rounded text-xs font-bold">
                                  AÇÃO REQUERIDA
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-blue-400 mb-4">{alert.message}</p>
                        
                        {alert.metadata && (
                          <div className="bg-black/50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {alert.metadata.symbol && (
                                <div>
                                  <p className="text-pink-400 text-xs font-bold uppercase">Símbolo</p>
                                  <p className="text-yellow-400 font-bold">{alert.metadata.symbol}</p>
                                </div>
                              )}
                              {alert.metadata.amount !== undefined && (
                                <div>
                                  <p className="text-pink-400 text-xs font-bold uppercase">Valor</p>
                                  <p className={`font-bold ${alert.metadata.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${Math.abs(alert.metadata.amount).toFixed(2)}
                                  </p>
                                </div>
                              )}
                              {alert.metadata.percentage !== undefined && (
                                <div>
                                  <p className="text-pink-400 text-xs font-bold uppercase">Percentual</p>
                                  <p className={`font-bold ${alert.metadata.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {alert.metadata.percentage > 0 ? '+' : ''}{alert.metadata.percentage}%
                                  </p>
                                </div>
                              )}
                              {alert.metadata.source && (
                                <div>
                                  <p className="text-pink-400 text-xs font-bold uppercase">Fonte</p>
                                  <p className="text-yellow-400 font-bold capitalize">{alert.metadata.source.replace('_', ' ')}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-blue-400">
                          <span>Criado: {new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                          {alert.acknowledged_at && (
                            <span>Confirmado: {new Date(alert.acknowledged_at).toLocaleString('pt-BR')}</span>
                          )}
                          {alert.resolved_at && (
                            <span>Resolvido: {new Date(alert.resolved_at).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-pink-400 text-xs font-bold">CANAIS:</span>
                            {alert.channels.map((channel, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-400/20 text-blue-400 border border-blue-400/50 rounded text-xs font-bold">
                                {channel.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="p-2 text-yellow-400 hover:text-pink-400 bg-yellow-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                              title="Confirmar Alerta"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="p-2 text-green-400 hover:text-pink-400 bg-green-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                              title="Resolver Alerta"
                            >
                              <FiShield className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="p-2 text-green-400 hover:text-pink-400 bg-green-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                            title="Resolver Alerta"
                          >
                            <FiShield className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="p-2 text-red-400 hover:text-pink-400 bg-red-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                          title="Dispensar Alerta"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                          title="Detalhes"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <FiBell className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhum alerta encontrado</p>
                <p className="text-blue-400">Ajuste os filtros ou aguarde novos alertas</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Alertas - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema de monitoramento e notificações em tempo real</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
