import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiDollarSign, FiSettings, FiMenu, FiX,
  FiTrendingUp, FiRefreshCw, FiEye, FiShare2, FiCopy,
  FiShield, FiGift, FiTarget, FiBarChart, FiCalendar,
  FiUser, FiAward, FiPercent, FiTrendingDown, FiLink,
  FiStar, FiCrown, FiArrowUp, FiArrowDown, FiActivity
} from 'react-icons/fi';

interface Referral {
  id: string;
  name: string;
  email: string;
  registration_date: string;
  status: 'active' | 'inactive';
  plan_type: string;
  total_invested: number;
  commission_generated: number;
  level: number;
}

interface Commission {
  id: string;
  type: 'direct' | 'indirect' | 'bonus';
  amount: number;
  source_user: string;
  description: string;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
}

interface AffiliateDashboardData {
  affiliate: {
    id: string;
    name: string;
    code: string;
    level: number;
    total_referrals: number;
    active_referrals: number;
    commission_rate: number;
    bonus_rate: number;
    total_earned: number;
    pending_commission: number;
    available_balance: number;
    next_payout_date: string;
  };
  referrals: Referral[];
  recent_commissions: Commission[];
  stats: {
    this_month_commissions: number;
    last_month_commissions: number;
    commission_growth: number;
    top_performer: string;
    conversion_rate: number;
    avg_commission_per_referral: number;
  };
  links: {
    referral_link: string;
    qr_code_url: string;
    landing_page_url: string;
  };
}

export default function AffiliateDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/affiliate/dashboard?period=${selectedPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Erro ao buscar dados do dashboard');
        setDashboardData(getMockData());
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setDashboardData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): AffiliateDashboardData => ({
    affiliate: {
      id: '1',
      name: 'João Silva',
      code: 'JOAO2024',
      level: 3,
      total_referrals: 47,
      active_referrals: 32,
      commission_rate: 25.0,
      bonus_rate: 5.0,
      total_earned: 18547.80,
      pending_commission: 1247.50,
      available_balance: 3890.25,
      next_payout_date: '2024-08-01T00:00:00Z'
    },
    referrals: [
      {
        id: '1',
        name: 'Maria Santos',
        email: 'maria@email.com',
        registration_date: '2024-07-20T00:00:00Z',
        status: 'active',
        plan_type: 'premium',
        total_invested: 2500.00,
        commission_generated: 625.00,
        level: 1
      },
      {
        id: '2',
        name: 'Carlos Oliveira',
        email: 'carlos@email.com',
        registration_date: '2024-07-18T00:00:00Z',
        status: 'active',
        plan_type: 'professional',
        total_invested: 5000.00,
        commission_generated: 1250.00,
        level: 1
      },
      {
        id: '3',
        name: 'Ana Costa',
        email: 'ana@email.com',
        registration_date: '2024-07-15T00:00:00Z',
        status: 'inactive',
        plan_type: 'basic',
        total_invested: 500.00,
        commission_generated: 125.00,
        level: 2
      }
    ],
    recent_commissions: [
      {
        id: '1',
        type: 'direct',
        amount: 375.00,
        source_user: 'Maria Santos',
        description: 'Comissão sobre plano Premium',
        date: '2024-07-25T08:00:00Z',
        status: 'paid',
        payment_date: '2024-07-25T12:00:00Z'
      },
      {
        id: '2',
        type: 'indirect',
        amount: 150.00,
        source_user: 'Pedro Silva',
        description: 'Comissão indireta nível 2',
        date: '2024-07-24T14:30:00Z',
        status: 'pending'
      },
      {
        id: '3',
        type: 'bonus',
        amount: 500.00,
        source_user: 'Sistema',
        description: 'Bônus por atingir meta mensal',
        date: '2024-07-23T00:00:00Z',
        status: 'paid',
        payment_date: '2024-07-23T18:00:00Z'
      }
    ],
    stats: {
      this_month_commissions: 4250.00,
      last_month_commissions: 3890.00,
      commission_growth: 9.25,
      top_performer: 'Maria Santos',
      conversion_rate: 68.0,
      avg_commission_per_referral: 133.75
    },
    links: {
      referral_link: 'https://coinbitclub.com/register?ref=JOAO2024',
      qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://coinbitclub.com/register?ref=JOAO2024',
      landing_page_url: 'https://coinbitclub.com/affiliate/JOAO2024'
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aqui poderia adicionar um toast de confirmação
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'inactive': return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
      case 'paid': return 'bg-blue-400/20 text-blue-400 border border-blue-400/50';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      case 'cancelled': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  const getCommissionTypeIcon = (type: string) => {
    switch (type) {
      case 'direct': return <FiUser className="w-4 h-4" />;
      case 'indirect': return <FiUsers className="w-4 h-4" />;
      case 'bonus': return <FiGift className="w-4 h-4" />;
      default: return <FiDollarSign className="w-4 h-4" />;
    }
  };

  const getLevelIcon = (level: number) => {
    return level === 1 ? <FiUser className="w-4 h-4" /> : <FiUsers className="w-4 h-4" />;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const data = dashboardData || getMockData();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Afiliado | CoinBitClub</title>
        <meta name="description" content="Dashboard completo para afiliados - CoinBitClub" />
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
              <a href="/affiliate/dashboard" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/affiliate/referrals" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Indicados</span>
              </a>
              <a href="/affiliate/commissions" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Comissões</span>
              </a>
              <a href="/affiliate/materials" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiShare2 className="w-6 h-6 mr-4" />
                <span>Material</span>
              </a>
              <a href="/affiliate/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 border border-yellow-400/30 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-400">
                <FiShield className="w-4 h-4 mr-2 text-pink-400" />
                {data.affiliate.name}
              </div>
              <p className="text-xs text-blue-400 mt-1">
                Afiliado Nível {data.affiliate.level} • {data.affiliate.code}
              </p>
            </div>
          </div>
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
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400">Dashboard Afiliado</h2>
                  <p className="text-blue-400 text-sm">
                    Bem-vindo de volta, {data.affiliate.name}!
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="12m">Últimos 12 meses</option>
                </select>
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-black min-h-screen">
            {/* Alertas e Informações Importantes */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border border-yellow-400/50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">🎉 Parabéns! Meta Atingida!</h3>
                    <p className="text-blue-400">
                      Você ultrapassou sua meta mensal de comissões. Bônus especial de R$ 500 creditado!
                    </p>
                  </div>
                  <div className="text-6xl">
                    <FiTrendingUp className="text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total de Indicados */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiUsers className="w-8 h-8 text-blue-400" />
                  <span className="text-xs text-blue-300 bg-blue-400/20 px-2 py-1 rounded-full">
                    {data.affiliate.active_referrals} ativos
                  </span>
                </div>
                <p className="text-blue-300 text-sm mb-1">Total de Indicados</p>
                <p className="text-3xl font-bold text-blue-400">{data.affiliate.total_referrals}</p>
              </div>

              {/* Comissões Totais */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiDollarSign className="w-8 h-8 text-yellow-400" />
                  <span className="text-xs text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-full">
                    {data.stats.commission_growth > 0 ? '+' : ''}{data.stats.commission_growth.toFixed(1)}%
                  </span>
                </div>
                <p className="text-yellow-300 text-sm mb-1">Total Ganho</p>
                <p className="text-3xl font-bold text-yellow-400">
                  R$ {data.affiliate.total_earned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Saldo Disponível */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiTrendingUp className="w-8 h-8 text-green-400" />
                  <button className="text-xs text-green-300 bg-green-400/20 px-2 py-1 rounded-full hover:bg-green-400/30 transition-colors">
                    Sacar
                  </button>
                </div>
                <p className="text-green-300 text-sm mb-1">Saldo Disponível</p>
                <p className="text-3xl font-bold text-green-400">
                  R$ {data.affiliate.available_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Taxa de Conversão */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <FiTarget className="w-8 h-8 text-purple-400" />
                  <span className="text-xs text-purple-300 bg-purple-400/20 px-2 py-1 rounded-full">
                    Meta: 70%
                  </span>
                </div>
                <p className="text-purple-300 text-sm mb-1">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-purple-400">{data.stats.conversion_rate}%</p>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Comissões do Mês */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiBarChart className="w-6 h-6 mr-3" />
                  Performance Mensal
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <FiCalendar className="w-5 h-5 text-blue-400 mr-2" />
                      <span className="text-blue-300 text-sm">Este Mês</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">
                      R$ {data.stats.this_month_commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <FiActivity className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-300 text-sm">Mês Anterior</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-400">
                      R$ {data.stats.last_month_commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-yellow-400/20">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-300">Crescimento:</span>
                    <div className="flex items-center">
                      {data.stats.commission_growth > 0 ? (
                        <FiArrowUp className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <FiArrowDown className="w-4 h-4 text-red-400 mr-1" />
                      )}
                      <span className={`font-bold ${data.stats.commission_growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {data.stats.commission_growth > 0 ? '+' : ''}{data.stats.commission_growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Afiliado */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiCrown className="w-6 h-6 mr-3" />
                  Seu Status de Afiliado
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Código de Indicação:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400 font-bold">{data.affiliate.code}</span>
                      <button
                        onClick={() => copyToClipboard(data.affiliate.code)}
                        className="text-blue-400 hover:text-yellow-400 transition-colors"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Nível do Afiliado:</span>
                    <div className="flex items-center">
                      <span className="text-purple-400 font-bold mr-2">Nível {data.affiliate.level}</span>
                      <FiStar className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Taxa de Comissão:</span>
                    <span className="text-green-400 font-bold">{data.affiliate.commission_rate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Taxa de Bônus:</span>
                    <span className="text-pink-400 font-bold">{data.affiliate.bonus_rate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Próximo Pagamento:</span>
                    <span className="text-yellow-400 font-bold">
                      {new Date(data.affiliate.next_payout_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Links de Indicação */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mb-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                <FiShare2 className="w-6 h-6 mr-3" />
                Seus Links de Indicação
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-400 text-sm font-medium mb-2">
                    Link Principal de Indicação
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={data.links.referral_link}
                      readOnly
                      className="flex-1 px-4 py-3 bg-black border border-blue-400/50 rounded-l-lg text-blue-400 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(data.links.referral_link)}
                      className="px-4 py-3 bg-yellow-400/20 border border-yellow-400/50 rounded-r-lg text-yellow-400 hover:bg-yellow-400/30 transition-colors"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-blue-400 text-sm font-medium mb-2">
                    Landing Page Personalizada
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={data.links.landing_page_url}
                      readOnly
                      className="flex-1 px-4 py-3 bg-black border border-blue-400/50 rounded-l-lg text-blue-400 text-sm"
                    />
                    <button
                      onClick={() => window.open(data.links.landing_page_url, '_blank')}
                      className="px-4 py-3 bg-green-400/20 border border-green-400/50 rounded-r-lg text-green-400 hover:bg-green-400/30 transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-yellow-400/20">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-blue-400 text-sm mb-4">QR Code para Compartilhamento</p>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img 
                        src={data.links.qr_code_url} 
                        alt="QR Code" 
                        className="w-32 h-32"
                      />
                    </div>
                    <p className="text-blue-300 text-xs mt-2">Escaneie para indicar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicados Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Indicados */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiAward className="w-6 h-6 mr-3" />
                  Top Indicados
                </h3>

                <div className="space-y-4">
                  {data.referrals.slice(0, 5).map((referral, index) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-blue-400/20">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          index === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-400/20 text-orange-400' :
                          'bg-blue-400/20 text-blue-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-blue-400 font-medium">{referral.name}</p>
                          <div className="flex items-center space-x-2">
                            {getLevelIcon(referral.level)}
                            <span className="text-blue-300 text-sm">Nível {referral.level}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(referral.status)}`}>
                              {referral.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          R$ {referral.commission_generated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-blue-300 text-sm">{referral.plan_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comissões Recentes */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiDollarSign className="w-6 h-6 mr-3" />
                  Comissões Recentes
                </h3>

                <div className="space-y-4">
                  {data.recent_commissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-blue-400/20">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          commission.type === 'direct' ? 'bg-blue-400/20 text-blue-400' :
                          commission.type === 'indirect' ? 'bg-purple-400/20 text-purple-400' :
                          'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {getCommissionTypeIcon(commission.type)}
                        </div>
                        <div>
                          <p className="text-blue-400 font-medium">{commission.source_user}</p>
                          <p className="text-blue-300 text-sm">{commission.description}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(commission.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(commission.status)}`}>
                          {commission.status === 'paid' ? 'Pago' : 
                           commission.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
