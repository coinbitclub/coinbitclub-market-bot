import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiDollarSign, FiSettings, FiLogOut, FiMenu, FiX,
  FiRefreshCw, FiEye, FiStar, FiUserPlus, FiShare2, FiCopy, FiCheck,
  FiMail, FiCalendar, FiActivity, FiTrendingUp, FiBarChart, FiSearch,
  FiFilter, FiDownload, FiTarget, FiAward
} from 'react-icons/fi';

interface Referral {
  id: string;
  name: string;
  email: string;
  phone: string;
  join_date: string;
  status: 'active' | 'inactive' | 'pending';
  plan_type: string;
  commission_generated: number;
  last_activity: string;
  total_spent: number;
  conversion_source: string;
  level: number;
}

export default function AffiliateReferrals() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'premium' | 'vip'>('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          window.location.href = '/auth/login';
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (!['afiliado_normal', 'afiliado_vip'].includes(parsedUser.user_type)) {
          window.location.href = '/auth/login';
          return;
        }

        setUser(parsedUser);
        await fetchReferrals();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/auth/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    let filtered = referrals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(ref => 
        ref.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ref => ref.status === statusFilter);
    }

    // Filter by plan
    if (planFilter !== 'all') {
      filtered = filtered.filter(ref => ref.plan_type.toLowerCase() === planFilter);
    }

    setFilteredReferrals(filtered);
  }, [referrals, searchTerm, statusFilter, planFilter]);

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/affiliate/referrals');
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error('Erro ao buscar indicações:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/login';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'inactive': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'basic': return 'text-blue-400';
      case 'premium': return 'text-yellow-400';
      case 'vip': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const exportReferrals = () => {
    const csvContent = [
      ['Nome', 'Email', 'Data Adesão', 'Status', 'Plano', 'Comissão Gerada', 'Total Investido'],
      ...filteredReferrals.map(ref => [
        ref.name,
        ref.email,
        new Date(ref.join_date).toLocaleDateString('pt-BR'),
        ref.status,
        ref.plan_type,
        `R$ ${ref.commission_generated.toLocaleString('pt-BR')}`,
        `R$ ${ref.total_spent.toLocaleString('pt-BR')}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `indicacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Indicações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Indicações | CoinBitClub</title>
        <meta name="description" content="Indicações do Afiliado - CoinBitClub" />
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
              <a href="/affiliate/dashboard" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Indicações</span>
              </a>
              <a href="/affiliate/commissions" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Comissões</span>
              </a>
              <a href="/affiliate/materials" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiShare2 className="w-6 h-6 mr-4" />
                <span>Materiais</span>
              </a>
              <a href="/affiliate/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
              
              <div className="border-t border-yellow-400/30 pt-4 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-6 py-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 border-2 border-transparent hover:border-red-400/50 rounded-xl transition-all duration-300 font-medium"
                >
                  <FiLogOut className="w-6 h-6 mr-4" />
                  <span>Sair</span>
                </button>
              </div>
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
                <h2 className="text-2xl font-bold text-yellow-400">Indicações</h2>
                <span className="px-3 py-1 bg-blue-400/20 text-blue-400 text-sm font-bold rounded-full">
                  {filteredReferrals.length} indicações
                </span>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={exportReferrals}
                  className="flex items-center px-4 py-2 text-green-400 hover:text-green-300 bg-green-400/20 hover:bg-green-400/30 border border-green-400/50 rounded-lg transition-all duration-300"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Exportar
                </button>
                <button
                  onClick={fetchReferrals}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Filters */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="pending">Pendentes</option>
                </select>
                
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>

                <div className="text-yellow-400 text-sm flex items-center">
                  <FiUsers className="w-4 h-4 mr-2" />
                  Total: {filteredReferrals.length} indicações
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-400/20 rounded-xl">
                    <FiUserPlus className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-green-400 text-xl font-bold">
                    {referrals.filter(ref => ref.status === 'active').length}
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold">Indicações Ativas</h3>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-400/20 rounded-xl">
                    <FiCalendar className="w-6 h-6 text-yellow-400" />
                  </div>
                  <span className="text-yellow-400 text-xl font-bold">
                    {referrals.filter(ref => 
                      new Date(ref.join_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    ).length}
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold">Este Mês</h3>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-400/20 rounded-xl">
                    <FiTrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-blue-400 text-xl font-bold">
                    {((referrals.filter(ref => ref.status === 'active').length / referrals.length) * 100 || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold">Taxa de Conversão</h3>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-400/20 rounded-xl">
                    <FiDollarSign className="w-6 h-6 text-pink-400" />
                  </div>
                  <span className="text-pink-400 text-xl font-bold">
                    R$ {(referrals.reduce((sum, ref) => sum + ref.commission_generated, 0) || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold">Comissões Totais</h3>
              </div>
            </div>

            {/* Referrals Table */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Indicado</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Contato</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Adesão</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Plano</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-yellow-400 font-bold uppercase tracking-wider">Comissão</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredReferrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold text-lg">{referral.name}</p>
                            <p className="text-blue-400 text-sm">
                              Nível {referral.level} • {referral.conversion_source}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white flex items-center">
                              <FiMail className="w-4 h-4 mr-2 text-blue-400" />
                              {referral.email}
                            </p>
                            {referral.phone && (
                              <p className="text-blue-400 text-sm mt-1">{referral.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-bold">
                              {new Date(referral.join_date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-blue-400 text-sm">
                              Último acesso: {new Date(referral.last_activity).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {referral.plan_type.toLowerCase() === 'vip' && (
                              <FiStar className="w-4 h-4 text-pink-400 mr-2" />
                            )}
                            <span className={`font-bold ${getPlanColor(referral.plan_type)}`}>
                              {referral.plan_type.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-blue-400 text-sm">
                            Total gasto: R$ {referral.total_spent.toLocaleString('pt-BR')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(referral.status)}`}>
                            {referral.status === 'active' && 'ATIVO'}
                            {referral.status === 'inactive' && 'INATIVO'}
                            {referral.status === 'pending' && 'PENDENTE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-green-400 font-bold text-lg">
                            R$ {referral.commission_generated.toLocaleString('pt-BR')}
                          </p>
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
                              className="p-2 text-blue-400 hover:text-blue-300 bg-blue-400/20 hover:bg-blue-400/30 rounded-lg transition-colors"
                              title="Enviar Mensagem"
                            >
                              <FiMail className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredReferrals.length === 0 && (
              <div className="text-center py-12">
                <FiUsers className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhuma indicação encontrada</p>
                <p className="text-blue-400">Compartilhe seu link de afiliado para começar a ganhar comissões</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Indicações - CoinBitClub ⚡</p>
              <p className="text-blue-300">Acompanhe o desempenho dos seus indicados</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
