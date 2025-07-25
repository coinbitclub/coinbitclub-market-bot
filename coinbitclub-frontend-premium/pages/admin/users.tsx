import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../src/components/Layout/DashboardLayout';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiKey,
  FiPlus,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'user' | 'affiliate';
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'user' | 'affiliate' | 'admin';
  isActive: boolean;
  balance: number;
  totalProfit: number;
  totalLoss: number;
  createdAt: string;
  lastLogin: string;
  country: string;
  plan: string;
}

const AdminUsers = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    subscriptionBrasil: 0,
    subscriptionExterior: 0,
    prepaidBrasil: 0,
    prepaidExterior: 0
  });

  // Estado para novo usuário
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'user' as 'user' | 'affiliate' | 'admin',
    country: 'BR'
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUser(parsedUser);
        await loadUsers();
      } catch (error) {
        console.error('Erro na autenticação:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadUsers = async () => {
    try {
      // Dados simulados - aqui você faria a chamada real para a API
      const mockUsers: AppUser[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-1234',
          userType: 'user',
          isActive: true,
          balance: 150.00,
          totalProfit: 234.50,
          totalLoss: -45.20,
          createdAt: '2025-01-20',
          lastLogin: '2025-01-25 10:30',
          country: 'BR',
          plan: 'Basic'
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(11) 99999-5678',
          userType: 'affiliate',
          isActive: true,
          balance: 280.00,
          totalProfit: 567.80,
          totalLoss: -89.20,
          createdAt: '2025-01-18',
          lastLogin: '2025-01-25 09:15',
          country: 'BR',
          plan: 'Premium'
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '(11) 99999-9012',
          userType: 'user',
          isActive: false,
          balance: 50.00,
          totalProfit: 67.30,
          totalLoss: -23.40,
          createdAt: '2025-01-15',
          lastLogin: '2025-01-22 14:20',
          country: 'US',
          plan: 'Free'
        }
      ];

      setUsers(mockUsers);

      // Calcular estatísticas
      const totalUsers = mockUsers.length;
      const activeUsers = mockUsers.filter(u => u.isActive).length;
      const inactiveUsers = totalUsers - activeUsers;
      const subscriptionBrasil = mockUsers.filter(u => u.country === 'BR' && u.plan !== 'Free').length;
      const subscriptionExterior = mockUsers.filter(u => u.country !== 'BR' && u.plan !== 'Free').length;
      const prepaidBrasil = mockUsers.filter(u => u.country === 'BR' && u.plan === 'Free').length;
      const prepaidExterior = mockUsers.filter(u => u.country !== 'BR' && u.plan === 'Free').length;

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        subscriptionBrasil,
        subscriptionExterior,
        prepaidBrasil,
        prepaidExterior
      });

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      // Aqui você faria a chamada para resetar a senha
      alert('Email de reset de senha enviado!');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        // Aqui você faria a chamada para excluir o usuário
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuário excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  const handleAddUser = async () => {
    try {
      // Aqui você faria a chamada para criar o usuário
      const user: AppUser = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        userType: newUser.userType,
        isActive: true,
        balance: 0,
        totalProfit: 0,
        totalLoss: 0,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Nunca',
        country: newUser.country,
        plan: 'Free'
      };

      setUsers([...users, user]);
      setNewUser({ name: '', email: '', phone: '', userType: 'user', country: 'BR' });
      setShowAddUser(false);
      alert('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.userType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'admin': return 'Administrador';
      case 'affiliate': return 'Afiliado';
      case 'user': return 'Usuário';
      default: return 'Usuário';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'affiliate': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiUsers className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">{stats.activeUsers}</span>
                <span className="text-gray-500"> ativos / </span>
                <span className="text-red-600 font-medium">{stats.inactiveUsers}</span>
                <span className="text-gray-500"> inativos</span>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Planos Assinatura</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.subscriptionBrasil + stats.subscriptionExterior}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">{stats.subscriptionBrasil}</span>
                <span className="text-gray-500"> BR / </span>
                <span className="text-purple-600 font-medium">{stats.subscriptionExterior}</span>
                <span className="text-gray-500"> Exterior</span>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Só Pré-pago</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.prepaidBrasil + stats.prepaidExterior}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">{stats.prepaidBrasil}</span>
                <span className="text-gray-500"> BR / </span>
                <span className="text-purple-600 font-medium">{stats.prepaidExterior}</span>
                <span className="text-gray-500"> Exterior</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Taxa de Ativação</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-500">
                Usuários ativos vs total
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos os tipos</option>
                <option value="user">Usuários</option>
                <option value="affiliate">Afiliados</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    País
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.userType)}`}>
                        {getUserTypeLabel(user.userType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? <FiCheckCircle className="mr-1 h-3 w-3" /> : <FiXCircle className="mr-1 h-3 w-3" />}
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {user.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={user.totalProfit + user.totalLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {user.totalProfit + user.totalLoss >= 0 ? '+' : ''}R$ {(user.totalProfit + user.totalLoss).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.country === 'BR' ? '🇧🇷 Brasil' : '🌍 Exterior'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Reset de Senha"
                        >
                          <FiKey className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Adicionar Usuário */}
        {showAddUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Adicionar Novo Usuário</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Usuário</label>
                  <select
                    value={newUser.userType}
                    onChange={(e) => setNewUser({ ...newUser, userType: e.target.value as 'user' | 'affiliate' | 'admin' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="user">Usuário</option>
                    <option value="affiliate">Afiliado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">País</label>
                  <select
                    value={newUser.country}
                    onChange={(e) => setNewUser({ ...newUser, country: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="BR">Brasil</option>
                    <option value="US">Estados Unidos</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddUser}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Criar Usuário
                  </button>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
