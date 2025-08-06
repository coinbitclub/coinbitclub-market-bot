// ============================================================================
// 🤝 DASHBOARD AFILIADO INTEGRADO - SEM DADOS MOCK
// ============================================================================
// Dashboard do afiliado 100% integrado com backend
// Dados em tempo real via API Railway
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth, withAuth } from '../../src/contexts/AuthContextIntegrated';
import { affiliateService } from '../../src/lib/api-client-integrated';
import { 
  FiHome, 
  FiUsers, 
  FiDollarSign, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiTrendingUp,
  FiActivity,
  FiShare2,
  FiCopy,
  FiGift,
  FiPercent,
  FiCalendar,
  FiBarChart
} from 'react-icons/fi';

// 📊 Interfaces dos dados
interface AffiliateStats {
  commission: {
    total_earned: number;
    this_month: number;
    pending: number;
    available: number;
    next_payment: string;
  };
  referrals: {
    total_count: number;
    active_count: number;
    this_month: number;
    conversion_rate: number;
    levels: {
      level_1: number;
      level_2: number;
      level_3: number;
    };
  };
  performance: {
    commission_rate: number;
    rank: string;
    points: number;
    next_rank_points: number;
    monthly_volume: number;
    top_referrer_bonus: number;
  };
  recent_referrals: Array<{
    id: string;
    name: string;
    email: string;
    joined_at: string;
    status: 'active' | 'pending' | 'inactive';
    commission_generated: number;
    level: number;
  }>;
  earnings_history: Array<{
    date: string;
    amount: number;
    type: 'commission' | 'bonus';
    description: string;
    referral_name?: string;
  }>;
  referral_link: string;
  promotional_materials: Array<{
    type: 'banner' | 'text' | 'video';
    title: string;
    url: string;
    description: string;
  }>;
}

const AffiliateDashboardIntegrated: NextPage = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEarnings, setShowEarnings] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Estados dos dados
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [error, setError] = useState('');

  // 🚀 Carregar dados do afiliado
  useEffect(() => {
    loadAffiliateData();
    
    // Auto-refresh a cada 120 segundos
    const interval = setInterval(loadAffiliateData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadAffiliateData = async () => {
    try {
      setError('');
      
      const [statsResponse] = await Promise.all([
        affiliateService.getAffiliateStats()
      ]);

      // Combinar dados
      const combinedStats = {
        ...statsResponse,
        promotional_materials: []
      };

      setAffiliateStats(combinedStats);
      
      console.log('✅ Affiliate data loaded:', combinedStats);
    } catch (error: any) {
      console.error('❌ Error loading affiliate data:', error);
      setError(error.message || 'Erro ao carregar dados do afiliado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAffiliateData();
  };

  const handleLogout = async () => {
    await logout();
  };

  const copyReferralLink = async () => {
    if (affiliateStats?.referral_link) {
      try {
        await navigator.clipboard.writeText(affiliateStats.referral_link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  // 💰 Componente de Comissões
  const CommissionCard: React.FC = () => {
    if (!affiliateStats) return null;

    const { commission } = affiliateStats;

    return (
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Comissões</h2>
          <button
            onClick={() => setShowEarnings(!showEarnings)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {showEarnings ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm opacity-90">Total Ganho</p>
            <p className="text-3xl font-bold">
              {showEarnings ? `R$ ${commission.total_earned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-xs opacity-75">Este Mês</p>
              <p className="text-lg font-semibold">
                {showEarnings ? `R$ ${commission.this_month.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-75">Disponível</p>
              <p className="text-lg font-semibold">
                {showEarnings ? `R$ ${commission.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/20">
            <div>
              <p className="text-xs opacity-75">Pendente</p>
              <p className="text-lg font-semibold">
                {showEarnings ? `R$ ${commission.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">Próx. Pagamento</p>
              <p className="text-sm font-medium">
                {new Date(commission.next_payment).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 📊 Componente de Card de Estatística
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    trend?: number;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, trend, color, subtitle }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-xl font-bold ${color} mt-1`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% este mês
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${color.replace('text-', 'bg-').replace('400', '600')} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // 👥 Componente de Indicação Recente
  const ReferralItem: React.FC<{ referral: AffiliateStats['recent_referrals'][0] }> = ({ referral }) => {
    const statusColors = {
      active: 'bg-green-600 text-green-100',
      pending: 'bg-yellow-600 text-yellow-100',
      inactive: 'bg-gray-600 text-gray-100'
    };

    const statusLabels = {
      active: 'Ativo',
      pending: 'Pendente',
      inactive: 'Inativo'
    };
    
    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-700 rounded-lg transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {referral.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{referral.name}</p>
            <p className="text-gray-400 text-xs">{referral.email}</p>
            <p className="text-gray-500 text-xs">
              Nível {referral.level} • {new Date(referral.joined_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-green-400 text-sm font-medium">
            R$ {referral.commission_generated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColors[referral.status]}`}>
            {statusLabels[referral.status]}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-white mt-4">🤝 Carregando Dashboard do Afiliado...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/affiliate/dashboard', icon: FiHome, active: true },
    { name: 'Indicações', href: '/affiliate/referrals', icon: FiUsers },
    { name: 'Comissões', href: '/affiliate/earnings', icon: FiDollarSign },
    { name: 'Materiais', href: '/affiliate/materials', icon: FiShare2 },
    { name: 'Relatórios', href: '/affiliate/reports', icon: FiBarChart },
    { name: 'Configurações', href: '/affiliate/settings', icon: FiSettings },
  ];

  return (
    <>
      <Head>
        <title>Dashboard Afiliado - CoinBitClub</title>
        <meta name="description" content="Seu dashboard de afiliado CoinBitClub" />
      </Head>

      <div className="flex h-screen bg-gray-900">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-black">🤝</span>
              </div>
              <span className="ml-2 text-white font-semibold">Afiliado</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-4 px-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      item.active
                        ? 'bg-green-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-white text-sm font-medium">{user?.name}</p>
                <p className="text-gray-400 text-xs">Afiliado {affiliateStats?.performance.rank}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4 mr-3" />
              Sair
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-4"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Olá, {user?.name?.split(' ')[0]}! 🤝
                </h1>
                <p className="text-sm text-gray-400">
                  Rank: {affiliateStats?.performance.rank} • {affiliateStats?.performance.points} pontos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-2 text-sm text-red-300 hover:text-red-200"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Commission Card */}
            <div className="mb-8">
              <CommissionCard />
            </div>

            {/* Stats Cards */}
            {affiliateStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total de Indicações"
                  value={affiliateStats.referrals.total_count}
                  icon={FiUsers}
                  color="text-blue-400"
                  subtitle={`${affiliateStats.referrals.active_count} ativos`}
                />
                <StatCard
                  title="Taxa Comissão"
                  value={`${affiliateStats.performance.commission_rate}%`}
                  icon={FiPercent}
                  color="text-green-400"
                />
                <StatCard
                  title="Volume Mensal"
                  value={`R$ ${affiliateStats.performance.monthly_volume.toLocaleString('pt-BR')}`}
                  icon={FiTrendingUp}
                  color="text-purple-400"
                />
                <StatCard
                  title="Conversão"
                  value={`${affiliateStats.referrals.conversion_rate}%`}
                  icon={FiActivity}
                  color="text-orange-400"
                />
              </div>
            )}

            {/* Referral Link Section */}
            {affiliateStats && (
              <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiShare2 className="w-5 h-5 mr-2" />
                  Seu Link de Indicação
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-300 text-sm break-all">
                      {affiliateStats.referral_link}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className={`px-4 py-3 ${linkCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors flex items-center`}
                  >
                    <FiCopy className="w-4 h-4 mr-2" />
                    {linkCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Referrals */}
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Indicações Recentes</h2>
                    <Link
                      href="/affiliate/referrals"
                      className="text-green-400 hover:text-green-300 text-sm flex items-center"
                    >
                      Ver todas <FiEye className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {affiliateStats?.recent_referrals.length ? (
                    <div className="space-y-2">
                      {affiliateStats.recent_referrals.map((referral) => (
                        <ReferralItem key={referral.id} referral={referral} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiUsers className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhuma indicação ainda</p>
                      <button
                        onClick={copyReferralLink}
                        className="mt-4 inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Compartilhar Link
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings History */}
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Histórico de Ganhos</h2>
                    <Link
                      href="/affiliate/earnings"
                      className="text-green-400 hover:text-green-300 text-sm flex items-center"
                    >
                      Ver detalhes <FiEye className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {affiliateStats?.earnings_history.length ? (
                    <div className="space-y-4">
                      {affiliateStats.earnings_history.slice(0, 5).map((earning, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{earning.description}</p>
                            {earning.referral_name && (
                              <p className="text-gray-400 text-sm">por {earning.referral_name}</p>
                            )}
                            <p className="text-gray-500 text-xs">
                              {new Date(earning.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-medium">
                              +R$ {earning.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              earning.type === 'commission' ? 'bg-blue-600 text-blue-100' : 'bg-purple-600 text-purple-100'
                            }`}>
                              {earning.type === 'commission' ? 'Comissão' : 'Bônus'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiDollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum ganho ainda</p>
                      <p className="text-gray-500 text-sm mt-1">Comece a indicar amigos para ganhar comissões</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={copyReferralLink}
                className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                <FiShare2 className="w-5 h-5 mr-2" />
                Compartilhar Link
              </button>
              
              <Link
                href="/affiliate/materials"
                className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <FiGift className="w-5 h-5 mr-2" />
                Materiais
              </Link>
              
              <Link
                href="/affiliate/earnings"
                className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                <FiDollarSign className="w-5 h-5 mr-2" />
                Sacar Comissões
              </Link>
              
              <Link
                href="/affiliate/reports"
                className="flex items-center justify-center p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
              >
                <FiBarChart className="w-5 h-5 mr-2" />
                Relatórios
              </Link>
            </div>

            {/* Performance Progress */}
            {affiliateStats && (
              <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiTrendingUp className="w-5 h-5 mr-2" />
                  Progresso para Próximo Nível
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rank Atual: {affiliateStats.performance.rank}</span>
                    <span className="text-gray-400">{affiliateStats.performance.points} / {affiliateStats.performance.next_rank_points} pontos</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((affiliateStats.performance.points / affiliateStats.performance.next_rank_points) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Faltam {affiliateStats.performance.next_rank_points - affiliateStats.performance.points} pontos para o próximo nível
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default withAuth(AffiliateDashboardIntegrated, {
  allowedRoles: ['affiliate'],
  requireEmailVerification: false,
  requirePhoneVerification: false
});
