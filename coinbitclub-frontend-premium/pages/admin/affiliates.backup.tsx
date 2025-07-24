import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  BanknotesIcon,
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  CurrencyDollarIcon,
  LinkIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';
import { affiliateService } from '../../src/services/api';
import { FormValidator, affiliateValidator } from '../../src/utils/validation';
import { useNotifications } from '../../src/contexts/NotificationContext.simple';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  plan: 'BASIC' | 'PREMIUM' | 'VIP';
  created_at: string;
  last_login: string;
  total_invested: number;
  total_profit: number;
  referrals_count: number;
  total_commissions: number;
  commission_rate: number;
  pending_commissions: number;
  paid_commissions: number;
  referral_link: string;
  phone?: string;
  country?: string;
  isVip?: boolean; // Campo para definir se é afiliado VIP (5% do lucro)
  vipCommissionRate?: number; // Taxa especial para VIPs
}

interface Referral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  referred_name: string;
  referred_email: string;
  status: 'active' | 'inactive' | 'pending';
  joined_date: string;
  total_invested: number;
  commission_generated: number;
  last_activity: string;
}

interface Commission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  amount: number;
  type: 'referral' | 'performance' | 'bonus';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  description: string;
  created_at: string;
  paid_at?: string;
  payment_method?: string;
}

const AffiliatesAdmin: NextPage = () => {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'commissions'>('overview');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  
  // Estados para o modal de novo afiliado
  const [newAffiliateForm, setNewAffiliateForm] = useState({
    name: '',
    email: '',
    phone: '',
    isVip: false,
    commission_rate: 10,
    vipCommissionRate: 5,
    country: '',
    userId: '' // Para atrelar manualmente a um usuário existente
  });

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  // Função para buscar dados
  const fetchData = async () => {
    try {
      setLoading(true);
      const [affiliatesData, referralsData, commissionsData] = await Promise.all([
        affiliateService.getAffiliates(),
        affiliateService.getReferrals(),
        affiliateService.getCommissions()
      ]);
      
      setAffiliates(affiliatesData);
      setReferrals(referralsData);
      setCommissions(commissionsData);
      
      addNotification('Dados carregados com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      addNotification({
        type: 'warning',
        title: 'Dados Locais',
        message: 'Erro ao carregar dados. Usando dados locais.'
      });
      
      // Fallback para dados mockados
      const mockAffiliates: Affiliate[] = [
        {
          id: '1',
          name: 'Pedro Afiliado',
          email: 'pedro@afiliado.com',
          status: 'active',
          plan: 'PREMIUM',
          created_at: '2024-01-10T10:30:00Z',
          last_login: '2024-01-20T09:15:00Z',
          total_invested: 3000,
          total_profit: 450,
          referrals_count: 8,
          total_commissions: 1200,
          commission_rate: 15,
          pending_commissions: 350,
          paid_commissions: 850,
          referral_link: 'https://coinbitclub.com/ref/pedro123',
          phone: '+5511999888777',
          country: 'Brasil'
        }
      ];

      const mockReferrals: Referral[] = [
        {
          id: '1',
          affiliate_id: '1',
          referred_user_id: 'u1',
          referred_name: 'Cliente 1',
          referred_email: 'cliente1@email.com',
          status: 'active',
          joined_date: '2024-01-15T10:00:00Z',
          total_invested: 2000,
          commission_generated: 300,
          last_activity: '2024-01-20T14:30:00Z'
        }
      ];

      const mockCommissions: Commission[] = [
        {
          id: '1',
          affiliate_id: '1',
          referral_id: '1',
          amount: 300,
          type: 'referral',
          status: 'paid',
          description: 'Comissão por indicação - Cliente 1',
          created_at: '2024-01-15T10:00:00Z',
          paid_at: '2024-01-16T14:30:00Z',
          payment_method: 'PIX'
        }
      ];
      
      setAffiliates(mockAffiliates);
      setReferrals(mockReferrals);
      setCommissions(mockCommissions);
    } finally {
      setLoading(false);
    }
  };

  // Função para validar formulário
  const validateForm = (data: any) => {
    const errors = affiliateValidator.validate(data);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Função para obter erro específico de um campo
  const getFieldError = (fieldName: string, errors: any[]) => {
    const error = errors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  // Função para salvar afiliado
  const handleSubmitAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(newAffiliateForm)) {
      addNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAffiliate) {
        await affiliateService.updateAffiliate(editingAffiliate.id, newAffiliateForm);
        addNotification({
          type: 'success',
          title: 'Afiliado Atualizado',
          message: 'Afiliado atualizado com sucesso!'
        });
      } else {
        await affiliateService.createAffiliate(newAffiliateForm);
        addNotification({
          type: 'success',
          title: 'Afiliado Criado',
          message: 'Afiliado criado com sucesso!'
        });
      }
      
      await fetchData();
      setShowAffiliateModal(false);
      setEditingAffiliate(null);
      setNewAffiliateForm({
        name: '',
        email: '',
        phone: '',
        isVip: false,
        commission_rate: 10,
        vipCommissionRate: 5,
        country: '',
        userId: ''
      });
    } catch (error) {
      console.error('Erro ao salvar afiliado:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Erro ao salvar afiliado'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Função para deletar afiliado
  const handleDeleteAffiliate = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este afiliado?')) return;
    
    try {
      await affiliateService.deleteAffiliate(id);
      addNotification('Afiliado removido com sucesso!', 'success');
      await fetchData();
    } catch (error) {
      console.error('Erro ao deletar afiliado:', error);
      addNotification('Erro ao remover afiliado', 'error');
    }
  };

  // Função para pagar comissões
  const handlePayCommissions = async (affiliateId: string, amount: number) => {
    try {
      await affiliateService.payCommissions(affiliateId, { amount });
      addNotification('Comissões pagas com sucesso!', 'success');
      await fetchData();
    } catch (error) {
      console.error('Erro ao pagar comissões:', error);
      addNotification('Erro ao pagar comissões', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mock data para fallback
  const mockAffiliates: Affiliate[] = [
    {
      id: '1',
      name: 'Pedro Afiliado',
      email: 'pedro@afiliado.com',
      status: 'active',
      plan: 'PREMIUM',
      created_at: '2024-01-10T10:30:00Z',
      last_login: '2024-01-20T09:15:00Z',
      total_invested: 3000,
      total_profit: 450,
      referrals_count: 8,
      total_commissions: 1200,
      commission_rate: 15,
      pending_commissions: 350,
      paid_commissions: 850,
      referral_link: 'https://coinbitclub.com/ref/pedro123',
      phone: '+5511999888777',
      country: 'Brasil'
    },
    {
      id: '2',
      name: 'Ana Marketing',
      email: 'ana@marketing.com',
      status: 'active',
      plan: 'VIP',
      created_at: '2024-01-05T14:20:00Z',
      last_login: '2024-01-20T11:30:00Z',
      total_invested: 8000,
      total_profit: 1800,
      referrals_count: 15,
      total_commissions: 2500,
      commission_rate: 20,
      pending_commissions: 600,
      paid_commissions: 1900,
      referral_link: 'https://coinbitclub.com/ref/ana456',
      phone: '+5511888777666',
      country: 'Brasil'
    }
  ];

  const mockReferrals: Referral[] = [
        {
          id: '1',
          affiliate_id: '1',
          referred_user_id: 'u1',
          referred_name: 'Cliente 1',
          referred_email: 'cliente1@email.com',
          status: 'active',
          joined_date: '2024-01-15T10:00:00Z',
          total_invested: 2000,
          commission_generated: 300,
          last_activity: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          affiliate_id: '1',
          referred_user_id: 'u2',
          referred_name: 'Cliente 2',
          referred_email: 'cliente2@email.com',
          status: 'active',
          joined_date: '2024-01-18T16:00:00Z',
          total_invested: 1500,
          commission_generated: 225,
          last_activity: '2024-01-19T09:15:00Z'
        }
      ];

      const mockCommissions: Commission[] = [
        {
          id: '1',
          affiliate_id: '1',
          referral_id: '1',
          amount: 300,
          type: 'referral',
          status: 'paid',
          description: 'Comissão por indicação - Cliente 1',
          created_at: '2024-01-15T10:00:00Z',
          paid_at: '2024-01-16T14:30:00Z',
          payment_method: 'PIX'
        },
        {
          id: '2',
          affiliate_id: '1',
          referral_id: '2',
          amount: 225,
          type: 'referral',
          status: 'pending',
          description: 'Comissão por indicação - Cliente 2',
          created_at: '2024-01-18T16:00:00Z'
        }
      ];
      
      setAffiliates(mockAffiliates);
      setReferrals(mockReferrals);
      setCommissions(mockCommissions);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      addNotification({
        type: 'warning',
        title: 'Dados Locais',
        message: 'Erro ao carregar dados. Usando dados locais.'
      });
      
      // Fallback data já está sendo usado acima
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'suspended':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'inactive':
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'active': return `${baseClasses} bg-green-900/50 text-green-300 border border-green-700`;
      case 'pending': return `${baseClasses} bg-yellow-900/50 text-yellow-300 border border-yellow-700`;
      case 'suspended': return `${baseClasses} bg-red-900/50 text-red-300 border border-red-700`;
      case 'inactive': return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
      case 'paid': return `${baseClasses} bg-green-900/50 text-green-300 border border-green-700`;
      case 'approved': return `${baseClasses} bg-blue-900/50 text-blue-300 border border-blue-700`;
      case 'cancelled': return `${baseClasses} bg-red-900/50 text-red-300 border border-red-700`;
      default: return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
    }
  };

  const getPlanBadge = (plan: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (plan) {
      case 'VIP': return `${baseClasses} bg-purple-900/50 text-purple-300 border border-purple-700`;
      case 'PREMIUM': return `${baseClasses} bg-blue-900/50 text-blue-300 border border-blue-700`;
      case 'BASIC': return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
      default: return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
    }
  };

  const copyReferralLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copiado para a área de transferência!');
  };

  const payCommission = (commissionId: string) => {
    setCommissions(prev => prev.map(c =>
      c.id === commissionId
        ? { ...c, status: 'paid', paid_at: new Date().toISOString(), payment_method: 'PIX' }
        : c
    ));
  };

  const createAffiliate = async () => {
    try {
      const newAffiliate: Affiliate = {
        id: Date.now().toString(),
        name: newAffiliateForm.name,
        email: newAffiliateForm.email,
        phone: newAffiliateForm.phone,
        country: newAffiliateForm.country,
        status: 'pending',
        plan: 'BASIC',
        created_at: new Date().toISOString(),
        last_login: '',
        total_invested: 0,
        total_profit: 0,
        referrals_count: 0,
        total_commissions: 0,
        commission_rate: newAffiliateForm.isVip ? 0 : newAffiliateForm.commission_rate,
        isVip: newAffiliateForm.isVip,
        vipCommissionRate: newAffiliateForm.isVip ? newAffiliateForm.vipCommissionRate : undefined,
        pending_commissions: 0,
        paid_commissions: 0,
        referral_link: `https://coinbitclub.com/ref/${newAffiliateForm.name.toLowerCase().replace(/\s+/g, '')}`
      };

      setAffiliates(prev => [...prev, newAffiliate]);
      setShowAffiliateModal(false);
      
      // Reset form
      setNewAffiliateForm({
        name: '',
        email: '',
        phone: '',
        isVip: false,
        commission_rate: 10,
        vipCommissionRate: 5,
        country: '',
        userId: ''
      });

      alert('Afiliado criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
      alert('Erro ao criar afiliado. Tente novamente.');
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    if (statusFilter !== 'all' && affiliate.status !== statusFilter) return false;
    if (planFilter !== 'all' && affiliate.plan !== planFilter) return false;
    if (searchTerm && !affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !affiliate.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredReferrals = referrals.filter(referral =>
    selectedAffiliate ? referral.affiliate_id === selectedAffiliate.id : true
  );

  const filteredCommissions = commissions.filter(commission =>
    selectedAffiliate ? commission.affiliate_id === selectedAffiliate.id : true
  );

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
  const totalCommissionsPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando afiliados...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Afiliados - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Afiliados">
        <div className="min-h-screen" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Gestão de Afiliados
                </h1>
                <p className="text-gray-400">Controle de parceiros e comissões da plataforma</p>
              </div>
              
              <button
                onClick={() => setShowAffiliateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Novo Afiliado
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-green-400">Afiliados Ativos</h3>
              <p className="text-2xl font-bold text-white">{activeAffiliates}</p>
              <p className="text-sm text-gray-400">De {totalAffiliates} total</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Total de Referidos</h3>
              <p className="text-2xl font-bold text-white">{affiliates.reduce((sum, a) => sum + a.referrals_count, 0)}</p>
              <p className="text-sm text-gray-400">Usuários indicados</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Comissões Pagas</h3>
              <p className="text-2xl font-bold text-white">R$ {totalCommissionsPaid.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-gray-400">Total já pago</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">Pendentes</h3>
              <p className="text-2xl font-bold text-white">R$ {pendingCommissions.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-gray-400">A pagar</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={cardStyle} className="mb-6">
            <div className="flex space-x-1 p-1 bg-gray-800 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 inline mr-2" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'referrals'
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <UsersIcon className="w-5 h-5 inline mr-2" />
                Gestão de Indicados
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'commissions'
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <CurrencyDollarIcon className="w-5 h-5 inline mr-2" />
                Comissões
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div>
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nome ou e-mail..."
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativo</option>
                      <option value="pending">Pendente</option>
                      <option value="suspended">Suspenso</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Plano</label>
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="all">Todos</option>
                      <option value="BASIC">Básico</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={fetchData}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>

                {/* Tabela de Afiliados */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300">Afiliado</th>
                        <th className="text-left p-3 text-gray-300">Status</th>
                        <th className="text-left p-3 text-gray-300">Plano</th>
                        <th className="text-left p-3 text-gray-300">Referidos</th>
                        <th className="text-left p-3 text-gray-300">Taxa (%)</th>
                        <th className="text-left p-3 text-gray-300">Comissões</th>
                        <th className="text-left p-3 text-gray-300">Link</th>
                        <th className="text-left p-3 text-gray-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAffiliates.map((affiliate) => (
                        <tr key={affiliate.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3">
                            <div>
                              <p className="text-white font-semibold">{affiliate.name}</p>
                              <p className="text-xs text-gray-400">{affiliate.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(affiliate.status)}
                              <span className={getStatusBadge(affiliate.status)}>
                                {affiliate.status.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={getPlanBadge(affiliate.plan)}>
                              {affiliate.plan}
                            </span>
                          </td>
                          <td className="p-3 text-gray-300">{affiliate.referrals_count}</td>
                          <td className="p-3 text-green-400">{affiliate.commission_rate}%</td>
                          <td className="p-3">
                            <div>
                              <p className="text-green-400">R$ {affiliate.total_commissions.toLocaleString('pt-BR')}</p>
                              <p className="text-xs text-yellow-400">Pendente: R$ {affiliate.pending_commissions.toLocaleString('pt-BR')}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => copyReferralLink(affiliate.referral_link)}
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                            >
                              <LinkIcon className="w-4 h-4" />
                              Copiar
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedAffiliate(affiliate)}
                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                                title="Ver detalhes"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setActiveTab('referrals');
                                }}
                                className="p-1 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                                title="Ver referidos"
                              >
                                <UsersIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setActiveTab('commissions');
                                }}
                                className="p-1 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
                                title="Ver comissões"
                              >
                                <CurrencyDollarIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Gestão de Indicados
                    {selectedAffiliate && ` - ${selectedAffiliate.name}`}
                  </h3>
                  {selectedAffiliate && (
                    <button
                      onClick={() => setSelectedAffiliate(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Ver Todos
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300">Usuário Indicado</th>
                        <th className="text-left p-3 text-gray-300">Status</th>
                        <th className="text-left p-3 text-gray-300">Data de Entrada</th>
                        <th className="text-left p-3 text-gray-300">Investido</th>
                        <th className="text-left p-3 text-gray-300">Comissão Gerada</th>
                        <th className="text-left p-3 text-gray-300">Última Atividade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.map((referral) => (
                        <tr key={referral.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3">
                            <div>
                              <p className="text-white font-semibold">{referral.referred_name}</p>
                              <p className="text-xs text-gray-400">{referral.referred_email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(referral.status)}
                              <span className={getStatusBadge(referral.status)}>
                                {referral.status.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-300">
                            {new Date(referral.joined_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-3 text-gray-300">
                            R$ {referral.total_invested.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3 text-green-400">
                            R$ {referral.commission_generated.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3 text-gray-400 text-xs">
                            {new Date(referral.last_activity).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredReferrals.length === 0 && (
                  <div className="text-center py-8">
                    <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum referido encontrado</h3>
                    <p className="text-gray-500">
                      {selectedAffiliate ? 'Este afiliado ainda não possui referidos.' : 'Não há referidos cadastrados.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'commissions' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Comissões
                    {selectedAffiliate && ` - ${selectedAffiliate.name}`}
                  </h3>
                  <div className="flex gap-2">
                    {selectedAffiliate && (
                      <button
                        onClick={() => setSelectedAffiliate(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Ver Todas
                      </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors">
                      <DocumentArrowDownIcon className="w-5 h-5" />
                      Exportar
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300">Descrição</th>
                        <th className="text-left p-3 text-gray-300">Tipo</th>
                        <th className="text-left p-3 text-gray-300">Valor</th>
                        <th className="text-left p-3 text-gray-300">Status</th>
                        <th className="text-left p-3 text-gray-300">Data</th>
                        <th className="text-left p-3 text-gray-300">Pagamento</th>
                        <th className="text-left p-3 text-gray-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommissions.map((commission) => (
                        <tr key={commission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3">
                            <p className="text-white">{commission.description}</p>
                          </td>
                          <td className="p-3">
                            <span className="capitalize text-gray-300">{commission.type}</span>
                          </td>
                          <td className="p-3 text-green-400 font-semibold">
                            R$ {commission.amount.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <span className={getStatusBadge(commission.status)}>
                              {commission.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-gray-300">
                            {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-3 text-gray-300">
                            {commission.paid_at ? (
                              <div>
                                <p className="text-xs">{new Date(commission.paid_at).toLocaleDateString('pt-BR')}</p>
                                <p className="text-xs text-gray-400">{commission.payment_method}</p>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {commission.status === 'pending' && (
                              <button
                                onClick={() => payCommission(commission.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500 transition-colors"
                              >
                                Pagar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredCommissions.length === 0 && (
                  <div className="text-center py-8">
                    <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhuma comissão encontrada</h3>
                    <p className="text-gray-500">
                      {selectedAffiliate ? 'Este afiliado ainda não possui comissões.' : 'Não há comissões registradas.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Novo Afiliado */}
        {showAffiliateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-2 text-yellow-400" />
                  Novo Afiliado
                </h3>
                <button
                  onClick={() => setShowAffiliateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={newAffiliateForm.name}
                      onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="Nome do afiliado"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newAffiliateForm.email}
                      onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newAffiliateForm.phone}
                      onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="+55 (11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={newAffiliateForm.country}
                      onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="Brasil"
                    />
                  </div>
                </div>

                {/* Tipo de Afiliado */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isVip"
                      checked={newAffiliateForm.isVip}
                      onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, isVip: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                    />
                    <label htmlFor="isVip" className="text-white font-medium">
                      Afiliado VIP (5% do lucro)
                    </label>
                  </div>
                  
                  {newAffiliateForm.isVip ? (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-400 rounded-lg">
                      <h4 className="text-yellow-300 font-medium mb-2">Configuração VIP</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Taxa de Comissão VIP (% do lucro)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={newAffiliateForm.vipCommissionRate}
                          onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, vipCommissionRate: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Afiliados VIP ganham uma porcentagem do lucro líquido dos indicados
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-900/20 border border-blue-400 rounded-lg">
                      <h4 className="text-blue-300 font-medium mb-2">Configuração Regular</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Taxa de Comissão Regular (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          value={newAffiliateForm.commission_rate}
                          onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Afiliados regulares ganham uma porcentagem dos depósitos dos indicados
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Atrelar Usuario (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ID do Usuário (para atrelar manualmente)
                  </label>
                  <input
                    type="text"
                    value={newAffiliateForm.userId}
                    onChange={(e) => setNewAffiliateForm(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    placeholder="ID do usuário existente (opcional)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Se informado, o afiliado será atrelado automaticamente a este usuário
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowAffiliateModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAffiliate}
                  disabled={!newAffiliateForm.name || !newAffiliateForm.email}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Criar Afiliado
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default AffiliatesAdmin;
