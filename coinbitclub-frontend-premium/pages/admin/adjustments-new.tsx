import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiCalendar, FiFileText, FiCheckCircle, FiXCircle,
  FiClock, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

interface AdjustmentRecord {
  id: string;
  date: string;
  type: 'credit' | 'debit' | 'bonus' | 'refund' | 'fee_waiver';
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  user_id: string;
  user_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  reason: string;
  approved_by?: string;
  approved_at?: string;
  reference_id?: string;
  notes?: string;
  metadata?: {
    original_transaction?: string;
    approval_level?: number;
    requires_review?: boolean;
  };
}

interface AdjustmentSummary {
  total_pending: number;
  total_approved: number;
  total_processed: number;
  total_amount: number;
  pending_amount: number;
  approved_amount: number;
  monthly_adjustments: number;
  average_processing_time: number;
}

export default function AdjustmentsManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [summary, setSummary] = useState<AdjustmentSummary | null>(null);
  const [showNewAdjustment, setShowNewAdjustment] = useState(false);

  // Mock data para demonstração
  useEffect(() => {
    setLoading(true);
    // Simular dados de ajustes
    const mockAdjustments: AdjustmentRecord[] = [
      {
        id: 'ADJ_001',
        date: '2024-07-26T10:30:00Z',
        type: 'credit',
        category: 'Bonus',
        subcategory: 'Welcome Bonus',
        description: 'Bônus de boas-vindas para novo usuário premium',
        amount: 500.00,
        currency: 'USD',
        user_id: 'user_001',
        user_name: 'João Silva',
        status: 'pending',
        reason: 'Usuário qualificado para bônus premium',
        reference_id: 'BONUS_2024_001',
        notes: 'Verificar documentação de identificação',
        metadata: {
          approval_level: 2,
          requires_review: true
        }
      },
      {
        id: 'ADJ_002',
        date: '2024-07-26T09:15:00Z',
        type: 'refund',
        category: 'Fee Refund',
        subcategory: 'Trading Fee',
        description: 'Reembolso de taxa por erro do sistema',
        amount: 45.75,
        currency: 'USD',
        user_id: 'user_002',
        user_name: 'Maria Santos',
        status: 'approved',
        reason: 'Taxa cobrada indevidamente devido a bug no sistema',
        approved_by: 'admin_001',
        approved_at: '2024-07-26T09:30:00Z',
        reference_id: 'REFUND_FEE_001',
        notes: 'Aprovado automaticamente - valor abaixo do limite'
      },
      {
        id: 'ADJ_003',
        date: '2024-07-25T16:45:00Z',
        type: 'debit',
        category: 'Chargeback',
        subcategory: 'Disputed Transaction',
        description: 'Ajuste por contestação de transação',
        amount: -1200.00,
        currency: 'USD',
        user_id: 'user_003',
        user_name: 'Carlos Lima',
        status: 'processed',
        reason: 'Chargeback confirmado pelo banco emissor',
        approved_by: 'admin_002',
        approved_at: '2024-07-25T17:00:00Z',
        reference_id: 'CB_2024_003',
        notes: 'Documentação arquivada no suporte'
      },
      {
        id: 'ADJ_004',
        date: '2024-07-25T14:20:00Z',
        type: 'fee_waiver',
        category: 'Fee Waiver',
        subcategory: 'VIP Benefit',
        description: 'Isenção de taxa para usuário VIP',
        amount: 25.00,
        currency: 'USD',
        user_id: 'user_004',
        user_name: 'Ana Costa',
        status: 'approved',
        reason: 'Benefício VIP - isenção mensal de taxas',
        approved_by: 'system',
        approved_at: '2024-07-25T14:20:00Z',
        reference_id: 'VIP_WAIVER_001',
        notes: 'Aprovação automática para usuários VIP'
      },
      {
        id: 'ADJ_005',
        date: '2024-07-25T11:30:00Z',
        type: 'bonus',
        category: 'Referral Bonus',
        subcategory: 'Affiliate Reward',
        description: 'Bônus por indicação de novo usuário',
        amount: 100.00,
        currency: 'USD',
        user_id: 'user_005',
        user_name: 'Roberto Silva',
        status: 'processed',
        reason: 'Indicação de usuário que completou primeiro depósito',
        approved_by: 'admin_001',
        approved_at: '2024-07-25T12:00:00Z',
        reference_id: 'REF_BONUS_005',
        notes: 'Usuário indicado: user_006'
      },
      {
        id: 'ADJ_006',
        date: '2024-07-24T13:15:00Z',
        type: 'credit',
        category: 'Compensation',
        subcategory: 'System Error',
        description: 'Compensação por indisponibilidade do sistema',
        amount: 75.00,
        currency: 'USD',
        user_id: 'user_006',
        user_name: 'Patricia Ferreira',
        status: 'rejected',
        reason: 'Solicitação duplicada - já processada anteriormente',
        approved_by: 'admin_003',
        approved_at: '2024-07-24T14:00:00Z',
        reference_id: 'COMP_SYS_001',
        notes: 'Verificar histórico de compensações'
      }
    ];

    setAdjustments(mockAdjustments);
    
    // Calcular resumo
    const pending = mockAdjustments.filter(a => a.status === 'pending').length;
    const approved = mockAdjustments.filter(a => a.status === 'approved').length;
    const processed = mockAdjustments.filter(a => a.status === 'processed').length;
    const totalAmount = mockAdjustments.reduce((sum, a) => sum + Math.abs(a.amount), 0);
    const pendingAmount = mockAdjustments.filter(a => a.status === 'pending').reduce((sum, a) => sum + Math.abs(a.amount), 0);
    const approvedAmount = mockAdjustments.filter(a => a.status === 'approved').reduce((sum, a) => sum + Math.abs(a.amount), 0);
    
    const newSummary: AdjustmentSummary = {
      total_pending: pending,
      total_approved: approved,
      total_processed: processed,
      total_amount: totalAmount,
      pending_amount: pendingAmount,
      approved_amount: approvedAmount,
      monthly_adjustments: mockAdjustments.length,
      average_processing_time: 24.5
    };
    
    setSummary(newSummary);
    setLoading(false);
  }, []);

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = adjustment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || adjustment.status === filterStatus;
    const matchesType = filterType === 'all' || adjustment.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'approved': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'processed': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'rejected': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'approved': return <FiCheckCircle className="w-4 h-4" />;
      case 'processed': return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <FiXCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return <FiArrowUp className="w-4 h-4" />;
      case 'debit': return <FiArrowDown className="w-4 h-4" />;
      case 'bonus': return <FiDollarSign className="w-4 h-4" />;
      case 'refund': return <FiRefreshCw className="w-4 h-4" />;
      case 'fee_waiver': return <FiActivity className="w-4 h-4" />;
      default: return <FiFileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Ajustes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Ajustes Financeiros | CoinBitClub Admin</title>
        <meta name="description" content="Ajustes Financeiros - CoinBitClub Admin" />
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
                <span>Ajustes</span>
              </a>
              <a href="/admin/accounting-new" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
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
                <h2 className="text-2xl font-bold text-yellow-400">Ajustes Financeiros</h2>
              </div>

              <div className="flex items-center space-x-6">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 bg-black/50 border-2 border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
                <button
                  onClick={() => setShowNewAdjustment(true)}
                  className="flex items-center px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  <span>Novo Ajuste</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                  <div className="text-center">
                    <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Pendentes</p>
                    <p className="text-white text-3xl font-bold mb-1">{summary.total_pending}</p>
                    <p className="text-yellow-300 text-sm">${summary.pending_amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="text-center">
                    <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Aprovados</p>
                    <p className="text-white text-3xl font-bold mb-1">{summary.total_approved}</p>
                    <p className="text-blue-300 text-sm">${summary.approved_amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <div className="text-center">
                    <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Processados</p>
                    <p className="text-white text-3xl font-bold mb-1">{summary.total_processed}</p>
                    <p className="text-green-300 text-sm">Este mês</p>
                  </div>
                </div>
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                  <div className="text-center">
                    <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Tempo Médio</p>
                    <p className="text-white text-3xl font-bold mb-1">{summary.average_processing_time}h</p>
                    <p className="text-pink-300 text-sm">Processamento</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar ajustes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-blue-400/50 rounded-lg text-blue-400 placeholder-blue-400/50 focus:border-yellow-400/70 focus:outline-none transition-colors"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-black/50 border-2 border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="processed">Processado</option>
                <option value="rejected">Rejeitado</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 bg-black/50 border-2 border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
              >
                <option value="all">Todos os Tipos</option>
                <option value="credit">Crédito</option>
                <option value="debit">Débito</option>
                <option value="bonus">Bônus</option>
                <option value="refund">Reembolso</option>
                <option value="fee_waiver">Isenção de Taxa</option>
              </select>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300 font-medium"
              >
                <FiRefreshCw className="w-5 h-5 mr-2" />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Adjustments Table */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-400/20 border-b border-blue-400/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-blue-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-400/20">
                    {filteredAdjustments.map((adjustment) => (
                      <tr key={adjustment.id} className="hover:bg-blue-400/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white font-medium text-sm">{adjustment.id}</div>
                          <div className="text-blue-300 text-xs">{adjustment.reference_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white text-sm">
                            {new Date(adjustment.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-blue-300 text-xs">
                            {new Date(adjustment.date).toLocaleTimeString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(adjustment.type)}
                            <span className="text-white text-sm capitalize">{adjustment.type}</span>
                          </div>
                          <div className="text-blue-300 text-xs">{adjustment.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white font-medium text-sm">{adjustment.user_name}</div>
                          <div className="text-blue-300 text-xs">{adjustment.user_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white text-sm max-w-xs truncate">{adjustment.description}</div>
                          <div className="text-blue-300 text-xs">{adjustment.reason}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-lg font-bold ${adjustment.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {adjustment.amount >= 0 ? '+' : ''}${adjustment.amount.toLocaleString()}
                          </div>
                          <div className="text-blue-300 text-xs">{adjustment.currency}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(adjustment.status)}`}>
                            {getStatusIcon(adjustment.status)}
                            <span className="capitalize">{adjustment.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all duration-300">
                              <FiEye className="w-4 h-4" />
                            </button>
                            {adjustment.status === 'pending' && (
                              <>
                                <button className="p-2 text-green-400 hover:text-yellow-400 hover:bg-green-400/10 rounded-lg transition-all duration-300">
                                  <FiCheckCircle className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-red-400 hover:text-yellow-400 hover:bg-red-400/10 rounded-lg transition-all duration-300">
                                  <FiXCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button className="p-2 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all duration-300">
                              <FiEdit className="w-4 h-4" />
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
                <p className="text-yellow-400 text-xl font-bold">Nenhum ajuste encontrado</p>
                <p className="text-blue-400">Ajuste os filtros ou período selecionado</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Ajustes Financeiros - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema completo de gestão de ajustes e aprovações</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
