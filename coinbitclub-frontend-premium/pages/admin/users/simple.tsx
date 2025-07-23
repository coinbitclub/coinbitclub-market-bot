import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  UsersIcon, 
  MagnifyingGlassIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: string;
  registeredAt: string;
  lastLogin: string;
  totalTrades: number;
  totalVolume: number;
}

export default function SimpleAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Dados mockados
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        status: 'active',
        plan: 'Premium',
        registeredAt: '2024-01-15',
        lastLogin: '2024-01-20',
        totalTrades: 156,
        totalVolume: 25000
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@email.com',
        status: 'active',
        plan: 'Basic',
        registeredAt: '2024-01-10',
        lastLogin: '2024-01-19',
        totalTrades: 89,
        totalVolume: 12000
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        status: 'suspended',
        plan: 'Premium',
        registeredAt: '2024-01-05',
        lastLogin: '2024-01-18',
        totalTrades: 234,
        totalVolume: 45000
      },
      {
        id: '4',
        name: 'Ana Oliveira',
        email: 'ana@email.com',
        status: 'inactive',
        plan: 'Basic',
        registeredAt: '2024-01-01',
        lastLogin: '2024-01-15',
        totalTrades: 45,
        totalVolume: 8000
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="size-4" />;
      case 'inactive': return <XCircleIcon className="size-4" />;
      case 'suspended': return <XCircleIcon className="size-4" />;
      default: return null;
    }
  };

  const handleUserAction = (action: string, user: User) => {
    switch (action) {
      case 'view':
        setSelectedUser(user);
        setShowModal(true);
        break;
      case 'edit':
        alert(`Editar usuário: ${user.name}`);
        break;
      case 'delete':
        if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
          setUsers(users.filter(u => u.id !== user.id));
        }
        break;
      case 'suspend':
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, status: 'suspended' as const } : u
        ));
        break;
      case 'activate':
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, status: 'active' as const } : u
        ));
        break;
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length
  };

  return (
    <>
      <Head>
        <title>Gestão de Usuários - Admin CoinBitClub</title>
        <meta name="description" content="Painel administrativo para gestão de usuários" />
      </Head>

      <div className="min-h-screen bg-gray-900 p-6 text-white">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UsersIcon className="size-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Gestão de Usuários</h1>
                <p className="text-gray-400">Gerencie todos os usuários da plataforma</p>
              </div>
            </div>
            <button className="flex items-center space-x-2 rounded-lg bg-cyan-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-cyan-600">
              <PlusIcon className="size-5" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <UsersIcon className="size-8 text-blue-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                </div>
                <CheckCircleIcon className="size-8 text-green-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Usuários Inativos</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.inactive}</p>
                </div>
                <XCircleIcon className="size-8 text-yellow-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Usuários Suspensos</p>
                  <p className="text-2xl font-bold text-red-400">{stats.suspended}</p>
                </div>
                <XCircleIcon className="size-8 text-red-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-gray-400">
                  {filteredUsers.length} de {users.length} usuários
                </span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-lg bg-gray-800">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-gray-400">Carregando usuários...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Último Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Trades
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(user.status)}`}>
                            {getStatusIcon(user.status)}
                            <span className="capitalize">{user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Suspenso'}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {user.plan}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {user.totalTrades}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          ${user.totalVolume.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleUserAction('view', user)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <EyeIcon className="size-5" />
                            </button>
                            <button
                              onClick={() => handleUserAction('edit', user)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <PencilIcon className="size-5" />
                            </button>
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleUserAction('suspend', user)}
                                className="text-yellow-400 hover:text-yellow-300"
                              >
                                <XCircleIcon className="size-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction('activate', user)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <CheckCircleIcon className="size-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleUserAction('delete', user)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon className="size-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="rounded bg-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-600">
                  Anterior
                </button>
                <span className="rounded bg-cyan-500 px-3 py-1 text-white">1</span>
                <span className="cursor-pointer rounded bg-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-600">2</span>
                <span className="cursor-pointer rounded bg-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-600">3</span>
                <button className="rounded bg-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-600">
                  Próximo
                </button>
              </div>
              <span className="text-sm text-gray-400">
                Página 1 de 3
              </span>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes do Usuário */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-h-96 w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-800 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Detalhes do Usuário</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircleIcon className="size-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Nome</label>
                    <p className="text-white">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <p className="capitalize text-white">{selectedUser.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Plano</label>
                    <p className="text-white">{selectedUser.plan}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Data de Registro</label>
                    <p className="text-white">{new Date(selectedUser.registeredAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Último Login</label>
                    <p className="text-white">{new Date(selectedUser.lastLogin).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Total de Trades</label>
                    <p className="text-white">{selectedUser.totalTrades}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Volume Total</label>
                    <p className="text-white">${selectedUser.totalVolume.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleUserAction('edit', selectedUser)}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleUserAction('suspend', selectedUser)}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                  >
                    Suspender
                  </button>
                  <button
                    onClick={() => {
                      handleUserAction('delete', selectedUser);
                      setShowModal(false);
                    }}
                    className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
