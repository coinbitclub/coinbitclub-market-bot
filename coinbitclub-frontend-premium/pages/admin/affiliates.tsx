import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';
import { useNotifications } from '../../src/contexts/NotificationContext.simple';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  account_type: 'testnet' | 'live';
  affiliate_code: string;
  total_referrals: number;
  total_commissions: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  created_at: string;
  last_login?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AffiliatesAdmin: NextPage = () => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'create'>('overview');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'BR',
    accountType: 'testnet'
  });

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  useEffect(() => {
    checkAuth();
    fetchAffiliates();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
  };

  const fetchAffiliates = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:9997/api/admin/affiliates?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }

      if (response.status === 403) {
        addNotification({
          type: 'error',
          title: 'Acesso negado',
          message: 'Privilégios de administrador requeridos'
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAffiliates(data.affiliates || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Erro ao carregar afiliados'
        });
        
        // Fallback com dados mock
        setAffiliates([
          {
            id: '1',
            name: 'Pedro Silva',
            email: 'pedro@exemplo.com',
            phone: '+5511999888777',
            country: 'BR',
            account_type: 'testnet',
            affiliate_code: 'AFF001',
            total_referrals: 5,
            total_commissions: 250.50,
            status: 'active',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            name: 'Ana Costa',
            email: 'ana@exemplo.com',
            phone: '+5511888777666',
            country: 'BR',
            account_type: 'live',
            affiliate_code: 'AFF002',
            total_referrals: 12,
            total_commissions: 1250.75,
            status: 'active',
            created_at: '2024-01-10T14:20:00Z'
          }
        ]);
        setPagination({ page: 1, limit: 20, total: 2, pages: 1 });
      }
    } catch (error) {
      console.error('Erro ao carregar afiliados:', error);
      addNotification({
        type: 'error',
        title: 'Erro de conexão',
        message: 'Não foi possível conectar ao servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9997/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        addNotification({
          type: 'success',
          title: 'Afiliado criado',
          message: `Código: ${data.affiliate.affiliateCode} | Senha: ${data.affiliate.tempPassword}`
        });
        setShowCreateForm(false);
        setFormData({ name: '', email: '', phone: '', country: 'BR', accountType: 'testnet' });
        fetchAffiliates();
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: data.error || 'Erro ao criar afiliado'
        });
      }
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro de conexão'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (affiliateId: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:9997/api/admin/affiliates/${affiliateId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (data.success) {
        addNotification({
          type: 'success',
          title: 'Status alterado',
          message: `Afiliado ${action === 'activate' ? 'ativado' : 'desativado'} com sucesso`
        });
        fetchAffiliates();
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: data.error || 'Erro ao alterar status'
        });
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro de conexão'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
      
      addNotification({
        type: 'success',
        title: 'Dados Carregados',
        message: 'Afiliados carregados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar dados dos afiliados'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    if (statusFilter !== 'all' && affiliate.status !== statusFilter) return false;
    if (searchTerm && !affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !affiliate.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs';
      case 'pending':
        return 'px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs';
      case 'suspended':
        return 'px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs';
      default:
        return 'px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs';
    }
  };

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
    <AdminLayout>
      <Head>
        <title>Sistema de Afiliados - CoinBit Club</title>
      </Head>

      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserGroupIcon className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Sistema de Afiliados</h1>
                  <p className="text-gray-400">Gestão completa do programa de afiliados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <UsersIcon className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total Afiliados</p>
                  <p className="text-2xl font-bold text-blue-400">{affiliates.length}</p>
                  <p className="text-sm text-gray-400">ativos</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Comissões Pagas</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {affiliates.reduce((sum, a) => sum + a.paid_commissions, 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-400">este mês</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <ClockIcon className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    R$ {affiliates.reduce((sum, a) => sum + a.pending_commissions, 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-400">a pagar</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Indicações</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {affiliates.reduce((sum, a) => sum + a.referrals_count, 0)}
                  </p>
                  <p className="text-sm text-gray-400">total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Filtros de Afiliados</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome ou email..."
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
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={fetchData}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors font-medium"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Afiliados */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Afiliados ({filteredAffiliates.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Nome</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Plano</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Indicações</th>
                    <th className="text-left p-3 text-gray-300">Comissões</th>
                    <th className="text-left p-3 text-gray-300">Pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        <div>
                          <p className="text-white font-semibold">{affiliate.name}</p>
                          <p className="text-xs text-gray-400">{affiliate.phone}</p>
                        </div>
                      </td>
                      <td className="p-3 text-gray-300">{affiliate.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          affiliate.plan === 'VIP' ? 'bg-purple-900/50 text-purple-300' :
                          affiliate.plan === 'PREMIUM' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {affiliate.plan}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadge(affiliate.status)}>
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="p-3 text-purple-400 font-semibold">
                        {affiliate.referrals_count}
                      </td>
                      <td className="p-3 text-green-400 font-semibold">
                        R$ {affiliate.paid_commissions.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-yellow-400 font-semibold">
                        R$ {affiliate.pending_commissions.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAffiliates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Não há afiliados para os filtros selecionados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AffiliatesAdmin;
