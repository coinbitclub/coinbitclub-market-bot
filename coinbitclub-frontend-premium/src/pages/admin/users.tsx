import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiUsers, FiSearch, FiFilter, FiPlus, FiEdit, FiTrash, FiEye, 
  FiRefreshCw, FiDollarSign, FiMail, FiLock, FiUserPlus, FiDownload 
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  trial_ends_at: string;
  prepaid_balance: number;
  historical_result_usd: number;
  total_revenue: number;
  exchange_balance: number;
  bank_data: string;
  cpf: string;
  pix_key: string;
  created_at: string;
  last_login_at: string;
  affiliate_id?: string;
  affiliate_name?: string;
}

interface UserModal {
  isOpen: boolean;
  type: 'create' | 'edit' | 'view' | 'refund' | 'reset' | 'delete';
  user?: User;
}

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<UserModal>({ isOpen: false, type: 'create' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { data: usersData, error, mutate } = useSWR('/api/admin/users', {
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const activeUsers = usersData?.active || 0;

  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginate users
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial_active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        mutate();
        setModal({ isOpen: false, type: 'create' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Senha resetada com sucesso! Nova senha enviada por email.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleRefund = async (userId: string, amount: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (response.ok) {
        mutate();
        setModal({ isOpen: false, type: 'refund' });
        alert('Reembolso processado com sucesso!');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const handleLinkAffiliate = async (userId: string, affiliateId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/link-affiliate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId })
      });
      
      if (response.ok) {
        mutate();
        alert('Usuário vinculado ao afiliado com sucesso!');
      }
    } catch (error) {
      console.error('Error linking affiliate:', error);
    }
  };

  const UserModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      role: 'user',
      status: 'trial_active',
      refundAmount: 0,
      affiliateId: ''
    });

    useEffect(() => {
      if (modal.user) {
        setFormData({
          name: modal.user.name || '',
          email: modal.user.email || '',
          role: modal.user.role || 'user',
          status: modal.user.status || 'trial_active',
          refundAmount: 0,
          affiliateId: modal.user.affiliate_id || ''
        });
      }
    }, [modal.user]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      switch (modal.type) {
        case 'create':
          handleCreateUser(formData);
          break;
        case 'refund':
          if (modal.user) {
            handleRefund(modal.user.id, formData.refundAmount);
          }
          break;
        case 'reset':
          if (modal.user) {
            handleResetPassword(modal.user.id);
            setModal({ isOpen: false, type: 'reset' });
          }
          break;
      }
    };

    return (
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, type: 'create' })}
        title={
          modal.type === 'create' ? 'Novo Usuário' :
          modal.type === 'edit' ? 'Editar Usuário' :
          modal.type === 'view' ? 'Detalhes do Usuário' :
          modal.type === 'refund' ? 'Processar Reembolso' :
          modal.type === 'reset' ? 'Resetar Senha' :
          'Excluir Usuário'
        }
      >
        {modal.type === 'view' && modal.user ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="text-sm text-gray-900">{modal.user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{modal.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Saldo Pré-pago</label>
                <p className="text-sm text-gray-900">{formatCurrency(modal.user.prepaid_balance)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Resultado Histórico</label>
                <p className="text-sm text-gray-900">{formatCurrency(modal.user.historical_result_usd)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Saldo na Exchange</label>
                <p className="text-sm text-gray-900">{formatCurrency(modal.user.exchange_balance)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <p className="text-sm text-gray-900">{modal.user.cpf || 'Não informado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                <p className="text-sm text-gray-900">{modal.user.pix_key || 'Não informado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dados Bancários</label>
                <p className="text-sm text-gray-900">{modal.user.bank_data || 'Não informado'}</p>
              </div>
            </div>
            {modal.user.affiliate_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Afiliado</label>
                <p className="text-sm text-gray-900">{modal.user.affiliate_name}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {(modal.type === 'create' || modal.type === 'edit') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Função</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="trial_active">Trial Ativo</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                </div>
              </>
            )}

            {modal.type === 'refund' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor do Reembolso</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.refundAmount}
                  onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}

            {modal.type === 'reset' && (
              <div className="text-sm text-gray-600">
                Tem certeza que deseja resetar a senha deste usuário? Uma nova senha será enviada por email.
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModal({ isOpen: false, type: 'create' })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {modal.type === 'create' ? 'Criar' : 
                 modal.type === 'refund' ? 'Processar' :
                 modal.type === 'reset' ? 'Resetar' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Gestão de Usuários - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Total: {totalUsers} usuários | Ativos: {activeUsers}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setModal({ isOpen: true, type: 'create' })}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="trial_active">Trial Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
                
                <button
                  onClick={() => mutate()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo Pré-pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resultado USD
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user: User) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.affiliate_name && (
                                <div className="text-xs text-blue-600">
                                  Afiliado: {user.affiliate_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(user.prepaid_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={user.historical_result_usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(user.historical_result_usd)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(user.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'view', user })}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'edit', user })}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'refund', user })}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FiDollarSign className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'reset', user })}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <FiLock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'delete', user })}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                        <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> de{' '}
                        <span className="font-medium">{filteredUsers.length}</span> resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UserModal />
    </div>
  );
}
                <td className="px-4 py-2 text-green-400">Ativo</td>
                <td className="px-4 py-2">Admin</td>
                <td className="px-4 py-2"><button className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600">Editar</button></td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-gray-900">
                <td className="px-4 py-2">@maria</td>
                <td className="px-4 py-2">maria@email.com</td>
                <td className="px-4 py-2 text-yellow-400">Pendente</td>
                <td className="px-4 py-2">Usuário</td>
                <td className="px-4 py-2"><button className="rounded bg-pink-500 px-3 py-1 text-white hover:bg-pink-600">Editar</button></td>
              </tr>
              <tr className="hover:bg-gray-900">
                <td className="px-4 py-2">@lucas</td>
                <td className="px-4 py-2">lucas@email.com</td>
                <td className="px-4 py-2 text-red-400">Banido</td>
                <td className="px-4 py-2">Usuário</td>
                <td className="px-4 py-2"><button className="rounded bg-amber-500 px-3 py-1 text-black hover:bg-amber-600">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
