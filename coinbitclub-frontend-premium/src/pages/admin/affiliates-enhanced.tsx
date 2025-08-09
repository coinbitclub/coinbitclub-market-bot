import React from 'react';
import { useState, useEffect } from 'react';
import { 
  FiUsers, FiPlus, FiEdit, FiTrash2, FiSearch, FiDollarSign,
  FiEye, FiKey, FiUserPlus, FiUserMinus, FiRefreshCw, FiDownload,
  FiBriefcase, FiPercent, FiFileText, FiShare2, FiCopy, FiTrendingUp
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  type: 'common' | 'vip';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  referralCode: string;
  referralLink: string;
  commissionRate: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  linkedUsers: number;
  activeUsers: number;
  totalRevenue: number;
  conversionRate: number;
}

interface CommissionEntry {
  id: string;
  date: string;
  userName: string;
  userEmail: string;
  amount: number;
  type: 'trading' | 'subscription' | 'deposit';
  status: 'pending' | 'paid' | 'cancelled';
}

interface AffiliateDetails extends Affiliate {
  commissions: CommissionEntry[];
  linkedUsersList: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    registrationDate: string;
    status: string;
    revenue: number;
  }>;
}

export default function AffiliatesManagement() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateDetails | null>(null);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('view');

  // TODO: Replace with actual backend API call

  useEffect(() => {
    fetchAffiliates();
  }, []);

  useEffect(() => {
    filterAffiliates();
  }, [affiliates, searchTerm, filterType, filterStatus]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      // TODO: Implement real API call to backend
      const affiliates: Affiliate[] = []; // NO MORE MOCK DATA - Backend integration required
      
      setAffiliates(affiliates);
    } catch (error) {
      console.error('Erro ao buscar afiliados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAffiliates = () => {
    let filtered = affiliates;

    if (searchTerm) {
      filtered = filtered.filter(affiliate => 
        affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(affiliate => affiliate.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(affiliate => affiliate.status === filterStatus);
    }

    setFilteredAffiliates(filtered);
  };

  const handleCreateAffiliate = async (affiliateData: any) => {
    try {
      // API call to create affiliate
      const newAffiliate = {
        ...affiliateData,
        id: `aff_${Date.now()}`,
        referralCode: affiliateData.name.replace(/\s+/g, '').toUpperCase() + '2024',
        referralLink: `https://coinbitclub.com/r/${affiliateData.name.replace(/\s+/g, '').toUpperCase()}2024`,
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        linkedUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        conversionRate: 0
      };
      
      setAffiliates([...affiliates, newAffiliate]);
      setShowCreateModal(false);
      alert('Afiliado criado com sucesso!');
    } catch (error) {
      alert('Erro ao criar afiliado');
    }
  };

  const handleResetPassword = async (affiliateId: string) => {
    try {
      // API call to reset password
      alert('Nova senha enviada por email!');
    } catch (error) {
      alert('Erro ao resetar senha');
    }
  };

  const handleDeleteAffiliate = async (affiliateId: string) => {
    if (confirm('Tem certeza que deseja excluir este afiliado? Ele se tornará um usuário comum.')) {
      try {
        // API call to convert affiliate to regular user
        setAffiliates(affiliates.filter(a => a.id !== affiliateId));
        alert('Afiliado convertido para usuário comum!');
      } catch (error) {
        alert('Erro ao excluir afiliado');
      }
    }
  };

  const handleManualCommission = async (affiliateId: string, amount: number, reason: string) => {
    try {
      // API call to add manual commission
      alert(`Comissão de R$ ${amount} lançada com sucesso!`);
      setShowCommissionModal(false);
      fetchAffiliates();
    } catch (error) {
      alert('Erro ao lançar comissão');
    }
  };

  const copyReferralLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copiado para a área de transferência!');
  };

  const generateAffiliateStatement = (affiliateId: string) => {
    // Generate and download affiliate statement
    alert('Relatório sendo gerado...');
  };

  const totalActiveAffiliates = affiliates.filter(a => a.status === 'active').length;
  const totalCommissions = affiliates.reduce((sum, a) => sum + a.totalCommissions, 0);
  const totalUsers = affiliates.reduce((sum, a) => sum + a.linkedUsers, 0);
  const averageConversion = affiliates.length > 0 ? 
    affiliates.reduce((sum, a) => sum + a.conversionRate, 0) / affiliates.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head><title>Gerenciar Afiliados - CoinBitClub Admin</title></Head>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-64">
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Gerenciar Afiliados - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Afiliados</h1>
                    <p className="mt-2 text-sm text-gray-600">
                      Total de {totalActiveAffiliates} afiliados ativos com {totalUsers} usuários vinculados
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {setModalType('create'); setShowCreateModal(true);}}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FiUserPlus className="h-4 w-4 mr-2" />
                      Novo Afiliado
                    </button>
                    <button
                      onClick={fetchAffiliates}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiUsers className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Afiliados Ativos</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalActiveAffiliates}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiDollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Comissões Totais</dt>
                        <dd className="text-lg font-medium text-gray-900">R$ {totalCommissions.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiBriefcase className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Usuários Vinculados</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiTrendingUp className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Conv. Média</dt>
                        <dd className="text-lg font-medium text-gray-900">{averageConversion.toFixed(1)}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Buscar por nome, email ou código..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="all">Todos os Tipos</option>
                      <option value="common">Comum (1.5%)</option>
                      <option value="vip">VIP (5%)</option>
                    </select>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliates Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredAffiliates.map((affiliate) => (
                  <li key={affiliate.id}>
                    <div className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {affiliate.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">{affiliate.name}</p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                affiliate.type === 'vip' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {affiliate.type === 'vip' ? 'VIP (5%)' : 'Comum (1.5%)'}
                              </span>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                affiliate.status === 'active' ? 'bg-green-100 text-green-800' :
                                affiliate.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {affiliate.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{affiliate.email}</p>
                            <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                              <span>Usuários: {affiliate.linkedUsers} ({affiliate.activeUsers} ativos)</span>
                              <span>Comissões: R$ {affiliate.totalCommissions.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              <span>Código: {affiliate.referralCode}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyReferralLink(affiliate.referralLink)}
                            className="text-green-600 hover:text-green-500"
                            title="Copiar Link"
                          >
                            <FiShare2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => generateAffiliateStatement(affiliate.id)}
                            className="text-blue-600 hover:text-blue-500"
                            title="Extrato"
                          >
                            <FiFileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAffiliate({
                                ...affiliate,
                                commissions: [],
                                linkedUsersList: []
                              });
                              setModalType('view');
                              setShowAffiliateModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-500"
                            title="Ver Detalhes"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAffiliate({
                                ...affiliate,
                                commissions: [],
                                linkedUsersList: []
                              });
                              setModalType('edit');
                              setShowAffiliateModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-500"
                            title="Editar"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(affiliate.id)}
                            className="text-yellow-600 hover:text-yellow-500"
                            title="Reset Senha"
                          >
                            <FiKey className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAffiliate(affiliate.id)}
                            className="text-red-600 hover:text-red-500"
                            title="Excluir"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create Affiliate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Criar Novo Afiliado</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleCreateAffiliate({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  cpf: formData.get('cpf'),
                  type: formData.get('type'),
                  status: 'active',
                  registrationDate: new Date().toISOString().split('T')[0],
                  lastLogin: '',
                  commissionRate: 1.5
                });
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="text"
                      name="phone"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                      type="text"
                      name="cpf"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Tipo de Afiliado</label>
                    <select
                      name="type"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="common">Comum (1.5% comissão)</option>
                      <option value="vip">VIP (5% comissão)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Criar Afiliado
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Details Modal */}
      {showAffiliateModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'view' ? 'Detalhes do Afiliado' : 'Editar Afiliado'}
                </h3>
                <button
                  onClick={() => setShowAffiliateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informações Básicas</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input
                          type="text"
                          value={selectedAffiliate.name}
                          disabled={modalType === 'view'}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={selectedAffiliate.email}
                          disabled={modalType === 'view'}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Código de Referência</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={selectedAffiliate.referralCode}
                            disabled
                            className="mt-1 block w-full border-gray-300 rounded-l-md shadow-sm bg-gray-50 sm:text-sm"
 />
                          <button
                            onClick={() => copyReferralLink(selectedAffiliate.referralLink)}
                            className="mt-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                          >
                            <FiCopy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Link de Referência</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={selectedAffiliate.referralLink}
                            disabled
                            className="mt-1 block w-full border-gray-300 rounded-l-md shadow-sm bg-gray-50 sm:text-sm"
 />
                          <button
                            onClick={() => copyReferralLink(selectedAffiliate.referralLink)}
                            className="mt-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                          >
                            <FiCopy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Resumo Financeiro</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Comissões Totais</p>
                        <p className="text-lg font-semibold text-gray-900">
                          R$ {selectedAffiliate.totalCommissions.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Comissões Pagas</p>
                        <p className="text-lg font-semibold text-green-600">
                          R$ {selectedAffiliate.paidCommissions.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Comissões Pendentes</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          R$ {selectedAffiliate.pendingCommissions.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Taxa de Comissão</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedAffiliate.commissionRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Ações</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowAffiliateModal(false);
                          setShowCommissionModal(true);
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <FiDollarSign className="h-4 w-4 mr-2" />
                        Lançar Comissão Manual
                      </button>
                      <button
                        onClick={() => generateAffiliateStatement(selectedAffiliate.id)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <FiFileText className="h-4 w-4 mr-2" />
                        Gerar Extrato
                      </button>
                      <button
                        onClick={() => handleResetPassword(selectedAffiliate.id)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                      >
                        <FiKey className="h-4 w-4 mr-2" />
                        Reset Senha
                      </button>
                      <button
                        onClick={() => handleDeleteAffiliate(selectedAffiliate.id)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <FiTrash2 className="h-4 w-4 mr-2" />
                        Converter para Usuário
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Users and Stats */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Estatísticas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-500">Usuários Vinculados</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedAffiliate.linkedUsers}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-500">Usuários Ativos</p>
                        <p className="text-2xl font-bold text-green-600">{selectedAffiliate.activeUsers}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-sm text-purple-500">Taxa de Conversão</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedAffiliate.conversionRate}%</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-500">Receita Total</p>
                        <p className="text-lg font-bold text-yellow-600">
                          R$ {selectedAffiliate.totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Commissions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Comissões Recentes</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {/* Mock commission data */}
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">João Silva</p>
                            <p className="text-xs text-gray-500">Trading - 20/01/2024</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">+R$ 125,50</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">Maria Santos</p>
                            <p className="text-xs text-gray-500">Subscription - 19/01/2024</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">+R$ 75,00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linked Users */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Usuários Vinculados</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {/* Mock user data */}
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">João Silva</p>
                            <p className="text-xs text-gray-500">Premium - Ativo</p>
                          </div>
                          <span className="text-xs text-gray-500">15/01/2024</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">Maria Santos</p>
                            <p className="text-xs text-gray-500">VIP - Ativo</p>
                          </div>
                          <span className="text-xs text-gray-500">10/01/2024</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAffiliateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Fechar
                </button>
                {modalType === 'edit' && (
                  <button
                    onClick={() => {
                      // Save affiliate logic here
                      setShowAffiliateModal(false);
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Commission Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lançar Comissão Manual</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
 />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Motivo</label>
                <textarea
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                  placeholder="Descreva o motivo da comissão..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCommissionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleManualCommission('', 0, '')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Lançar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



