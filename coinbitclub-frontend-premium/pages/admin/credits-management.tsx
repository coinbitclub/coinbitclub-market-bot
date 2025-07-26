import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiCalendar, FiFileText, FiPieChart, FiTarget,
  FiCreditCard, FiArrowUp, FiArrowDown, FiZap, FiGift, FiUser,
  FiCheck, FiX as FiCancel, FiCopy, FiSave, FiAlertCircle
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  balance: number;
  currency: string;
  plan: string;
  status: string;
}

interface CreditCoupon {
  id: string;
  code: string;
  amount: number;
  currency: string;
  description: string;
  usage_limit: number;
  used_count: number;
  expires_at: string;
  created_at: string;
  status: 'active' | 'expired' | 'disabled';
  created_by: string;
  type: 'single_use' | 'multi_use' | 'unlimited';
}

interface BalanceAdjustment {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  currency: string;
  type: 'manual_credit' | 'coupon_credit' | 'manual_debit';
  description: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
  withdrawable: boolean;
}

export default function CreditsManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('balances'); // balances, coupons, history
  const [loading, setLoading] = useState(true);
  
  // Balance Management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    description: '',
    type: 'manual_credit'
  });
  
  // Coupon Management
  const [coupons, setCoupons] = useState<CreditCoupon[]>([]);
  const [couponForm, setCouponForm] = useState({
    code: '',
    amount: '',
    currency: 'USD',
    description: '',
    usage_limit: '',
    expires_at: '',
    type: 'single_use'
  });
  
  // History
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total_active_coupons: 0,
    total_used_coupons: 0,
    total_coupon_value: 0,
    total_manual_credits: 0,
    total_users_with_credits: 0
  });

  // Mock data - Em produção, buscar da API
  useEffect(() => {
    setLoading(true);
    
    // Simular usuários
    const mockUsers: User[] = [
      {
        id: 'user_001',
        name: 'João Silva',
        email: 'joao@email.com',
        whatsapp: '+5511999999999',
        balance: 250.00,
        currency: 'USD',
        plan: 'PRO',
        status: 'active'
      },
      {
        id: 'user_002',
        name: 'Maria Santos',
        email: 'maria@email.com',
        whatsapp: '+5511888888888',
        balance: 0.00,
        currency: 'USD',
        plan: 'FLEX',
        status: 'active'
      },
      {
        id: 'user_003',
        name: 'Carlos Lima',
        email: 'carlos@email.com',
        whatsapp: '+5511777777777',
        balance: 500.00,
        currency: 'USD',
        plan: 'PRO',
        status: 'active'
      }
    ];

    // Simular cupons
    const mockCoupons: CreditCoupon[] = [
      {
        id: 'coupon_001',
        code: 'WELCOME50',
        amount: 50.00,
        currency: 'USD',
        description: 'Bônus de boas-vindas',
        usage_limit: 100,
        used_count: 23,
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2024-07-01T10:00:00Z',
        status: 'active',
        created_by: 'admin_001',
        type: 'multi_use'
      },
      {
        id: 'coupon_002',
        code: 'PROMO100',
        amount: 100.00,
        currency: 'USD',
        description: 'Promoção especial',
        usage_limit: 50,
        used_count: 45,
        expires_at: '2025-08-15T23:59:59Z',
        created_at: '2024-07-15T15:30:00Z',
        status: 'active',
        created_by: 'admin_001',
        type: 'multi_use'
      }
    ];

    // Simular histórico
    const mockAdjustments: BalanceAdjustment[] = [
      {
        id: 'adj_001',
        user_id: 'user_001',
        user_name: 'João Silva',
        amount: 100.00,
        currency: 'USD',
        type: 'manual_credit',
        description: 'Crédito manual para teste',
        admin_id: 'admin_001',
        admin_name: 'Administrador',
        created_at: '2024-07-25T10:30:00Z',
        withdrawable: false
      },
      {
        id: 'adj_002',
        user_id: 'user_003',
        user_name: 'Carlos Lima',
        amount: 50.00,
        currency: 'USD',
        type: 'coupon_credit',
        description: 'Cupom WELCOME50 aplicado',
        admin_id: 'system',
        admin_name: 'Sistema',
        created_at: '2024-07-25T09:15:00Z',
        withdrawable: false
      }
    ];

    setUsers(mockUsers);
    setCoupons(mockCoupons);
    setAdjustments(mockAdjustments);
    
    // Calcular estatísticas
    setStats({
      total_active_coupons: mockCoupons.filter(c => c.status === 'active').length,
      total_used_coupons: mockCoupons.reduce((sum, c) => sum + c.used_count, 0),
      total_coupon_value: mockCoupons.reduce((sum, c) => sum + (c.amount * c.used_count), 0),
      total_manual_credits: mockAdjustments.filter(a => a.type === 'manual_credit').reduce((sum, a) => sum + a.amount, 0),
      total_users_with_credits: new Set(mockAdjustments.map(a => a.user_id)).size
    });
    
    setLoading(false);
  }, []);

  const handleAddBalance = async () => {
    if (!selectedUser || !balanceForm.amount) {
      alert('Selecione um usuário e informe o valor');
      return;
    }

    try {
      const response = await fetch('/api/admin/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount: parseFloat(balanceForm.amount),
          description: balanceForm.description,
          type: balanceForm.type
        })
      });

      if (response.ok) {
        alert('Saldo adicionado com sucesso!');
        setShowBalanceModal(false);
        setBalanceForm({ amount: '', description: '', type: 'manual_credit' });
        setSelectedUser(null);
        // Recarregar dados
      } else {
        alert('Erro ao adicionar saldo');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao conectar com servidor');
    }
  };

  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.amount) {
      alert('Código e valor são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/admin/create-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm)
      });

      if (response.ok) {
        alert('Cupom criado com sucesso!');
        setShowCouponModal(false);
        setCouponForm({
          code: '',
          amount: '',
          currency: 'USD',
          description: '',
          usage_limit: '',
          expires_at: '',
          type: 'single_use'
        });
        // Recarregar dados
      } else {
        alert('Erro ao criar cupom');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao conectar com servidor');
    }
  };

  const generateCouponCode = () => {
    const code = 'CBC' + Math.random().toString(36).substr(2, 8).toUpperCase();
    setCouponForm(prev => ({ ...prev, code }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código copiado!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Gestão de Créditos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Créditos e Cupons | CoinBitClub Admin</title>
        <meta name="description" content="Gestão de Créditos e Cupons - CoinBitClub Admin" />
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
              <a href="/admin/adjustments" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Acertos</span>
              </a>
              <a href="/admin/accounting" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiFileText className="w-6 h-6 mr-4" />
                <span>Contabilidade</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiGift className="w-6 h-6 mr-4" />
                <span>Créditos e Cupons</span>
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
                <h2 className="text-2xl font-bold text-yellow-400">Gestão de Créditos e Cupons</h2>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowBalanceModal(true)}
                  className="flex items-center px-6 py-3 text-black bg-green-400 hover:bg-green-300 border-2 border-green-400 rounded-lg transition-all duration-300 font-bold"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  <span>Adicionar Saldo</span>
                </button>
                <button
                  onClick={() => setShowCouponModal(true)}
                  className="flex items-center px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold"
                >
                  <FiGift className="w-5 h-5 mr-2" />
                  <span>Criar Cupom</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="text-center">
                  <FiGift className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Cupons Ativos</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.total_active_coupons}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <FiCheck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Cupons Utilizados</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.total_used_coupons}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                <div className="text-center">
                  <FiDollarSign className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">Valor em Cupons</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.total_coupon_value.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <FiCreditCard className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Créditos Manuais</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.total_manual_credits.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                <div className="text-center">
                  <FiUsers className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-2">Usuários c/ Crédito</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.total_users_with_credits}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] mb-8">
              <div className="flex border-b border-yellow-400/30">
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`px-8 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'balances'
                      ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/10'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/5'
                  }`}
                >
                  <FiCreditCard className="w-5 h-5 inline mr-2" />
                  Gestão de Saldos
                </button>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`px-8 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'coupons'
                      ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/10'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/5'
                  }`}
                >
                  <FiGift className="w-5 h-5 inline mr-2" />
                  Cupons de Crédito
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-8 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'history'
                      ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/10'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/5'
                  }`}
                >
                  <FiFileText className="w-5 h-5 inline mr-2" />
                  Histórico
                </button>
              </div>

              <div className="p-6">
                {/* Balance Management Tab */}
                {activeTab === 'balances' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-yellow-400">Usuários - Gestão de Saldos</h3>
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Buscar usuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-black/50 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                            <tr>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Usuário</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Saldo Atual</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Plano</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Status</th>
                              <th className="px-6 py-4 text-center text-yellow-400 font-bold">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-yellow-400/20">
                            {users.filter(user => 
                              user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((user) => (
                              <tr key={user.id} className="hover:bg-yellow-400/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-yellow-400 font-bold">{user.name}</p>
                                    <p className="text-blue-400 text-sm">{user.email}</p>
                                    <p className="text-pink-400 text-xs">{user.whatsapp}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <FiDollarSign className="w-4 h-4 text-green-400" />
                                    <span className="text-2xl font-bold text-green-400">
                                      ${user.balance.toFixed(2)}
                                    </span>
                                    <span className="text-blue-400 text-sm">{user.currency}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    user.plan === 'PRO' 
                                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                                      : 'bg-blue-400/20 text-blue-400 border border-blue-400/50'
                                  }`}>
                                    {user.plan}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    user.status === 'active'
                                      ? 'bg-green-400/20 text-green-400 border border-green-400/50'
                                      : 'bg-red-400/20 text-red-400 border border-red-400/50'
                                  }`}>
                                    {user.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center space-x-3">
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowBalanceModal(true);
                                      }}
                                      className="p-2 text-green-400 hover:text-yellow-400 bg-green-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                                      title="Adicionar Saldo"
                                    >
                                      <FiPlus className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                                      title="Ver Histórico"
                                    >
                                      <FiEye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coupons Management Tab */}
                {activeTab === 'coupons' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-yellow-400">Cupons de Crédito</h3>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-4 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="active">Ativos</option>
                          <option value="expired">Expirados</option>
                          <option value="disabled">Desabilitados</option>
                        </select>
                      </div>
                      
                      <div className="bg-black/50 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                            <tr>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Código</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Valor</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Uso</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Expires</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Status</th>
                              <th className="px-6 py-4 text-center text-yellow-400 font-bold">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-yellow-400/20">
                            {coupons.filter(coupon => 
                              filterStatus === 'all' || coupon.status === filterStatus
                            ).map((coupon) => (
                              <tr key={coupon.id} className="hover:bg-yellow-400/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <code className="text-yellow-400 font-bold text-lg bg-yellow-400/10 px-3 py-1 rounded">
                                      {coupon.code}
                                    </code>
                                    <button
                                      onClick={() => copyToClipboard(coupon.code)}
                                      className="p-1 text-blue-400 hover:text-yellow-400 transition-colors"
                                      title="Copiar código"
                                    >
                                      <FiCopy className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <p className="text-blue-400 text-sm mt-1">{coupon.description}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <FiDollarSign className="w-4 h-4 text-green-400" />
                                    <span className="text-xl font-bold text-green-400">
                                      ${coupon.amount.toFixed(2)}
                                    </span>
                                    <span className="text-blue-400 text-sm">{coupon.currency}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-pink-400 font-bold">{coupon.used_count}</span>
                                      <span className="text-blue-400">/</span>
                                      <span className="text-yellow-400 font-bold">
                                        {coupon.usage_limit === 0 ? '∞' : coupon.usage_limit}
                                      </span>
                                    </div>
                                    <div className="w-24 bg-black/50 rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-pink-400 to-yellow-400 h-2 rounded-full"
                                        style={{ 
                                          width: coupon.usage_limit === 0 ? '50%' : `${(coupon.used_count / coupon.usage_limit) * 100}%` 
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-blue-400 text-sm">
                                    {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-pink-400 text-xs">
                                    {new Date(coupon.expires_at).toLocaleTimeString('pt-BR')}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    coupon.status === 'active'
                                      ? 'bg-green-400/20 text-green-400 border border-green-400/50'
                                      : coupon.status === 'expired'
                                      ? 'bg-red-400/20 text-red-400 border border-red-400/50'
                                      : 'bg-gray-400/20 text-gray-400 border border-gray-400/50'
                                  }`}>
                                    {coupon.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center space-x-3">
                                    <button
                                      className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                                      title="Editar"
                                    >
                                      <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-2 text-red-400 hover:text-pink-400 bg-red-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                      title="Desativar"
                                    >
                                      <FiCancel className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-yellow-400 mb-4">Histórico de Ajustes de Saldo</h3>
                      
                      <div className="bg-black/50 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                            <tr>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Data</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Usuário</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Tipo</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Valor</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Admin</th>
                              <th className="px-6 py-4 text-left text-yellow-400 font-bold">Saque</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-yellow-400/20">
                            {adjustments.map((adjustment) => (
                              <tr key={adjustment.id} className="hover:bg-yellow-400/5 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-blue-400 text-sm">
                                    {new Date(adjustment.created_at).toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-pink-400 text-xs">
                                    {new Date(adjustment.created_at).toLocaleTimeString('pt-BR')}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-yellow-400 font-bold">{adjustment.user_name}</p>
                                  <p className="text-blue-400 text-xs">ID: {adjustment.user_id}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    adjustment.type === 'manual_credit'
                                      ? 'bg-green-400/20 text-green-400 border border-green-400/50'
                                      : adjustment.type === 'coupon_credit'
                                      ? 'bg-purple-400/20 text-purple-400 border border-purple-400/50'
                                      : 'bg-red-400/20 text-red-400 border border-red-400/50'
                                  }`}>
                                    {adjustment.type === 'manual_credit' ? 'MANUAL' : 
                                     adjustment.type === 'coupon_credit' ? 'CUPOM' : 'DÉBITO'}
                                  </span>
                                  <p className="text-blue-400 text-xs mt-1">{adjustment.description}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-lg font-bold ${
                                      adjustment.amount >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {adjustment.amount >= 0 ? '+' : ''}${adjustment.amount.toFixed(2)}
                                    </span>
                                    <span className="text-blue-400 text-sm">{adjustment.currency}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-yellow-400 font-bold">{adjustment.admin_name}</p>
                                  <p className="text-blue-400 text-xs">ID: {adjustment.admin_id}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    {adjustment.withdrawable ? (
                                      <FiCheck className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <FiCancel className="w-4 h-4 text-red-400" />
                                    )}
                                    <span className={`text-sm font-bold ${
                                      adjustment.withdrawable ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {adjustment.withdrawable ? 'PERMITE' : 'BLOQUEIA'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modal - Adicionar Saldo */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(255,215,0,0.3)] w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                  <FiPlus className="w-6 h-6 mr-2" />
                  Adicionar Saldo
                </h3>
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setSelectedUser(null);
                    setBalanceForm({ amount: '', description: '', type: 'manual_credit' });
                  }}
                  className="text-red-400 hover:text-pink-400 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {selectedUser && (
                <div className="bg-blue-400/10 border border-blue-400/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <FiUser className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-yellow-400 font-bold">{selectedUser.name}</p>
                      <p className="text-blue-400 text-sm">{selectedUser.email}</p>
                      <p className="text-pink-400 text-xs">Saldo atual: ${selectedUser.balance.toFixed(2)} {selectedUser.currency}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">
                    Tipo de Ajuste
                  </label>
                  <select
                    value={balanceForm.type}
                    onChange={(e) => setBalanceForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  >
                    <option value="manual_credit">Crédito Manual</option>
                    <option value="manual_debit">Débito Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">
                    Valor (USD)
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={balanceForm.amount}
                      onChange={(e) => setBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">
                    Descrição/Motivo
                  </label>
                  <textarea
                    value={balanceForm.description}
                    onChange={(e) => setBalanceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o motivo do ajuste..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Warning */}
                <div className="bg-orange-400/10 border border-orange-400/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-orange-400 font-bold text-sm">Atenção!</p>
                      <p className="text-orange-400 text-xs mt-1">
                        Créditos manuais e de cupons NÃO geram direito a saque. Apenas liberam o sistema para operações.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setSelectedUser(null);
                    setBalanceForm({ amount: '', description: '', type: 'manual_credit' });
                  }}
                  className="flex-1 px-6 py-3 text-red-400 border-2 border-red-400/50 rounded-lg hover:bg-red-400/10 transition-all duration-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddBalance}
                  className="flex-1 px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold"
                >
                  <FiSave className="w-5 h-5 inline mr-2" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Criar Cupom */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(255,215,0,0.3)] w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                  <FiGift className="w-6 h-6 mr-2" />
                  Criar Cupom de Crédito
                </h3>
                <button
                  onClick={() => {
                    setShowCouponModal(false);
                    setCouponForm({
                      code: '',
                      amount: '',
                      currency: 'USD',
                      description: '',
                      usage_limit: '',
                      expires_at: '',
                      type: 'single_use'
                    });
                  }}
                  className="text-red-400 hover:text-pink-400 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">
                    Código do Cupom
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="CODIGO123"
                      className="flex-1 px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors uppercase"
                    />
                    <button
                      onClick={generateCouponCode}
                      className="px-4 py-3 text-blue-400 border-2 border-blue-400/50 rounded-lg hover:bg-blue-400/10 transition-all duration-300"
                      title="Gerar código automático"
                    >
                      <FiRefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-400 text-sm font-bold mb-2">
                      Valor
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={couponForm.amount}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-blue-400 text-sm font-bold mb-2">
                      Moeda
                    </label>
                    <select
                      value={couponForm.currency}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    >
                      <option value="USD">USD</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Bônus de boas-vindas..."
                    className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-400 text-sm font-bold mb-2">
                      Tipo de Uso
                    </label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    >
                      <option value="single_use">Uso Único</option>
                      <option value="multi_use">Uso Múltiplo</option>
                      <option value="unlimited">Ilimitado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-blue-400 text-sm font-bold mb-2">
                      Limite de Usos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={couponForm.usage_limit}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                      placeholder="100"
                      disabled={couponForm.type === 'unlimited'}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">
                    Data de Expiração
                  </label>
                  <input
                    type="datetime-local"
                    value={couponForm.expires_at}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>

                {/* Warning */}
                <div className="bg-orange-400/10 border border-orange-400/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-orange-400 font-bold text-sm">Importante!</p>
                      <p className="text-orange-400 text-xs mt-1">
                        Cupons de crédito não geram direito a saque, apenas liberam operações na plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowCouponModal(false);
                    setCouponForm({
                      code: '',
                      amount: '',
                      currency: 'USD',
                      description: '',
                      usage_limit: '',
                      expires_at: '',
                      type: 'single_use'
                    });
                  }}
                  className="flex-1 px-6 py-3 text-red-400 border-2 border-red-400/50 rounded-lg hover:bg-red-400/10 transition-all duration-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCoupon}
                  className="flex-1 px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold"
                >
                  <FiGift className="w-5 h-5 inline mr-2" />
                  Criar Cupom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-yellow-400/30 p-4 text-center">
        <p className="text-yellow-400 text-sm font-bold">⚡ Gestão de Créditos e Cupons - CoinBitClub ⚡</p>
      </div>
    </>
  );
}
