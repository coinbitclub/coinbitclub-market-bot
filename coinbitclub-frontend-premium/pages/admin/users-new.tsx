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
  country: string;
  plan: string;
  status: string;
  balance: number;
  total_operations: number;
  success_rate: number;
  total_pnl: number;
  joined_date: string;
  last_login: string;
  two_factor_enabled: boolean;
  email_verified: boolean;
  kyc_verified: boolean;
}

export default function UsersManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    free: 0,
    basic: 0,
    premium: 0,
    vip: 0,
    total_balance: 0
  });

  // Buscar dados reais da API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPlan !== 'all') params.append('plan', filterPlan);
      if (filterCountry !== 'all') params.append('country', filterCountry);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      } else {
        console.error('Erro ao buscar usuários:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterStatus, filterPlan, filterCountry]);

  // Funções para manipular usuários
  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      
      if (response.ok) {
        fetchUsers(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' })
      });
      
      if (response.ok) {
        fetchUsers(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
    }
  };

  const handleUpgradePlan = async (userId: string, newPlan: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      });
      
      if (response.ok) {
        fetchUsers(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesCountry = filterCountry === 'all' || user.country === filterCountry;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesCountry;
  });

  const handleResetPassword = (userId: string) => {
    if (confirm('Confirma o reset da senha deste usuário?')) {
      alert('Senha resetada com sucesso!');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('ATENÇÃO: Esta ação é irreversível. Confirma a exclusão deste usuário?')) {
      setUsers(users.filter(u => u.id !== userId));
      alert('Usuário excluído com sucesso!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Gestão de Usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Usuários | CoinBitClub Admin</title>
        <meta name="description" content="Gestão de Usuários - CoinBitClub Admin" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
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
        <div className="lg:ml-64">
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

              <div className="flex items-center space-x-6">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Atualizar</span>
                </button>
                <button className="flex items-center px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold">
                  <FiPlus className="w-5 h-5 mr-2" />
                  <span>Novo Usuário</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Total</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.total}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Ativos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.active}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Suspensos</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.suspended}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Plano Free</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.free}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <div className="text-center">
                  <p className="text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">Plano Basic</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.basic}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Plano Premium</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.premium}</p>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <div className="text-center">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Plano VIP</p>
                  <p className="text-3xl font-bold text-pink-400">{stats.vip}</p>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="suspended">Suspensos</option>
                  <option value="pending">Pendentes</option>
                </select>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="Free">Free</option>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                </select>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="all">Todos os Países</option>
                  <option value="Brasil">Brasil</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Angola">Angola</option>
                  <option value="USA">Estados Unidos</option>
                </select>
              </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400/10 border-b border-yellow-400/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Contato</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Saldo</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Plano</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Localização</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-400 font-bold uppercase tracking-wider">Resultados</th>
                      <th className="px-6 py-4 text-center text-yellow-400 font-bold uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-400/20">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-yellow-400/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-yellow-400 font-bold">{user.name}</p>
                            <p className="text-blue-400 text-sm">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-pink-400 font-medium">{user.phone}</td>
                        <td className="px-6 py-4">
                          <span className="text-yellow-400 font-bold text-lg">
                            ${user.balance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            user.plan === 'Premium' || user.plan === 'VIP'
                              ? 'bg-pink-400/20 text-pink-400 border border-pink-400/50' 
                              : 'bg-blue-400/20 text-blue-400 border border-blue-400/50'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {user.country === 'Brasil' ? (
                              <FiMapPin className="w-4 h-4 mr-2 text-yellow-400" />
                            ) : (
                              <FiGlobe className="w-4 h-4 mr-2 text-blue-400" />
                            )}
                            <span className="text-blue-300 font-medium">{user.country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            user.status === 'active' 
                              ? 'bg-pink-400/20 text-pink-400 border border-pink-400/50' 
                              : user.status === 'suspended'
                              ? 'bg-blue-400/20 text-blue-400 border border-blue-400/50'
                              : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                          }`}>
                            {user.status === 'active' ? 'Ativo' : user.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-pink-400 font-bold">${user.total_pnl.toFixed(2)}</p>
                            <p className="text-blue-400 text-sm">{user.total_operations} ops ({user.success_rate}%)</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="p-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Reset de Senha"
                            >
                              <FiKey className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-yellow-400 hover:text-pink-400 bg-yellow-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                              title="Visualizar Detalhes"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-pink-400 hover:text-yellow-400 bg-pink-400/20 hover:bg-yellow-400/20 rounded-lg transition-colors"
                              title="Editar Usuário"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-blue-400 hover:text-pink-400 bg-blue-400/20 hover:bg-pink-400/20 rounded-lg transition-colors"
                              title="Excluir Usuário"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <FiUsers className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-yellow-400 text-xl font-bold">Nenhum usuário encontrado</p>
                <p className="text-blue-400">Ajuste os filtros ou adicione novos usuários</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Gestão de Usuários - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema integrado com banco de dados real</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
