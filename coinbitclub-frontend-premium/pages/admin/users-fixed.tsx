import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiKey, FiEye,
  FiUserCheck, FiUserX, FiGlobe, FiMapPin, FiCreditCard, FiRefreshCw,
  FiActivity, FiAlertTriangle, FiDollarSign
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  plan_type: 'prepaid' | 'subscription';
  location: 'brasil' | 'exterior';
  status: 'active' | 'inactive';
  created_at: string;
  last_login: string;
  total_profit: number;
  total_operations: number;
}

export default function UsersManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    subscription_brasil: 0,
    subscription_exterior: 0,
    prepaid_brasil: 0,
    prepaid_exterior: 0
  });

  // Buscar dados reais da API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPlan !== 'all') params.append('plan', filterPlan);
      if (filterLocation !== 'all') params.append('location', filterLocation);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      } else {
        console.error('Erro ao buscar usuários:', data.message);
        // Fallback para dados mock se a API falhar
        loadMockData();
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      // Fallback para dados mock se a API falhar
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Simular dados de usuários
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '+55 11 99999-9999',
        balance: 2500.75,
        plan_type: 'subscription',
        location: 'brasil',
        status: 'active',
        created_at: '2024-01-15',
        last_login: '2024-07-25',
        total_profit: 1850.30,
        total_operations: 45
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '+55 21 88888-8888',
        balance: 1200.50,
        plan_type: 'prepaid',
        location: 'brasil',
        status: 'active',
        created_at: '2024-02-10',
        last_login: '2024-07-24',
        total_profit: 985.60,
        total_operations: 28
      },
      {
        id: '3',
        name: 'John Doe',
        email: 'john@email.com',
        phone: '+1 555-123-4567',
        balance: 5000.00,
        plan_type: 'subscription',
        location: 'exterior',
        status: 'active',
        created_at: '2024-01-20',
        last_login: '2024-07-25',
        total_profit: 3200.90,
        total_operations: 78
      },
      {
        id: '4',
        name: 'Carlos Lima',
        email: 'carlos@email.com',
        phone: '+55 85 77777-7777',
        balance: 750.25,
        plan_type: 'prepaid',
        location: 'brasil',
        status: 'inactive',
        created_at: '2024-03-05',
        last_login: '2024-07-15',
        total_profit: 420.15,
        total_operations: 12
      }
    ];

    setUsers(mockUsers);
    
    // Calcular estatísticas
    const newStats = {
      total: mockUsers.length,
      active: mockUsers.filter(u => u.status === 'active').length,
      inactive: mockUsers.filter(u => u.status === 'inactive').length,
      subscription_brasil: mockUsers.filter(u => u.plan_type === 'subscription' && u.location === 'brasil').length,
      subscription_exterior: mockUsers.filter(u => u.plan_type === 'subscription' && u.location === 'exterior').length,
      prepaid_brasil: mockUsers.filter(u => u.plan_type === 'prepaid' && u.location === 'brasil').length,
      prepaid_exterior: mockUsers.filter(u => u.plan_type === 'prepaid' && u.location === 'exterior').length,
    };
    
    setStats(newStats);
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterStatus, filterPlan, filterLocation]);

  // Atualizar a cada 60 segundos (1 minuto)
  useEffect(() => {
    const interval = setInterval(fetchUsers, 60000);
    return () => clearInterval(interval);
  }, []);

  // Funções para manipular usuários
  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || user.plan_type === filterPlan;
    const matchesLocation = filterLocation === 'all' || user.location === filterLocation;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesLocation;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Gestão de Usuários...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Usuários | CoinBitClub</title>
        <meta name="description" content="Gestão de Usuários - CoinBitClub Premium" />
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
              <a href="/admin/dashboard-executive" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Dashboard Executivo</span>
              </a>
              <a href="/admin/users" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Usuários</span>
              </a>
              <a href="/admin/affiliates" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Afiliados</span>
              </a>
              <a href="/admin/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/admin/alerts" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiAlertTriangle className="w-6 h-6 mr-4" />
                <span>Alertas</span>
              </a>
              <a href="/admin/adjustments" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Acertos</span>
              </a>
              <a href="/admin/accounting" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Contabilidade</span>
              </a>
              <a href="/admin/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
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
                <h2 className="text-2xl font-bold text-yellow-400">Gestão de Usuários</h2>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchUsers}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  <span>Atualizar</span>
                </button>
                <button className="flex items-center px-4 py-2 text-yellow-400 bg-yellow-400/20 border border-yellow-400/50 rounded-lg hover:bg-yellow-400/30 transition-colors">
                  <FiPlus className="w-4 h-4 mr-2" />
                  <span>Novo Usuário</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-black min-h-screen">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="flex items-center">
                  <FiUsers className="w-8 h-8 text-blue-400 mr-4" />
                  <div>
                    <p className="text-blue-300 text-sm">Total</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="flex items-center">
                  <FiUserCheck className="w-8 h-8 text-green-400 mr-4" />
                  <div>
                    <p className="text-green-300 text-sm">Ativos</p>
                    <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <div className="flex items-center">
                  <FiUserX className="w-8 h-8 text-red-400 mr-4" />
                  <div>
                    <p className="text-red-300 text-sm">Inativos</p>
                    <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="flex items-center">
                  <FiCreditCard className="w-8 h-8 text-yellow-400 mr-4" />
                  <div>
                    <p className="text-yellow-300 text-sm">Sub. BR</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.subscription_brasil}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <div className="flex items-center">
                  <FiGlobe className="w-8 h-8 text-purple-400 mr-4" />
                  <div>
                    <p className="text-purple-300 text-sm">Sub. Ext</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.subscription_exterior}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="flex items-center">
                  <FiMapPin className="w-8 h-8 text-pink-400 mr-4" />
                  <div>
                    <p className="text-pink-300 text-sm">Pre BR</p>
                    <p className="text-2xl font-bold text-pink-400">{stats.prepaid_brasil}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <div className="flex items-center">
                  <FiGlobe className="w-8 h-8 text-cyan-400 mr-4" />
                  <div>
                    <p className="text-cyan-300 text-sm">Pre Ext</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.prepaid_exterior}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 placeholder-blue-400/50 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">Todos os Planos</option>
                    <option value="subscription">Assinatura</option>
                    <option value="prepaid">Pré-pago</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">Todas as Localidades</option>
                    <option value="brasil">Brasil</option>
                    <option value="exterior">Exterior</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border border-yellow-400/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Usuário</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Plano</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Localização</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Saldo</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Lucro Total</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Operações</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-yellow-400/20 hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-blue-400 font-medium">{user.name}</p>
                            <p className="text-blue-300 text-sm">{user.email}</p>
                            <p className="text-blue-300 text-sm">{user.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.plan_type === 'subscription' 
                              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' 
                              : 'bg-pink-400/20 text-pink-400 border border-pink-400/50'
                          }`}>
                            {user.plan_type === 'subscription' ? 'Assinatura' : 'Pré-pago'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.location === 'brasil' 
                              ? 'bg-green-400/20 text-green-400 border border-green-400/50' 
                              : 'bg-blue-400/20 text-blue-400 border border-blue-400/50'
                          }`}>
                            {user.location === 'brasil' ? 'Brasil' : 'Exterior'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-blue-400 font-medium">
                            ${user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`font-medium ${user.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${user.total_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-blue-400 font-medium">{user.total_operations}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-400/20 text-green-400 border border-green-400/50' 
                              : 'bg-red-400/20 text-red-400 border border-red-400/50'
                          }`}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors">
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors">
                              <FiEdit className="w-4 h-4" />
                            </button>
                            {user.status === 'active' ? (
                              <button 
                                onClick={() => handleDeactivateUser(user.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <FiUserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleActivateUser(user.id)}
                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors"
                              >
                                <FiUserCheck className="w-4 h-4" />
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
          </main>
        </div>
      </div>
    </>
  );
}
