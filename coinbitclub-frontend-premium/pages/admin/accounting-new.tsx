import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiCalendar, FiFileText, FiPieChart, FiTarget,
  FiCreditCard, FiArrowUp, FiArrowDown, FiZap
} from 'react-icons/fi';

interface AccountingRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  user_id?: string;
  status: string;
  payment_method: string;
  reference_id: string;
}

interface FinancialSummary {
  daily: {
    revenue: number;
    expenses: number;
    profit: number;
    commission_paid: number;
    active_subscriptions: number;
    new_subscriptions: number;
    cancelled_subscriptions: number;
  };
  monthly: {
    revenue: number;
    expenses: number;
    profit: number;
    commission_paid: number;
    active_subscriptions: number;
    new_subscriptions: number;
    cancelled_subscriptions: number;
  };
  yearly: {
    revenue: number;
    expenses: number;
    profit: number;
    commission_paid: number;
    active_subscriptions: number;
    new_subscriptions: number;
    cancelled_subscriptions: number;
  };
}

export default function AccountingManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [stats, setStats] = useState({
    total_transactions: 0,
    total_revenue: 0,
    total_expenses: 0,
    total_commissions: 0,
    net_profit: 0,
    pending_transactions: 0
  });

  // Buscar dados reais da API
  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      
      // Buscar transações
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (searchTerm) params.append('search', searchTerm);

      const transactionsResponse = await fetch(`/api/admin/accounting?${params.toString()}`);
      const transactionsData = await transactionsResponse.json();

      // Buscar resumo financeiro
      const summaryResponse = await fetch(`/api/admin/accounting?summary=true&period=${selectedPeriod}`);
      const summaryData = await summaryResponse.json();

      if (transactionsData.success) {
        setRecords(transactionsData.transactions);
        setStats(transactionsData.stats);
      }

      if (summaryData.success) {
        setSummary({ [selectedPeriod]: summaryData.summary, daily: summaryData.summary, monthly: summaryData.summary, yearly: summaryData.summary });
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, [searchTerm, filterCategory, filterType, selectedPeriod]);
  const [filterType, setFilterType] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [summary, setSummary] = useState<FinancialSummary>({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    profit_margin: 0,
    trading_volume: 0,
    commission_earned: 0,
    fees_paid: 0,
    active_users: 0,
    monthly_growth: 0
  });

  // Mock data para demonstração
  useEffect(() => {
    setLoading(true);
    // Simular dados contábeis
    const mockRecords: AccountingRecord[] = [
      {
        id: '1',
        date: '2024-07-25T10:30:00Z',
        category: 'revenue',
        subcategory: 'Trading Profits',
        description: 'Lucro em operação BTCUSDT LONG',
        amount: 2580.45,
        currency: 'USD',
        account_type: 'trading',
        reference_id: 'OP_BTC_001',
        user_id: 'user_001',
        user_name: 'João Silva',
        metadata: {
          operation_id: 'OP_BTC_001',
          exchange_rate: 1.0,
          notes: 'Operação bem-sucedida com 5.8% de lucro'
        }
      },
      {
        id: '2',
        date: '2024-07-25T09:45:00Z',
        category: 'revenue',
        subcategory: 'Commission Revenue',
        description: 'Comissão de afiliado - Carlos Lima',
        amount: 125.00,
        currency: 'USD',
        account_type: 'commission',
        reference_id: 'COMM_2024_07_003',
        user_id: 'user_003',
        user_name: 'Carlos Lima',
        metadata: {
          affiliate_id: 'AFF_CARLOS_001',
          notes: '5 novos usuários registrados'
        }
      },
      {
        id: '3',
        date: '2024-07-25T08:20:00Z',
        category: 'expense',
        subcategory: 'Exchange Fees',
        description: 'Taxa de negociação Binance',
        amount: -45.75,
        currency: 'USD',
        account_type: 'fee',
        reference_id: 'FEE_BINANCE_001',
        metadata: {
          exchange_rate: 1.0,
          notes: 'Taxa 0.1% sobre volume'
        }
      },
      {
        id: '4',
        date: '2024-07-25T07:30:00Z',
        category: 'asset',
        subcategory: 'Customer Deposits',
        description: 'Depósito via transferência bancária',
        amount: 2000.00,
        currency: 'USD',
        account_type: 'deposit',
        reference_id: 'DEP_2024_07_006',
        user_id: 'user_006',
        user_name: 'Patricia Ferreira',
        transaction_hash: '0xabcdef1234567890...',
        metadata: {
          exchange_rate: 1.0,
          notes: 'Transferência internacional aprovada'
        }
      },
      {
        id: '5',
        date: '2024-07-24T16:45:00Z',
        category: 'liability',
        subcategory: 'Customer Withdrawals',
        description: 'Saque solicitado por usuário',
        amount: -500.00,
        currency: 'USD',
        account_type: 'withdrawal',
        reference_id: 'WTH_2024_07_005',
        user_id: 'user_005',
        user_name: 'Roberto Silva',
        transaction_hash: '0x1234567890abcdef...',
        metadata: {
          exchange_rate: 1.0,
          notes: 'Saque processado automaticamente'
        }
      },
      {
        id: '6',
        date: '2024-07-24T14:15:00Z',
        category: 'expense',
        subcategory: 'Operational Costs',
        description: 'Licença de software de análise',
        amount: -299.00,
        currency: 'USD',
        account_type: 'expense',
        reference_id: 'EXP_SOFTWARE_001',
        metadata: {
          notes: 'TradingView Pro License - mensal'
        }
      },
      {
        id: '7',
        date: '2024-07-24T12:00:00Z',
        category: 'revenue',
        subcategory: 'Bonus Clawback',
        description: 'Recuperação de bônus não utilizado',
        amount: 150.00,
        currency: 'USD',
        account_type: 'bonus',
        reference_id: 'CLB_2024_07_001',
        user_id: 'user_007',
        user_name: 'Ana Costa',
        metadata: {
          notes: 'Bônus expirado recuperado automaticamente'
        }
      },
      {
        id: '8',
        date: '2024-07-23T18:30:00Z',
        category: 'expense',
        subcategory: 'Tax Provisions',
        description: 'Provisão para impostos sobre lucros',
        amount: -387.07,
        currency: 'USD',
        account_type: 'tax',
        reference_id: 'TAX_PROV_001',
        metadata: {
          tax_rate: 0.15,
          notes: '15% sobre lucros do trimestre'
        }
      }
    ];

    setRecords(mockRecords);
    
    // Calcular resumo financeiro
    const revenue = mockRecords.filter(r => r.category === 'revenue').reduce((sum, r) => sum + r.amount, 0);
    const expenses = mockRecords.filter(r => r.category === 'expense').reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    const newSummary: FinancialSummary = {
      total_revenue: revenue,
      total_expenses: expenses,
      net_profit: netProfit,
      profit_margin: profitMargin,
      trading_volume: mockRecords.filter(r => r.account_type === 'trading').reduce((sum, r) => sum + Math.abs(r.amount), 0),
      commission_earned: mockRecords.filter(r => r.account_type === 'commission').reduce((sum, r) => sum + r.amount, 0),
      fees_paid: mockRecords.filter(r => r.account_type === 'fee').reduce((sum, r) => sum + Math.abs(r.amount), 0),
      active_users: new Set(mockRecords.map(r => r.user_id).filter(Boolean)).size,
      monthly_growth: 12.5
    };
    
    setSummary(newSummary);
    setLoading(false);
  }, []);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.user_name && record.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.reference_id && record.reference_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || record.category === filterCategory;
    const matchesType = filterType === 'all' || record.account_type === filterType;
    const matchesCurrency = filterCurrency === 'all' || record.currency === filterCurrency;
    
    return matchesSearch && matchesCategory && matchesType && matchesCurrency;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'expense': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'asset': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'liability': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'equity': return 'bg-purple-400/20 text-purple-400 border border-purple-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <FiArrowUp className="w-4 h-4" />;
      case 'expense': return <FiArrowDown className="w-4 h-4" />;
      case 'asset': return <FiTarget className="w-4 h-4" />;
      case 'liability': return <FiCreditCard className="w-4 h-4" />;
      case 'equity': return <FiTarget className="w-4 h-4" />;
      default: return <FiDollarSign className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return <FiTrendingUp className="w-4 h-4" />;
      case 'commission': return <FiShare2 className="w-4 h-4" />;
      case 'fee': return <FiActivity className="w-4 h-4" />;
      case 'bonus': return <FiZap className="w-4 h-4" />;
      case 'refund': return <FiRefreshCw className="w-4 h-4" />;
      case 'withdrawal': return <FiArrowDown className="w-4 h-4" />;
      case 'deposit': return <FiArrowUp className="w-4 h-4" />;
      case 'expense': return <FiDollarSign className="w-4 h-4" />;
      case 'tax': return <FiFileText className="w-4 h-4" />;
      default: return <FiBarChart className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Contabilidade...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Contabilidade | CoinBitClub Admin</title>
        <meta name="description" content="Contabilidade - CoinBitClub Admin" />
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
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
                <h2 className="text-2xl font-bold text-yellow-400">Contabilidade</h2>
              </div>

              <div className="flex items-center space-x-6">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-black/50 border-2 border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="365">Último ano</option>
                </select>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Atualizar</span>
                </button>
                <button className="flex items-center px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold">
                  <FiDownload className="w-5 h-5 mr-2" />
                  <span>Relatório</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="text-center">
                  <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Receita Total</p>
                  <p className="text-2xl font-bold text-yellow-400">${summary.total_revenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Despesas</p>
                  <p className="text-2xl font-bold text-yellow-400">${summary.total_expenses.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${summary.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${summary.net_profit.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Margem</p>
                  <p className={`text-2xl font-bold ${summary.profit_margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {summary.profit_margin.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Vol. Trading</p>
                  <p className="text-2xl font-bold text-yellow-400">${summary.trading_volume.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                <div className="text-center">
                  <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">Comissões</p>
                  <p className="text-2xl font-bold text-yellow-400">${summary.commission_earned.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                <div className="text-center">
                  <p className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-2">Taxas Pagas</p>
                  <p className="text-2xl font-bold text-yellow-400">${summary.fees_paid.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                <div className="text-center">
                  <p className="text-teal-400 text-sm font-bold uppercase tracking-wider mb-2">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-yellow-400">{summary.active_users}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-indigo-400/50 shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                <div className="text-center">
                  <p className="text-indigo-400 text-sm font-bold uppercase tracking-wider mb-2">Crescimento</p>
                  <p className="text-2xl font-bold text-green-400">+{summary.monthly_growth}%</p>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar registros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="revenue">Receita</option>
                  <option value="expense">Despesa</option>
                  <option value="asset">Ativo</option>
                  <option value="liability">Passivo</option>
                  <option value="equity">Patrimônio</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="trading">Trading</option>
                  <option value="commission">Comissão</option>
                  <option value="fee">Taxa</option>
                  <option value="bonus">Bônus</option>
                  <option value="refund">Reembolso</option>
                  <option value="withdrawal">Saque</option>
                  <option value="deposit">Depósito</option>
                  <option value="expense">Despesa</option>
                  <option value="tax">Imposto</option>
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
                <button className="flex items-center justify-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300 font-bold">
                  <FiPieChart className="w-5 h-5 mr-2" />
                  <span>Gráficos</span>
                </button>
              </div>
            </div>

            {/* Tabela de Registros Contábeis */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Data/Categoria</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Tipo/Valor</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Referência</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-blue-400 text-sm">{new Date(record.date).toLocaleString('pt-BR')}</p>
                            <div className="flex items-center mt-2">
                              <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getCategoryColor(record.category)}`}>
                                {getCategoryIcon(record.category)}
                                <span className="ml-2">{record.category}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold">{record.subcategory}</p>
                            <p className="text-blue-400 text-sm mt-1">{record.description}</p>
                            {record.metadata?.notes && (
                              <p className="text-pink-400 text-xs mt-1">{record.metadata.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="flex items-center px-2 py-1 bg-blue-400/20 text-blue-400 border border-blue-400/50 rounded text-xs font-bold">
                              {getTypeIcon(record.account_type)}
                              <span className="ml-1">{record.account_type}</span>
                            </span>
                          </div>
                          <div>
                            <p className={`text-lg font-bold ${record.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {record.amount >= 0 ? '+' : ''}{record.amount.toFixed(4)} {record.currency}
                            </p>
                            {record.metadata?.exchange_rate && record.metadata.exchange_rate !== 1.0 && (
                              <p className="text-blue-400 text-xs">Taxa: {record.metadata.exchange_rate}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {record.user_name ? (
                              <>
                                <p className="text-yellow-400 font-bold">{record.user_name}</p>
                                <p className="text-blue-400 text-xs">ID: {record.user_id}</p>
                              </>
                            ) : (
                              <p className="text-gray-400 text-sm">Sistema</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold text-sm">{record.reference_id}</p>
                            {record.transaction_hash && (
                              <p className="text-blue-400 text-xs mt-1" title={record.transaction_hash}>
                                {record.transaction_hash.substring(0, 12)}...
                              </p>
                            )}
                            {record.metadata?.operation_id && (
                              <p className="text-pink-400 text-xs mt-1">Op: {record.metadata.operation_id}</p>
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
                            <button
                              className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-green-400 hover:text-pink-400 bg-green-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                              title="Download PDF"
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

            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <FiBarChart className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhum registro encontrado</p>
                <p className="text-blue-400">Ajuste os filtros ou período selecionado</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Contabilidade - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema completo de gestão financeira e contábil</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
