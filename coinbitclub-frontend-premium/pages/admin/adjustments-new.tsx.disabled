import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiCheck, FiCheckCircle, FiXCircle, FiClock,
  FiCalendar, FiUser, FiCreditCard, FiTarget, FiZap, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

interface Adjustment {
  id: string;
  user_id: string;
  user_name: string;
  type: string;
  amount: number;
  currency: string;
  reason: string;
  description: string;
  status: string;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  reference_id: string;
  category: string;
  requires_approval: boolean;
  approval_notes?: string;
}

export default function AdjustmentsManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total_credits: 0,
    total_debits: 0,
    total_bonuses: 0,
    net_amount: 0
    approved: 0,
    rejected: 0,
    executed: 0,
    cancelled: 0,
    total_amount: 0,
    credits_amount: 0,
    debits_amount: 0
  });

  // Mock data para demonstração
  useEffect(() => {
    setLoading(true);
    // Simular dados de acertos
    const mockAdjustments: Adjustment[] = [
      {
        id: '1',
        user_id: 'user_001',
        user_name: 'João Silva',
        user_email: 'joao.silva@email.com',
        type: 'bonus',
        amount: 500.00,
        currency: 'USD',
        reason: 'Bônus de Fidelidade',
        description: 'Bônus mensal por manter conta premium ativa por 12 meses consecutivos.',
        status: 'approved',
        priority: 'medium',
        created_at: '2024-07-25T09:00:00Z',
        approved_at: '2024-07-25T09:15:00Z',
        approved_by: 'admin_carlos',
        reference_id: 'BONUS_2024_07_001',
        metadata: {
          notes: 'Cliente VIP - bonus automático aprovado'
        }
      },
      {
        id: '2',
        user_id: 'user_002',
        user_name: 'Maria Santos',
        user_email: 'maria.santos@email.com',
        type: 'refund',
        amount: 250.75,
        currency: 'USDT',
        reason: 'Reembolso por Falha no Sistema',
        description: 'Reembolso devido a falha no sistema que causou perda na operação BTCUSDT.',
        status: 'executed',
        priority: 'high',
        created_at: '2024-07-25T08:30:00Z',
        approved_at: '2024-07-25T08:45:00Z',
        executed_at: '2024-07-25T09:00:00Z',
        approved_by: 'admin_ana',
        executed_by: 'system_auto',
        reference_id: 'REF_2024_07_002',
        transaction_hash: '0x1234567890abcdef...',
        metadata: {
          operation_id: 'OP_BTC_001',
          original_amount: 250.75,
          exchange_rate: 1.0,
          fee: 0.0
        }
      },
      {
        id: '3',
        user_id: 'user_003',
        user_name: 'Carlos Lima',
        user_email: 'carlos.lima@email.com',
        type: 'commission',
        amount: 125.00,
        currency: 'USD',
        reason: 'Comissão de Afiliado',
        description: 'Comissão referente a 5 novos usuários registrados em julho/2024.',
        status: 'pending',
        priority: 'medium',
        created_at: '2024-07-25T07:45:00Z',
        reference_id: 'COMM_2024_07_003',
        metadata: {
          affiliate_id: 'AFF_CARLOS_001',
          notes: 'Aguardando aprovação mensal'
        }
      },
      {
        id: '4',
        user_id: 'user_004',
        user_name: 'Ana Costa',
        user_email: 'ana.costa@email.com',
        type: 'penalty',
        amount: -75.00,
        currency: 'USD',
        reason: 'Penalidade por Violação de Termos',
        description: 'Penalidade aplicada por tentativa de manipulação de preços.',
        status: 'rejected',
        priority: 'high',
        created_at: '2024-07-24T16:20:00Z',
        reference_id: 'PEN_2024_07_004',
        metadata: {
          notes: 'Revisão necessária - evidências insuficientes'
        }
      },
      {
        id: '5',
        user_id: 'user_005',
        user_name: 'Roberto Silva',
        user_email: 'roberto.silva@email.com',
        type: 'correction',
        amount: 1250.00,
        currency: 'BTC',
        reason: 'Correção de Saldo',
        description: 'Correção de saldo devido a erro no cálculo de PnL da operação ETH.',
        status: 'pending',
        priority: 'urgent',
        created_at: '2024-07-25T10:15:00Z',
        reference_id: 'CORR_2024_07_005',
        metadata: {
          operation_id: 'OP_ETH_025',
          original_amount: 1180.50,
          exchange_rate: 0.02857,
          notes: 'Erro identificado no algoritmo de cálculo'
        }
      },
      {
        id: '6',
        user_id: 'user_006',
        user_name: 'Patricia Ferreira',
        user_email: 'patricia.ferreira@email.com',
        type: 'credit',
        amount: 2000.00,
        currency: 'USD',
        reason: 'Depósito Manual',
        description: 'Depósito via transferência bancária processado manualmente.',
        status: 'executed',
        priority: 'medium',
        created_at: '2024-07-24T14:30:00Z',
        approved_at: '2024-07-24T14:45:00Z',
        executed_at: '2024-07-24T15:00:00Z',
        approved_by: 'admin_carlos',
        executed_by: 'finance_team',
        reference_id: 'DEP_2024_07_006',
        transaction_hash: '0xabcdef1234567890...',
        metadata: {
          fee: 25.00,
          notes: 'Transferência internacional aprovada'
        }
      }
    ];

    setAdjustments(mockAdjustments);
    
    // Calcular estatísticas
    const newStats = {
      total: mockAdjustments.length,
      pending: mockAdjustments.filter(a => a.status === 'pending').length,
      approved: mockAdjustments.filter(a => a.status === 'approved').length,
      rejected: mockAdjustments.filter(a => a.status === 'rejected').length,
      executed: mockAdjustments.filter(a => a.status === 'executed').length,
      cancelled: mockAdjustments.filter(a => a.status === 'cancelled').length,
      total_amount: mockAdjustments.reduce((sum, a) => sum + (a.currency === 'USD' ? a.amount : 0), 0),
      credits_amount: mockAdjustments.filter(a => a.amount > 0 && a.currency === 'USD').reduce((sum, a) => sum + a.amount, 0),
      debits_amount: mockAdjustments.filter(a => a.amount < 0 && a.currency === 'USD').reduce((sum, a) => sum + Math.abs(a.amount), 0)
    };
    
    setStats(newStats);
    setLoading(false);
  }, []);

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = adjustment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || adjustment.type === filterType;
    const matchesStatus = filterStatus === 'all' || adjustment.status === filterStatus;
    const matchesCurrency = filterCurrency === 'all' || adjustment.currency === filterCurrency;
    
    return matchesSearch && matchesType && matchesStatus && matchesCurrency;
  });

  const handleApprove = (adjustmentId: string) => {
    if (confirm('Confirma a aprovação deste acerto?')) {
      setAdjustments(adjustments.map(a => 
        a.id === adjustmentId ? { 
          ...a, 
          status: 'approved' as const, 
          approved_at: new Date().toISOString(),
          approved_by: 'current_admin'
        } : a
      ));
      alert('Acerto aprovado com sucesso!');
    }
  };

  const handleReject = (adjustmentId: string) => {
    const reason = prompt('Digite o motivo da rejeição:');
    if (reason) {
      setAdjustments(adjustments.map(a => 
        a.id === adjustmentId ? { 
          ...a, 
          status: 'rejected' as const,
          metadata: { ...a.metadata, rejection_reason: reason }
        } : a
      ));
      alert('Acerto rejeitado com sucesso!');
    }
  };

  const handleExecute = (adjustmentId: string) => {
    if (confirm('Confirma a execução deste acerto? Esta ação é irreversível.')) {
      setAdjustments(adjustments.map(a => 
        a.id === adjustmentId ? { 
          ...a, 
          status: 'executed' as const, 
          executed_at: new Date().toISOString(),
          executed_by: 'current_admin'
        } : a
      ));
      alert('Acerto executado com sucesso!');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'debit': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'bonus': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'refund': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'commission': return 'bg-purple-400/20 text-purple-400 border border-purple-400/50';
      case 'penalty': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'correction': return 'bg-pink-400/20 text-pink-400 border border-pink-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'approved': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'rejected': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'executed': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'cancelled': return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-yellow-400';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return <FiArrowUp className="w-4 h-4" />;
      case 'debit': return <FiArrowDown className="w-4 h-4" />;
      case 'bonus': return <FiZap className="w-4 h-4" />;
      case 'refund': return <FiRefreshCw className="w-4 h-4" />;
      case 'commission': return <FiShare2 className="w-4 h-4" />;
      case 'penalty': return <FiAlertTriangle className="w-4 h-4" />;
      case 'correction': return <FiEdit className="w-4 h-4" />;
      default: return <FiDollarSign className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Acertos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Acertos | CoinBitClub Admin</title>
        <meta name="description" content="Acertos - CoinBitClub Admin" />
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
              <a href="/admin/alerts" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiAlertTriangle className="w-6 h-6 mr-4" />
                <span>Alertas</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
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
                <h2 className="text-2xl font-bold text-yellow-400">Acertos</h2>
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
                  <span>Novo Acerto</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Total</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.total}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Pendentes</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.pending}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Aprovados</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.approved}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Rejeitados</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.rejected}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="text-center">
                  <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Executados</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.executed}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-400/50 shadow-[0_0_20px_rgba(156,163,175,0.3)]">
                <div className="text-center">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Cancelados</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.cancelled}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Total USD</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.total_amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="text-center">
                  <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Créditos</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.credits_amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Débitos</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.debits_amount.toFixed(2)}</p>
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
                    placeholder="Buscar por usuário, email, motivo..."
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
                  <option value="credit">Crédito</option>
                  <option value="debit">Débito</option>
                  <option value="bonus">Bônus</option>
                  <option value="refund">Reembolso</option>
                  <option value="commission">Comissão</option>
                  <option value="penalty">Penalidade</option>
                  <option value="correction">Correção</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="executed">Executado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <select
                  value={filterCurrency}
                  onChange={(e) => setFilterCurrency(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todas as Moedas</option>
                  <option value="USD">USD</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            {/* Tabela de Acertos */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Tipo/Valor</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Motivo</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Datas</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Referência</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredAdjustments.map((adjustment) => (
                      <tr key={adjustment.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold">{adjustment.user_name}</p>
                            <p className="text-blue-400 text-sm">{adjustment.user_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getTypeColor(adjustment.type)}`}>
                              {getTypeIcon(adjustment.type)}
                              <span className="ml-2">{adjustment.type}</span>
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className={`text-lg font-bold ${adjustment.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {adjustment.amount >= 0 ? '+' : ''}{adjustment.amount.toFixed(4)} {adjustment.currency}
                            </p>
                            <p className={`text-sm font-bold ${getPriorityColor(adjustment.priority)}`}>
                              {adjustment.priority.toUpperCase()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold">{adjustment.reason}</p>
                            <p className="text-blue-400 text-sm mt-1">{adjustment.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(adjustment.status)}`}>
                            {adjustment.status}
                          </span>
                          {adjustment.approved_by && (
                            <p className="text-blue-400 text-xs mt-1">Por: {adjustment.approved_by}</p>
                          )}
                          {adjustment.executed_by && (
                            <p className="text-green-400 text-xs mt-1">Exec: {adjustment.executed_by}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-blue-400">Criado: {new Date(adjustment.created_at).toLocaleString('pt-BR')}</p>
                            {adjustment.approved_at && (
                              <p className="text-yellow-400">Aprovado: {new Date(adjustment.approved_at).toLocaleString('pt-BR')}</p>
                            )}
                            {adjustment.executed_at && (
                              <p className="text-green-400">Executado: {new Date(adjustment.executed_at).toLocaleString('pt-BR')}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold text-sm">{adjustment.reference_id}</p>
                            {adjustment.transaction_hash && (
                              <p className="text-blue-400 text-xs mt-1" title={adjustment.transaction_hash}>
                                {adjustment.transaction_hash.substring(0, 10)}...
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
                            {adjustment.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(adjustment.id)}
                                  className="p-2 text-green-400 hover:text-pink-400 bg-green-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                  title="Aprovar"
                                >
                                  <FiCheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(adjustment.id)}
                                  className="p-2 text-red-400 hover:text-pink-400 bg-red-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                  title="Rejeitar"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {adjustment.status === 'approved' && (
                              <button
                                onClick={() => handleExecute(adjustment.id)}
                                className="p-2 text-blue-400 hover:text-pink-400 bg-blue-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                title="Executar"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Download"
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

            {filteredAdjustments.length === 0 && (
              <div className="text-center py-12">
                <FiDollarSign className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhum acerto encontrado</p>
                <p className="text-blue-400">Ajuste os filtros ou crie novos acertos</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Acertos - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema de gestão de ajustes financeiros</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
