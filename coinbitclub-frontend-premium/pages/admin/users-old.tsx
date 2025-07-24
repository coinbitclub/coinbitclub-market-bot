import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  EyeIcon,
  BanknotesIcon,
  ChartBarIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface User {
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
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  two_factor_enabled: boolean;
  subscription_expires: string | null;
  phone?: string;
  country?: string;
}

const UsersAdmin: NextPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    status: 'all',
    plan: 'all',
    kyc_status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, [filters, currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock data - será substituído pela API real
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          status: 'active',
          plan: 'premium',
          created_at: '2024-01-15',
          last_login: '2024-01-20 10:30:00',
          total_invested: 5000,
          total_profit: 750,
          referrals_count: 3,
          total_commissions: 150,
          kyc_status: 'approved',
          two_factor_enabled: true,
          subscription_expires: '2024-12-15'
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          status: 'active',
          plan: 'vip',
          created_at: '2024-01-10',
          last_login: '2024-01-19 15:45:00',
          total_invested: 15000,
          total_profit: 2250,
          referrals_count: 8,
          total_commissions: 480,
          kyc_status: 'approved',
          two_factor_enabled: true,
          subscription_expires: '2024-11-10'
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          status: 'pending',
          plan: 'free',
          created_at: '2024-01-18',
          last_login: '2024-01-18 09:15:00',
          total_invested: 0,
          total_profit: 0,
          referrals_count: 0,
          total_commissions: 0,
          kyc_status: 'pending',
          two_factor_enabled: false,
          subscription_expires: null
        },
        {
          id: '4',
          name: 'Ana Oliveira',
          email: 'ana@email.com',
          status: 'suspended',
          plan: 'premium',
          created_at: '2024-01-05',
          last_login: '2024-01-17 14:20:00',
          total_invested: 3000,
          total_profit: -150,
          referrals_count: 1,
          total_commissions: 25,
          kyc_status: 'rejected',
          two_factor_enabled: false,
          subscription_expires: '2024-06-05'
        }
      ];

      // Filtrar users baseado nos filtros
      let filteredUsers = mockUsers;
      
      if (filters.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }
      
      if (filters.plan !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.plan === filters.plan);
      }
      
      if (filters.kyc_status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.kyc_status === filters.kyc_status);
      }
      
      if (filters.search) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setUsers(filteredUsers);
      setTotalPages(Math.ceil(filteredUsers.length / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      console.log(`${action} user ${userId}`);
      // Implementar ações da API
      fetchUsers();
    } catch (error) {
      console.error(`Error ${action} user:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      console.log(`${action} users:`, selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error(`Error ${action} users:`, error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-success/10 text-success',
      inactive: 'bg-muted text-muted-foreground',
      suspended: 'bg-destructive/10 text-destructive',
      pending: 'bg-warning/10 text-warning'
    };
    
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      pending: 'Pendente'
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      vip: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      free: 'Gratuito',
      premium: 'Premium',
      vip: 'VIP'
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[plan as keyof typeof styles]}`}>
        {labels[plan as keyof typeof labels]}
      </span>
    );
  };

  const getKycStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      not_submitted: 'Não Enviado'
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <Head>
        <title>Gestão de Usuários - CoinBitClub MarketBot</title>
        <meta name="description" content="Gerencie usuários, assinaturas e permissões" />
      </Head>

      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="flex items-center text-3xl font-bold text-primary">
                  <UserGroupIcon className="mr-3 size-8" />
                  Gestão de Usuários
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Gerencie contas de usuários, assinaturas e permissões
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="bg-success text-success-foreground">
                  <PlusIcon className="mr-2 size-4" />
                  Novo Usuário
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Estatísticas */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold">1,248</p>
                </div>
                <UserGroupIcon className="size-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-success">956</p>
                </div>
                <ShieldCheckIcon className="size-8 text-success" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assinantes Premium</p>
                  <p className="text-2xl font-bold text-blue-600">467</p>
                </div>
                <BanknotesIcon className="size-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">KYC Pendentes</p>
                  <p className="text-2xl font-bold text-warning">23</p>
                </div>
                <ShieldExclamationIcon className="size-8 text-warning" />
              </div>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card className="mb-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-4"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="pending">Pendente</option>
                </select>
                
                <select
                  value={filters.plan}
                  onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="free">Gratuito</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
                
                <select
                  value={filters.kyc_status}
                  onChange={(e) => setFilters({ ...filters, kyc_status: e.target.value })}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="all">Todos KYC</option>
                  <option value="approved">Aprovado</option>
                  <option value="pending">Pendente</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="not_submitted">Não Enviado</option>
                </select>
              </div>
            </div>

            {/* Ações em Massa */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 flex items-center gap-4 rounded-md bg-muted p-4">
                <span className="text-sm">
                  {selectedUsers.length} usuário(s) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button onClick={() => handleBulkAction('activate')}>
                    Ativar
                  </Button>
                  <Button onClick={() => handleBulkAction('suspend')}>
                    Suspender
                  </Button>
                  <Button onClick={() => handleBulkAction('delete')} className="bg-destructive text-destructive-foreground">
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        checked={selectedUsers.length === users.length && users.length > 0}
                      />
                    </th>
                    <th className="p-4 text-left font-medium">Usuário</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Plano</th>
                    <th className="p-4 text-left font-medium">KYC</th>
                    <th className="p-4 text-left font-medium">Investimento Total</th>
                    <th className="p-4 text-left font-medium">Lucro/Prejuízo</th>
                    <th className="p-4 text-left font-medium">Indicações</th>
                    <th className="p-4 text-left font-medium">Último Login</th>
                    <th className="p-4 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Desde {formatDate(user.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="p-4">
                          {getPlanBadge(user.plan)}
                        </td>
                        <td className="p-4">
                          {getKycStatusBadge(user.kyc_status)}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{formatCurrency(user.total_invested)}</div>
                        </td>
                        <td className="p-4">
                          <div className={`font-medium ${user.total_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(user.total_profit)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{user.referrals_count}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(user.total_commissions)} comissões
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(user.last_login).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.last_login).toLocaleTimeString('pt-BR')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2"
                            >
                              <EyeIcon className="size-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2"
                            >
                              <PencilIcon className="size-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="bg-destructive p-2 text-destructive-foreground"
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between border-t border-border p-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {users.length} de {users.length} usuários
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </Card>
        </main>

        {/* Modal de Usuário */}
        {showUserModal && selectedUser && (
          <Modal
            open={showUserModal}
            onClose={() => setShowUserModal(false)}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nome</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <select
                    value={selectedUser.status}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="suspended">Suspenso</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Plano</label>
                  <select
                    value={selectedUser.plan}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="free">Gratuito</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Investimento Total</label>
                  <div className="text-lg font-semibold">{formatCurrency(selectedUser.total_invested)}</div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Lucro/Prejuízo</label>
                  <div className={`text-lg font-semibold ${selectedUser.total_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(selectedUser.total_profit)}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Indicações</label>
                  <div className="text-lg font-semibold">{selectedUser.referrals_count}</div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Comissões</label>
                  <div className="text-lg font-semibold">{formatCurrency(selectedUser.total_commissions)}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-success text-success-foreground">
                  Salvar Alterações
                </Button>
                <Button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && selectedUser && (
          <Modal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
          >
            <div className="space-y-4">
              <p>
                Tem certeza que deseja excluir o usuário <strong>{selectedUser.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita e todos os dados do usuário serão perdidos.
              </p>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleUserAction('delete', selectedUser.id);
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 bg-destructive text-destructive-foreground"
                >
                  Excluir
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default UserManagementPage;
