import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiCalendar, FiFileText, FiPieChart, FiTarget,
  FiCreditCard, FiArrowUp, FiArrowDown, FiZap
} from 'react-icons/fi';
import {
  MobileNav, MobileCard, ResponsiveGrid, MobileInput,
  MobileButton, MobileModal, MobileTabs, MobileAlert
} from '../../components/mobile/MobileComponents';

interface AccountingRecord {
  id: string;
  date: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  account_type: string;
  reference_id: string;
  user_id?: string;
  user_name?: string;
  transaction_hash?: string;
  metadata?: {
    operation_id?: string;
    affiliate_id?: string;
    exchange_rate?: number;
    tax_rate?: number;
    notes?: string;
  };
}

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  trading_volume: number;
  commission_earned: number;
  fees_paid: number;
  active_users: number;
  monthly_growth: number;
}

export default function AccountingManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        setSummary(summaryData.summary);
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

  const [filterCurrency, setFilterCurrency] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // Fetch real data from backend - NO MORE MOCK DATA
  useEffect(() => {
    setLoading(true);
    // TODO: Implementar integração real com backend
    // Temporariamente definindo dados vazios para identificar
    const realRecords: AccountingRecord[] = [];
    
    setRecords(realRecords);
    setLoading(false);
    
    // Cálculos baseados em dados reais (vazios até integração)
    const revenue = 0;
    const expenses = 0;
    const profit = revenue - expenses;
    
    setFinancialSummary({
      total_revenue: revenue,
      total_expenses: expenses,
      net_profit: profit,
      profit_margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      trading_volume: 0,
      commission_earned: 0,
      fees_paid: 0,
      active_users: 0,
      pending_withdrawals: 0,
      completed_transactions: realRecords.length
    });
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

      <div className="min-h-screen bg-black">
        {/* Mobile Navigation */}
        <MobileNav 
          isOpen={mobileMenuOpen} 
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="⚡ Admin Panel"
        >
          <nav className="px-4 py-4 space-y-3">
            <a href="/admin/dashboard-executive" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiBarChart className="w-5 h-5 mr-3" />
              <span>Dashboard Executivo</span>
            </a>
            <a href="/admin/users" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiUsers className="w-5 h-5 mr-3" />
              <span>Gestão de Usuários</span>
            </a>
            <a href="/admin/affiliates" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiShare2 className="w-5 h-5 mr-3" />
              <span>Gestão de Afiliados</span>
            </a>
            <a href="/admin/operations" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiActivity className="w-5 h-5 mr-3" />
              <span>Operações</span>
            </a>
            <a href="/admin/alerts" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiAlertTriangle className="w-5 h-5 mr-3" />
              <span>Alertas</span>
            </a>
            <a href="/admin/adjustments" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiDollarSign className="w-5 h-5 mr-3" />
              <span>Acertos</span>
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-yellow-400 bg-yellow-400/20 rounded-lg border border-yellow-400/50 font-bold">
              <FiFileText className="w-5 h-5 mr-3" />
              <span>Contabilidade</span>
            </a>
            <a href="/admin/settings" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiSettings className="w-5 h-5 mr-3" />
              <span>Configurações</span>
            </a>
          </nav>
        </MobileNav>

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex flex-col w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30">
            <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
              <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            </div>

            <nav className="mt-8 px-4 space-y-3">
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
                <FiFileText className="w-6 h-6 mr-4" />
                <span>Contabilidade</span>
              </a>
              <a href="/admin/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:w-0">
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-yellow-400/30">
              <div className="flex items-center justify-between px-4 py-4">
                <h2 className="text-lg font-bold text-yellow-400">Contabilidade</h2>
                <div className="flex items-center space-x-2">
                  <MobileButton
                    size="sm"
                    onClick={() => window.location.reload()}
                    icon={<FiRefreshCw className="w-4 h-4" />}
                    className="bg-blue-400 text-black px-3 py-2"
                  >
                    Sync
                  </MobileButton>
                  <MobileButton
                    size="sm"
                    onClick={() => {}}
                    icon={<FiDownload className="w-4 h-4" />}
                    className="bg-yellow-400 text-black px-3 py-2"
                  >
                    PDF
                  </MobileButton>
                </div>
              </div>
            </header>

            {/* Desktop Header */}
            <header className="hidden lg:block bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
              <div className="flex items-center justify-between px-8 py-6">
                <h2 className="text-2xl font-bold text-yellow-400">Contabilidade</h2>
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
            <main className="p-4 lg:p-8 bg-black min-h-screen">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-6 mb-6 lg:mb-8">
                <MobileCard className="border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <div className="text-center">
                    <p className="text-green-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Receita Total</p>
                    <p className="text-lg lg:text-2xl font-bold text-yellow-400">${summary?.total_revenue.toFixed(2)}</p>
                  </div>
                </MobileCard>
                <MobileCard className="border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                  <div className="text-center">
                    <p className="text-red-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Despesas</p>
                    <p className="text-lg lg:text-2xl font-bold text-yellow-400">${summary?.total_expenses.toFixed(2)}</p>
                  </div>
                </MobileCard>
                <MobileCard className="border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                  <div className="text-center">
                    <p className="text-pink-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Lucro Líquido</p>
                    <p className={`text-lg lg:text-2xl font-bold ${summary?.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${summary?.net_profit.toFixed(2)}
                    </p>
                  </div>
                </MobileCard>
                <MobileCard className="border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                  <div className="text-center">
                    <p className="text-yellow-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Margem</p>
                    <p className={`text-lg lg:text-2xl font-bold ${summary?.profit_margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {summary?.profit_margin.toFixed(1)}%
                    </p>
                  </div>
                </MobileCard>
                <MobileCard className="border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="text-center">
                    <p className="text-blue-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Vol. Trading</p>
                    <p className="text-lg lg:text-2xl font-bold text-yellow-400">${summary?.trading_volume.toFixed(2)}</p>
                  </div>
                </MobileCard>
                <MobileCard className="border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                  <div className="text-center">
                    <p className="text-purple-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Comissões</p>
                    <p className="text-lg lg:text-2xl font-bold text-yellow-400">${summary?.commission_earned.toFixed(2)}</p>
                  </div>
                </MobileCard>
                <MobileCard className="border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                  <div className="text-center">
                    <p className="text-orange-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Taxas Pagas</p>
                    <p className="text-lg lg:text-2xl font-bold text-yellow-400">${summary?.fees_paid.toFixed(2)}</p>
                  </div>
                </MobileCard>
                <MobileCard className="border-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                  <div className="text-center">
                    <p className="text-teal-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Usuários Ativos</p>
                    <p className="text-lg lg:text-2xl font-bold text-yellow-400">{summary?.active_users}</p>
                  </div>
                </MobileCard>
                <MobileCard className="border-indigo-400/50 shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                  <div className="text-center">
                    <p className="text-indigo-400 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Crescimento</p>
                    <p className="text-lg lg:text-2xl font-bold text-green-400">+{summary?.monthly_growth}%</p>
                  </div>
                </MobileCard>
              </div>

              {/* Filtros Mobile-Friendly */}
              <MobileCard className="mb-6 lg:mb-8">
                <h3 className="text-lg font-bold text-yellow-400 mb-4 lg:hidden">Filtros</h3>
                
                {/* Mobile Filters - Stack Layout */}
                <div className="space-y-4 lg:hidden">
                  <MobileInput
                    label="Buscar registros"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite para buscar..."
                    icon={<FiSearch className="w-5 h-5" />}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-400 text-sm font-bold mb-2">Categoria</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 text-sm focus:border-yellow-400/70 focus:outline-none transition-colors"
                      >
                        <option value="all">Todas</option>
                        <option value="revenue">Receita</option>
                        <option value="expense">Despesa</option>
                        <option value="asset">Ativo</option>
                        <option value="liability">Passivo</option>
                        <option value="equity">Patrimônio</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-blue-400 text-sm font-bold mb-2">Tipo</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 text-sm focus:border-yellow-400/70 focus:outline-none transition-colors"
                      >
                        <option value="all">Todos</option>
                        <option value="trading">Trading</option>
                        <option value="commission">Comissão</option>
                        <option value="fee">Taxa</option>
                        <option value="bonus">Bônus</option>
                        <option value="withdrawal">Saque</option>
                        <option value="deposit">Depósito</option>
                        <option value="expense">Despesa</option>
                        <option value="tax">Imposto</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-blue-400 text-sm font-bold mb-2">Moeda</label>
                      <select
                        value={filterCurrency}
                        onChange={(e) => setFilterCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 text-sm focus:border-yellow-400/70 focus:outline-none transition-colors"
                      >
                        <option value="all">Todas</option>
                        <option value="USD">USD</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-blue-400 text-sm font-bold mb-2">Período</label>
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 text-sm focus:border-yellow-400/70 focus:outline-none transition-colors"
                      >
                        <option value="7">7 dias</option>
                        <option value="30">30 dias</option>
                        <option value="90">90 dias</option>
                        <option value="365">1 ano</option>
                      </select>
                    </div>
                  </div>
                  
                  <MobileButton
                    fullWidth
                    onClick={() => {}}
                    icon={<FiPieChart className="w-5 h-5" />}
                    className="bg-blue-400/20 border-blue-400/50 text-blue-400 hover:bg-yellow-400/20 hover:border-yellow-400/70 hover:text-yellow-400"
                  >
                    Ver Gráficos
                  </MobileButton>
                </div>

                {/* Desktop Filters - Grid Layout */}
                <div className="hidden lg:grid grid-cols-5 gap-4">
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
              </MobileCard>

              {/* Tabela de Registros - Mobile/Desktop Adaptativo */}
              <MobileCard className="overflow-hidden">
                {/* Mobile Layout - Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="bg-black/50 border border-yellow-400/30 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${getCategoryColor(record.category)}`}>
                              {getCategoryIcon(record.category)}
                              <span className="ml-1">{record.category}</span>
                            </span>
                            <span className="flex items-center px-2 py-1 bg-blue-400/20 text-blue-400 border border-blue-400/50 rounded text-xs">
                              {getTypeIcon(record.account_type)}
                              <span className="ml-1">{record.account_type}</span>
                            </span>
                          </div>
                          <p className="text-blue-400 text-xs">{new Date(record.date).toLocaleString('pt-BR')}</p>
                        </div>
                        <p className={`text-lg font-bold ${record.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {record.amount >= 0 ? '+' : ''}{record.amount.toFixed(2)} {record.currency}
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-yellow-400 font-bold text-sm">{record.subcategory}</p>
                        <p className="text-blue-400 text-sm">{record.description}</p>
                        {record.metadata?.notes && (
                          <p className="text-pink-400 text-xs mt-1">{record.metadata.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          {record.user_name ? (
                            <div>
                              <p className="text-yellow-400 font-bold text-sm">{record.user_name}</p>
                              <p className="text-blue-400 text-xs">Ref: {record.reference_id}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-400 text-sm">Sistema</p>
                              <p className="text-blue-400 text-xs">Ref: {record.reference_id}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <MobileButton
                            size="sm"
                            onClick={() => {}}
                            icon={<FiEye className="w-4 h-4" />}
                            className="bg-yellow-400/20 text-yellow-400 border-yellow-400/50 px-2 py-1"
                          />
                          <MobileButton
                            size="sm"
                            onClick={() => {}}
                            icon={<FiDownload className="w-4 h-4" />}
                            className="bg-green-400/20 text-green-400 border-green-400/50 px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredRecords.length === 0 && (
                    <div className="text-center py-8">
                      <FiFileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-yellow-400 font-bold">Nenhum registro encontrado</p>
                      <p className="text-blue-400 text-sm">Ajuste os filtros para ver resultados</p>
                    </div>
                  )}
                </div>

                {/* Desktop Layout - Table */}
                <div className="hidden lg:block overflow-x-auto">
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
                  
                  {filteredRecords.length === 0 && (
                    <div className="text-center py-12">
                      <FiFileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-yellow-400 text-xl font-bold">Nenhum registro encontrado</p>
                      <p className="text-blue-400">Ajuste os filtros ou período selecionado</p>
                    </div>
                  )}
                </div>
              </MobileCard>

              {/* Footer */}
              <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
                <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Contabilidade - CoinBitClub ⚡</p>
                <p className="text-blue-300">Sistema completo de gestão financeira e contábil</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
