import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiUsers, FiDollarSign, FiTrendingUp, FiEye, FiEdit, FiSearch,
  FiDownload, FiRefreshCw, FiUserPlus, FiPercent, FiCalendar, FiCheck, FiX 
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';

interface Affiliate {
  id: string;
  user_id: string;
  name: string;
  email: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  last_payment_date?: string;
  status: 'active' | 'suspended' | 'pending_approval';
  created_at: string;
  tier_level: number;
  performance_score: number;
}

interface AffiliateStatistics {
  total_affiliates: number;
  active_affiliates: number;
  total_referrals: number;
  total_commissions_paid: number;
  pending_commissions: number;
  avg_commission_rate: number;
  top_performers: Affiliate[];
}

interface CommissionPayment {
  id: string;
  affiliate_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  paid_at?: string;
}

export default function AffiliatesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Partial<Affiliate>>({});

  const { data: affiliates, error, mutate } = useSWR('/api/admin/affiliates', {
    refreshInterval: 60000 // Refresh every minute
  });

  const { data: statistics } = useSWR('/api/admin/affiliates/stats');
  const { data: pendingPayments } = useSWR('/api/admin/affiliates/pending-payments');

  const filteredAffiliates = (affiliates || []).filter((affiliate: Affiliate) => {
    const matchesSearch = searchTerm === '' || 
      affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'suspended': return 'Suspenso';
      case 'pending_approval': return 'Pendente';
      default: return status;
    }
  };

  const getTierBadge = (tier: number) => {
    const colors = ['bg-gray-100 text-gray-800', 'bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-gold-100 text-gold-800'];
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[tier - 1] || colors[0]}`}>
        Tier {tier}
      </span>
    );
  };

  const handleEditAffiliate = async () => {
    try {
      const response = await fetch(`/api/admin/affiliates/${editingAffiliate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAffiliate)
      });

      if (response.ok) {
        mutate();
        setIsEditModalOpen(false);
        setEditingAffiliate({});
      }
    } catch (error) {
      console.error('Error updating affiliate:', error);
    }
  };

  const handleProcessPayments = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/process-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        mutate();
        setIsPaymentModalOpen(false);
      }
    } catch (error) {
      console.error('Error processing payments:', error);
    }
  };

  const handleApproveAffiliate = async (affiliateId: string) => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateId}/approve`, {
        method: 'PATCH'
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error approving affiliate:', error);
    }
  };

  const handleSuspendAffiliate = async (affiliateId: string) => {
    if (confirm('Tem certeza que deseja suspender este afiliado?')) {
      try {
        const response = await fetch(`/api/admin/affiliates/${affiliateId}/suspend`, {
          method: 'PATCH'
        });

        if (response.ok) {
          mutate();
        }
      } catch (error) {
        console.error('Error suspending affiliate:', error);
      }
    }
  };

  const handleExportAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusFilter, search: searchTerm })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `affiliates-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting affiliates:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Gestão de Afiliados - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestão de Afiliados</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Controle completo do programa de afiliados
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
                  >
                    <FiDollarSign className="mr-2 h-4 w-4" />
                    Processar Pagamentos
                  </button>
                  
                  <button
                    onClick={handleExportAffiliates}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Exportar
                  </button>
                  
                  <button
                    onClick={() => mutate()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiUsers className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total de Afiliados</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.total_affiliates}</dd>
                          <dd className="text-sm text-gray-600">{statistics.active_affiliates} ativos</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiUserPlus className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Indicações</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.total_referrals}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiDollarSign className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Comissões Pagas</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {formatCurrency(statistics.total_commissions_paid)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiPercent className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Pendente</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {formatCurrency(statistics.pending_commissions)}
                          </dd>
                          <dd className="text-sm text-gray-600">Média: {statistics.avg_commission_rate}%</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Performers */}
            {statistics && statistics.top_performers && statistics.top_performers.length > 0 && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Top Performers do Mês
                  </h3>
                  <div className="space-y-3">
                    {statistics.top_performers.slice(0, 5).map((affiliate, index) => (
                      <div key={affiliate.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                            <div className="text-sm text-gray-500">{affiliate.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{affiliate.total_referrals} indicações</div>
                          <div className="text-sm text-gray-500">{formatCurrency(affiliate.total_earnings)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nome, email ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="active">Ativos</option>
                      <option value="suspended">Suspensos</option>
                      <option value="pending_approval">Pendentes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliates Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Afiliado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier/Taxa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indicações
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ganhos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAffiliates.map((affiliate: Affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <FiUsers className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                              <div className="text-sm text-gray-500">{affiliate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {affiliate.affiliate_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getTierBadge(affiliate.tier_level)}
                            <div className="text-sm text-gray-500">{affiliate.commission_rate}%</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{affiliate.total_referrals} total</div>
                          <div className="text-sm text-gray-500">{affiliate.active_referrals} ativos</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(affiliate.total_earnings)}</div>
                          <div className="text-sm text-gray-500">
                            Pendente: {formatCurrency(affiliate.pending_earnings)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(affiliate.status)}`}>
                            {getStatusText(affiliate.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedAffiliate(affiliate)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAffiliate(affiliate);
                                setIsEditModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                            {affiliate.status === 'pending_approval' && (
                              <button
                                onClick={() => handleApproveAffiliate(affiliate.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <FiCheck className="h-4 w-4" />
                              </button>
                            )}
                            {affiliate.status === 'active' && (
                              <button
                                onClick={() => handleSuspendAffiliate(affiliate.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Details Modal */}
      <Modal
        isOpen={selectedAffiliate !== null}
        onClose={() => setSelectedAffiliate(null)}
        title="Detalhes do Afiliado"
      >
        {selectedAffiliate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-sm text-gray-900">{selectedAffiliate.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{selectedAffiliate.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Código de Afiliado</label>
                <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {selectedAffiliate.affiliate_code}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Taxa de Comissão</label>
                <p className="text-sm text-gray-900">{selectedAffiliate.commission_rate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total de Indicações</label>
                <p className="text-sm text-gray-900">{selectedAffiliate.total_referrals}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Indicações Ativas</label>
                <p className="text-sm text-gray-900">{selectedAffiliate.active_referrals}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total de Ganhos</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedAffiliate.total_earnings)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ganhos Pendentes</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedAffiliate.pending_earnings)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tier Level</label>
                {getTierBadge(selectedAffiliate.tier_level)}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Score de Performance</label>
                <p className="text-sm text-gray-900">{selectedAffiliate.performance_score}/100</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
              <p className="text-sm text-gray-900">
                {new Date(selectedAffiliate.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {selectedAffiliate.last_payment_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Último Pagamento</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedAffiliate.last_payment_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Affiliate Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Afiliado"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa de Comissão (%)
            </label>
            <input
              type="number"
              value={editingAffiliate.commission_rate || 0}
              onChange={(e) => setEditingAffiliate({
                ...editingAffiliate,
                commission_rate: parseFloat(e.target.value)
              })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tier Level
            </label>
            <select
              value={editingAffiliate.tier_level || 1}
              onChange={(e) => setEditingAffiliate({
                ...editingAffiliate,
                tier_level: parseInt(e.target.value)
              })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Tier 1</option>
              <option value={2}>Tier 2</option>
              <option value={3}>Tier 3</option>
              <option value={4}>Tier 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={editingAffiliate.status || 'active'}
              onChange={(e) => setEditingAffiliate({
                ...editingAffiliate,
                status: e.target.value as any
              })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="pending_approval">Pendente</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleEditAffiliate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Processar Pagamentos de Comissão"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Processamento de Pagamentos
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Serão processados pagamentos para todos os afiliados com comissões pendentes 
                    superiores ao valor mínimo de saque.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {pendingPayments && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Pagamentos Pendentes: {pendingPayments.length}
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {pendingPayments.map((payment: CommissionPayment) => (
                  <div key={payment.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Afiliado #{payment.affiliate_id}</span>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcessPayments}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Processar Pagamentos
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
