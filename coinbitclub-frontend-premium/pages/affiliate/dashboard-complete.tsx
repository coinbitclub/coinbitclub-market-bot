import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiDollarSign, FiTrendingUp, FiSettings, FiLogOut, FiMenu, FiX,
  FiRefreshCw, FiEye, FiStar, FiAward, FiTarget, FiGift, FiPercent, FiBarChart,
  FiActivity, FiUserPlus, FiShare2, FiCopy, FiCheck, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import RobotOperationTimeline from '../../src/components/trading/RobotOperationTimeline';
import CompactRobotStatus from '../../src/components/trading/CompactRobotStatus';

interface AffiliateDashboardData {
  referrals_count: number;
  active_referrals: number;
  total_commissions: number;
  monthly_commissions: number;
  commission_rate: number;
  level: 'normal' | 'vip';
  pending_withdrawal: number;
  referral_link: string;
  performance: {
    conversion_rate: number;
    average_referral_value: number;
    best_month_commission: number;
    ranking_position: number;
  };
  recent_referrals: Array<{
    id: string;
    name: string;
    email: string;
    join_date: string;
    status: 'active' | 'inactive';
    commission_generated: number;
    plan_type: string;
  }>;
  commission_history: Array<{
    id: string;
    date: string;
    amount: number;
    referral_name: string;
    type: 'referral' | 'plan_upgrade' | 'trading_bonus';
    status: 'paid' | 'pending';
  }>;
}

export default function AffiliateDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardData | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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
        await fetchDashboardData();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/auth/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/affiliate/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/login';
  };

  const copyReferralLink = () => {
    if (dashboardData?.referral_link) {
      navigator.clipboard.writeText(dashboardData.referral_link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Dashboard Afiliado...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Afiliado | CoinBitClub</title>
        <meta name="description" content="Dashboard do Afiliado - CoinBitClub" />
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/affiliate/referrals" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
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
                <h2 className="text-2xl font-bold text-yellow-400">Dashboard Afiliado</h2>
                {dashboardData?.level === 'vip' && (
                  <span className="flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-pink-400 text-black text-sm font-bold rounded-full">
                    <FiStar className="w-4 h-4 mr-1" />
                    VIP
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={fetchDashboardData}
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
            {/* Timeline do Robô */}
            <div className="mb-8">
              <RobotOperationTimeline 
                isActive={true} 
                speed="normal"
                compact={false}
              />
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-400/20 rounded-xl">
                    <FiUsers className="w-8 h-8 text-green-400" />
                  </div>
                  <span className="text-green-400 text-2xl font-bold">
                    {dashboardData?.referrals_count || 0}
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold text-lg mb-2">Total de Indicações</h3>
                <p className="text-blue-400 text-sm">
                  {dashboardData?.active_referrals || 0} ativos
                </p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-400/20 rounded-xl">
                    <FiDollarSign className="w-8 h-8 text-yellow-400" />
                  </div>
                  <span className="text-yellow-400 text-2xl font-bold">
                    R$ {dashboardData?.total_commissions?.toLocaleString('pt-BR') || '0,00'}
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold text-lg mb-2">Comissões Totais</h3>
                <p className="text-blue-400 text-sm">
                  Este mês: R$ {dashboardData?.monthly_commissions?.toLocaleString('pt-BR') || '0,00'}
                </p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-400/20 rounded-xl">
                    <FiPercent className="w-8 h-8 text-blue-400" />
                  </div>
                  <span className="text-blue-400 text-2xl font-bold">
                    {dashboardData?.commission_rate || 0}%
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold text-lg mb-2">Taxa de Comissão</h3>
                <p className="text-blue-400 text-sm">
                  Conversão: {dashboardData?.performance?.conversion_rate || 0}%
                </p>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-400/20 rounded-xl">
                    <FiAward className="w-8 h-8 text-pink-400" />
                  </div>
                  <span className="text-pink-400 text-2xl font-bold">
                    #{dashboardData?.performance?.ranking_position || 'N/A'}
                  </span>
                </div>
                <h3 className="text-yellow-400 font-bold text-lg mb-2">Ranking</h3>
                <p className="text-blue-400 text-sm">
                  Entre os afiliados
                </p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] mb-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                <FiShare2 className="w-6 h-6 mr-3" />
                Seu Link de Indicação
              </h3>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={dashboardData?.referral_link || 'https://coinbitclub.com/ref/SEU_CODIGO'}
                  readOnly
                  className="flex-1 px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white"
                />
                <button
                  onClick={copyReferralLink}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-pink-500 transition-all duration-300"
                >
                  {linkCopied ? (
                    <>
                      <FiCheck className="w-5 h-5 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-5 h-5 mr-2" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Performance Metrics */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiBarChart className="w-6 h-6 mr-3" />
                  Performance
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/30">
                    <div>
                      <p className="text-yellow-400 font-bold">Taxa de Conversão</p>
                      <p className="text-blue-400 text-sm">Visitantes que se cadastram</p>
                    </div>
                    <span className="text-green-400 text-xl font-bold">
                      {dashboardData?.performance?.conversion_rate || 0}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/30">
                    <div>
                      <p className="text-yellow-400 font-bold">Valor Médio por Indicação</p>
                      <p className="text-blue-400 text-sm">Receita média gerada</p>
                    </div>
                    <span className="text-green-400 text-xl font-bold">
                      R$ {dashboardData?.performance?.average_referral_value?.toLocaleString('pt-BR') || '0,00'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/30">
                    <div>
                      <p className="text-yellow-400 font-bold">Melhor Mês</p>
                      <p className="text-blue-400 text-sm">Maior comissão mensal</p>
                    </div>
                    <span className="text-green-400 text-xl font-bold">
                      R$ {dashboardData?.performance?.best_month_commission?.toLocaleString('pt-BR') || '0,00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Referrals */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiUserPlus className="w-6 h-6 mr-3" />
                  Indicações Recentes
                </h3>
                
                <div className="space-y-4">
                  {dashboardData?.recent_referrals?.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/30">
                      <div>
                        <p className="text-yellow-400 font-bold">{referral.name}</p>
                        <p className="text-blue-400 text-sm">{referral.plan_type}</p>
                        <p className="text-green-400 text-xs">
                          {new Date(referral.join_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          referral.status === 'active' 
                            ? 'bg-green-400/20 text-green-400' 
                            : 'bg-red-400/20 text-red-400'
                        }`}>
                          {referral.status === 'active' ? 'ATIVO' : 'INATIVO'}
                        </span>
                        <p className="text-green-400 font-bold mt-1">
                          R$ {referral.commission_generated.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <FiUsers className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-400">Nenhuma indicação ainda</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Commission History */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
              <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                <FiActivity className="w-6 h-6 mr-3" />
                Histórico de Comissões
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Indicado</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-right text-yellow-400 font-bold uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {dashboardData?.commission_history?.slice(0, 10).map((commission) => (
                      <tr key={commission.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4 text-white">
                          {new Date(commission.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-yellow-400 font-bold">{commission.referral_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-blue-400 text-sm">
                            {commission.type === 'referral' && 'Indicação'}
                            {commission.type === 'plan_upgrade' && 'Upgrade de Plano'}
                            {commission.type === 'trading_bonus' && 'Bônus Trading'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-green-400 font-bold text-lg">
                            R$ {commission.amount.toLocaleString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            commission.status === 'paid'
                              ? 'bg-green-400/20 text-green-400 border border-green-400/50'
                              : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                          }`}>
                            {commission.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                          </span>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <FiDollarSign className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-400">Nenhuma comissão registrada</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Dashboard Afiliado - CoinBitClub ⚡</p>
              <p className="text-blue-300">Maximize seus ganhos indicando novos usuários</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
