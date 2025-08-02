import React from 'react';
import { useState, useEffect } from 'react';
import { 
  FiUsers, FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiDollarSign,
  FiEye, FiKey, FiUserPlus, FiUserMinus, FiRefreshCw, FiDownload,
  FiBriefcase, FiCreditCard, FiPercent, FiFileText, FiShield, FiX
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  plan: 'basic' | 'premium' | 'vip';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  balance: number;
  prepaidBalance: number;
  exchangeBalance: number;
  historicalResult: number;
  revenue: number;
  affiliateId?: string;
  affiliateName?: string;
  bankData: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
  };
  pixKey: string;
  totalDeposits: number;
  totalWithdrawals: number;
  tradingPermission: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface UserDetails extends User {
  deposits: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    method: string;
  }>;
  withdrawals: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    method: string;
  }>;
  trades: Array<{
    id: string;
    date: string;
    pair: string;
    type: 'BUY' | 'SELL';
    amount: number;
    result: number;
  }>;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('view');

  // TODO: Replace with actual backend API call

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterPlan, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement real API call to backend
      const users: User[] = []; // NO MORE MOCK DATA - Backend integration required
      
      setUsers(users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf.includes(searchTerm)
      );
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(user => user.plan === filterPlan);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      // API call to reset password
      alert('Nova senha enviada por email!');
      // await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
    } catch (error) {
      alert('Erro ao resetar senha');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        // API call to delete user
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuário excluído com sucesso!');
      } catch (error) {
        alert('Erro ao excluir usuário');
      }
    }
  };

  const handleRefund = async (userId: string, amount: number, reason: string) => {
    try {
      // API call to process refund
      alert(`Reembolso de R$ ${amount} processado com sucesso!`);
      setShowRefundModal(false);
      fetchUsers();
    } catch (error) {
      alert('Erro ao processar reembolso');
    }
  };

  const handleLinkAffiliate = async (userId: string, affiliateId: string) => {
    try {
      // API call to link affiliate
      alert('Usuário vinculado ao afiliado com sucesso!');
      setShowAffiliateModal(false);
      fetchUsers();
    } catch (error) {
      alert('Erro ao vincular afiliado');
    }
  };

  const totalActiveUsers = users.filter(u => u.status === 'active').length;
  const totalRevenue = users.reduce((sum, u) => sum + u.revenue, 0);
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head><title>Gerenciar Usuários - CoinBitClub Admin</title></Head>
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
        <title>Gerenciar Usuários - CoinBitClub Admin</title>
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
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                    <p className="mt-2 text-sm text-gray-600">
                      Total de {totalActiveUsers} usuários ativos
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {setModalType('create'); setShowCreateModal(true);}}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FiUserPlus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </button>
                    <button
                      onClick={fetchUsers}
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
                        <dt className="text-sm font-medium text-gray-500 truncate">Usuários Ativos</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalActiveUsers}</dd>
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
                        <dt className="text-sm font-medium text-gray-500 truncate">Receita Total</dt>
                        <dd className="text-lg font-medium text-gray-900">R$ {totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</dd>
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
                        <dt className="text-sm font-medium text-gray-500 truncate">Saldo Total</dt>
                        <dd className="text-lg font-medium text-gray-900">R$ {totalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiPercent className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Taxa de Conversão</dt>
                        <dd className="text-lg font-medium text-gray-900">12.5%</dd>
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
                        placeholder="Buscar por nome, email ou CPF..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="all">Todos os Planos</option>
                      <option value="basic">Básico</option>
                      <option value="premium">Premium</option>
                      <option value="vip">VIP</option>
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

            {/* Users Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <li key={user.id}>
                    <div className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.plan === 'vip' ? 'bg-purple-100 text-purple-800' :
                                user.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.plan.toUpperCase()}
                              </span>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' :
                                user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                              <span>Saldo: R$ {user.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              <span>Resultado: R$ {user.historicalResult.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                              {user.affiliateName && <span>Afiliado: {user.affiliateName}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Fetch detailed user data
                              setSelectedUser({
                                ...user,
                                deposits: [],
                                withdrawals: [],
                                trades: []
                              });
                              setModalType('view');
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser({
                                ...user,
                                deposits: [],
                                withdrawals: [],
                                trades: []
                              });
                              setModalType('edit');
                              setShowUserModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-500"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-yellow-600 hover:text-yellow-500"
                          >
                            <FiKey className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-500"
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'view' ? 'Detalhes do Usuário' : 
                   modalType === 'edit' ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Informações Básicas</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={selectedUser.name}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                      type="text"
                      value={selectedUser.cpf}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="text"
                      value={selectedUser.phone}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                    <input
                      type="text"
                      value={selectedUser.pixKey}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                </div>

                {/* Financial Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Informações Financeiras</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Saldo Atual</label>
                    <input
                      type="number"
                      value={selectedUser.balance}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Saldo Pré-pago</label>
                    <input
                      type="number"
                      value={selectedUser.prepaidBalance}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Saldo na Exchange</label>
                    <input
                      type="number"
                      value={selectedUser.exchangeBalance}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resultado Histórico (USD)</label>
                    <input
                      type="number"
                      value={selectedUser.historicalResult}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receita</label>
                    <input
                      type="number"
                      value={selectedUser.revenue}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                </div>

                {/* Bank Data */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Dados Bancários</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Banco</label>
                    <input
                      type="text"
                      value={selectedUser.bankData.bank}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agência</label>
                    <input
                      type="text"
                      value={selectedUser.bankData.agency}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Conta</label>
                    <input
                      type="text"
                      value={selectedUser.bankData.account}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
 />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                    <select
                      value={selectedUser.bankData.accountType}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="Corrente">Corrente</option>
                      <option value="Poupança">Poupança</option>
                    </select>
                  </div>
                </div>

                {/* Additional Actions */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Ações</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setShowRefundModal(true);
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <FiDollarSign className="h-4 w-4 mr-2" />
                      Lançar Reembolso
                    </button>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setShowAffiliateModal(true);
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <FiUserPlus className="h-4 w-4 mr-2" />
                      Vincular Afiliado
                    </button>
                    <button
                      onClick={() => handleResetPassword(selectedUser.id)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <FiKey className="h-4 w-4 mr-2" />
                      Reset Senha
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <FiTrash2 className="h-4 w-4 mr-2" />
                      Excluir Usuário
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                {modalType !== 'view' && (
                  <button
                    onClick={() => {
                      // Save user logic here
                      setShowUserModal(false);
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

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lançar Reembolso</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
 />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Motivo</label>
                <textarea
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                  placeholder="Descreva o motivo do reembolso..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRefund('', 0, '')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Processar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Link Modal */}
      {showAffiliateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vincular Afiliado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Selecionar Afiliado</label>
                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">Selecione um afiliado...</option>
                  <option value="aff_001">Marcos Afiliado</option>
                  <option value="aff_002">Ana Silva</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAffiliateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleLinkAffiliate('', '')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



