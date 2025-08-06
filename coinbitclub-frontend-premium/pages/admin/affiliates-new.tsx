import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiUserCheck, FiUserX, FiGlobe, FiMapPin, FiCreditCard, FiRefreshCw,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiPercent, FiLink, FiCopy, FiStar, FiAward, FiTarget
} from 'react-icons/fi';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  active_referrals: number;
  total_commission: number;
  monthly_commission: number;
  status: string;
  tier: string;
  created_at: string;
  last_activity: string;
  conversion_rate: number;
  payment_method: string;
  country: string;
}

export default function AffiliatesManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
    total_commission_paid: 0,
    monthly_commission: 0
  });

  // Buscar dados reais da API
  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterTier !== 'all') params.append('tier', filterTier);
      if (filterCountry !== 'all') params.append('country', filterCountry);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/affiliates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAffiliates(data.affiliates);
        setStats(data.stats);
      } else {
        console.error('Erro ao buscar afiliados:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, [searchTerm, filterStatus, filterTier, filterCountry]);

  // Funções para manipular afiliados
  const handleActivateAffiliate = async (affiliateId: string) => {
    try {
      const response = await fetch(`/api/admin/affiliates?id=${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      
      if (response.ok) {
        fetchAffiliates();
      }
    } catch (error) {
      console.error('Erro ao ativar afiliado:', error);
    }
  };

  const handleSuspendAffiliate = async (affiliateId: string) => {
    try {
      const response = await fetch(`/api/admin/affiliates?id=${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' })
      });
      
      if (response.ok) {
        fetchAffiliates();
      }
    } catch (error) {
      console.error('Erro ao suspender afiliado:', error);
    }
  };

  const handleUpgradeTier = async (affiliateId: string, newTier: string) => {
    try {
      const response = await fetch(`/api/admin/affiliates?id=${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });
      
      if (response.ok) {
        fetchAffiliates();
      }
    } catch (error) {
      console.error('Erro ao atualizar tier:', error);
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || affiliate.status === filterStatus;
    const matchesTier = filterTier === 'all' || affiliate.tier === filterTier;
    const matchesCountry = filterCountry === 'all' || affiliate.country === filterCountry;
    
    return matchesSearch && matchesStatus && matchesTier && matchesCountry;
  });

  const copyAffiliateCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Código copiado para a área de transferência!');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'text-blue-300 border-blue-300/50 bg-blue-300/10';
      case 'gold': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
      case 'silver': return 'text-gray-300 border-gray-300/50 bg-gray-300/10';
      default: return 'text-orange-400 border-orange-400/50 bg-orange-400/10';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return <FiAward className="w-4 h-4" />;
      case 'gold': return <FiStar className="w-4 h-4" />;
      case 'silver': return <FiTarget className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Gestão de Afiliados...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Afiliados | CoinBitClub Admin</title>
        <meta name="description" content="Gestão de Afiliados - CoinBitClub Admin" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
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
        <div className="lg:ml-64">
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
                <h2 className="text-2xl font-bold text-yellow-400">Gestão de Afiliados</h2>
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
                  <span>Novo Afiliado</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-6 mb-8">
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
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Inativos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.inactive}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Suspensos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.suspended}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                <div className="text-center">
                  <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Bronze</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.bronze}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-300/50 shadow-[0_0_20px_rgba(209,213,219,0.3)]">
                <div className="text-center">
                  <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">Silver</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.silver}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Gold</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.gold}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-300/50 shadow-[0_0_20px_rgba(147,197,253,0.3)]">
                <div className="text-center">
                  <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">Diamond</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.diamond}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">Total Pago</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.total_commission_paid.toFixed(0)}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Mensal</p>
                  <p className="text-2xl font-bold text-pink-400">${stats.monthly_commission.toFixed(0)}</p>
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
                    placeholder="Buscar por nome, email ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="suspended">Suspensos</option>
                </select>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Níveis</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="diamond">Diamond</option>
                </select>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Países</option>
                  <option value="Brasil">Brasil</option>
                  <option value="Portugal">Portugal</option>
                  <option value="USA">Estados Unidos</option>
                </select>
              </div>
            </div>

            {/* Tabela de Afiliados */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Afiliado</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Código</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Nível</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Comissão</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Indicações</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold">{affiliate.name}</p>
                            <p className="text-blue-400 text-sm">{affiliate.email}</p>
                            <div className="flex items-center mt-1">
                              {affiliate.country === 'Brasil' ? (
                                <FiMapPin className="w-3 h-3 mr-1 text-pink-400" />
                              ) : (
                                <FiGlobe className="w-3 h-3 mr-1 text-blue-400" />
                              )}
                              <span className="text-xs text-blue-300">{affiliate.country}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-pink-400 font-mono font-bold mr-2">{affiliate.affiliate_code}</span>
                            <button
                              onClick={() => copyAffiliateCode(affiliate.affiliate_code)}
                              className="p-1 text-blue-400 hover:text-yellow-400 transition-colors"
                              title="Copiar código"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border ${getTierColor(affiliate.tier)}`}>
                            {getTierIcon(affiliate.tier)}
                            <span className="ml-2">{affiliate.tier}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold text-lg">{affiliate.commission_rate}%</p>
                            <p className="text-pink-400 font-bold">${affiliate.monthly_commission.toFixed(2)}</p>
                            <p className="text-blue-400 text-sm">Total: ${affiliate.total_commission.toFixed(2)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-pink-400 font-bold text-lg">{affiliate.total_referrals}</p>
                            <p className="text-yellow-400 text-sm">Ativos: {affiliate.active_referrals}</p>
                            <p className="text-blue-400 text-sm">Conv: {affiliate.conversion_rate}%</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center mb-1">
                              <FiTrendingUp className="w-4 h-4 mr-1 text-pink-400" />
                              <span className="text-pink-400 font-bold">{affiliate.conversion_rate}%</span>
                            </div>
                            <p className="text-blue-400 text-sm">{affiliate.payment_method}</p>
                            <p className="text-yellow-400 text-xs">Última atividade: {new Date(affiliate.last_activity).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            affiliate.status === 'active' 
                              ? 'bg-pink-400/20 text-pink-400 border border-pink-400/50' 
                              : affiliate.status === 'suspended'
                              ? 'bg-red-400/20 text-red-400 border border-red-400/50'
                              : 'bg-blue-400/20 text-blue-400 border border-blue-400/50'
                          }`}>
                            {affiliate.status === 'active' ? 'Ativo' : affiliate.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                          </span>
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
                              className="p-2 text-pink-400 hover:text-yellow-400 bg-pink-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Editar Afiliado"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            {affiliate.status === 'active' ? (
                              <button
                                onClick={() => handleSuspendAffiliate(affiliate.id)}
                                className="p-2 text-red-400 hover:text-pink-400 bg-red-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                title="Suspender Afiliado"
                              >
                                <FiUserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateAffiliate(affiliate.id)}
                                className="p-2 text-blue-400 hover:text-pink-400 bg-blue-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                                title="Ativar Afiliado"
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Relatório de Comissões"
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

            {filteredAffiliates.length === 0 && (
              <div className="text-center py-12">
                <FiShare2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhum afiliado encontrado</p>
                <p className="text-blue-400">Ajuste os filtros ou adicione novos afiliados</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Gestão de Afiliados - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema de afiliação com níveis e comissões automatizadas</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
