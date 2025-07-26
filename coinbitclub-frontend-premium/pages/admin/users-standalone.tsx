import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  FiHome, FiUsers, FiUserCheck, FiTrendingUp, FiAlertTriangle, 
  FiBarChart, FiDollarSign, FiSettings, FiSearch, FiFilter,
  FiEdit, FiTrash2, FiPlus, FiEye, FiLock, FiUnlock
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  user_type: 'user' | 'affiliate' | 'admin';
  is_active: boolean;
  is_email_verified: boolean;
  plan_type: string;
  subscription_status: string;
  created_at: string;
  last_login: string;
  total_balance: number;
  total_profit: number;
}

export default function UsersManagementStandalone() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

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
        console.error('Erro ao verificar autenticação:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        // Dados mock em caso de erro
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@coinbitclub.com',
            phone: '(11) 99999-1111',
            country: 'BR',
            user_type: 'user',
            is_active: true,
            is_email_verified: true,
            plan_type: 'premium',
            subscription_status: 'active',
            created_at: '2025-01-20T10:00:00Z',
            last_login: '2025-01-25T08:30:00Z',
            total_balance: 2500.00,
            total_profit: 450.75
          },
          {
            id: '2',
            name: 'Maria Santos',
            email: 'maria@coinbitclub.com',
            phone: '(11) 99999-2222',
            country: 'BR',
            user_type: 'affiliate',
            is_active: true,
            is_email_verified: true,
            plan_type: 'basic',
            subscription_status: 'active',
            created_at: '2025-01-18T14:30:00Z',
            last_login: '2025-01-25T09:15:00Z',
            total_balance: 1200.00,
            total_profit: 89.25
          },
          {
            id: '3',
            name: 'Carlos Oliveira',
            email: 'carlos@coinbitclub.com',
            phone: '(11) 99999-3333',
            country: 'BR',
            user_type: 'user',
            is_active: false,
            is_email_verified: true,
            plan_type: 'basic',
            subscription_status: 'expired',
            created_at: '2025-01-15T16:45:00Z',
            last_login: '2025-01-22T11:20:00Z',
            total_balance: 0.00,
            total_profit: -25.50
          }
        ];
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterUsers(term, filterType);
  };

  const handleFilter = (type: string) => {
    setFilterType(type);
    filterUsers(searchTerm, type);
  };

  const filterUsers = (search: string, type: string) => {
    let filtered = users;

    if (search) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== 'all') {
      filtered = filtered.filter(user => {
        switch (type) {
          case 'active': return user.is_active;
          case 'inactive': return !user.is_active;
          case 'premium': return user.plan_type === 'premium';
          case 'basic': return user.plan_type === 'basic';
          case 'affiliates': return user.user_type === 'affiliate';
          default: return true;
        }
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadUsers();
        alert(`Ação "${action}" executada com sucesso!`);
      } else {
        alert('Erro ao executar ação');
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return '#FF6B6B';
      case 'affiliate': return '#4ECDC4';
      case 'user': return '#45B7D1';
      default: return '#95A5A6';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#2ECC71' : '#E74C3C';
  };

  // Paginação
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
    { name: 'Gestão de Usuários', href: '/admin/users', icon: FiUsers, active: true },
    { name: 'Gestão de Afiliados', href: '/admin/affiliates', icon: FiUserCheck },
    { name: 'Operações', href: '/admin/operations', icon: FiTrendingUp },
    { name: 'Alertas', href: '/admin/alerts', icon: FiAlertTriangle },
    { name: 'Acertos', href: '/admin/acertos', icon: FiBarChart },
    { name: 'Contabilidade', href: '/admin/accounting', icon: FiDollarSign },
    { name: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF'
      }}>
        <div style={{ fontSize: '1.2rem' }}>⚡ Carregando Usuários...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Usuários - CoinBitClub Admin</title>
        <meta name="description" content="Gestão de usuários do CoinBitClub" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        display: 'flex' 
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '280px', 
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(17, 17, 17, 0.9))',
          borderRight: '1px solid #333333',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 30
        }}>
          {/* Header */}
          <div style={{ 
            padding: '2rem 1.5rem',
            background: 'linear-gradient(135deg, #E6C200, #D4AF37)',
            margin: '1rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: '#000000'
            }}>
              🏛️ CoinBitClub
            </h1>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.9rem',
              color: '#000000',
              opacity: 0.8
            }}>
              Painel Administrativo
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0 1rem' }}>
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  margin: '0.25rem 0',
                  borderRadius: '8px',
                  color: item.active ? '#000000' : '#FFFFFF',
                  background: item.active 
                    ? 'linear-gradient(135deg, #E6C200, #D4AF37)' 
                    : 'transparent',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: item.active ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <item.icon size={18} />
                {item.name}
              </a>
            ))}
          </nav>

          {/* User Info */}
          <div style={{ 
            padding: '1rem',
            borderTop: '1px solid #333333',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4A9EDB, #BA55D3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                👨‍💼
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user?.name || 'Admin'}</div>
                <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>Administrador</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #D9534F, #C9302C)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚪 Sair
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ marginLeft: '280px', flex: 1, padding: '2rem' }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #E6C200, #D4AF37)',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            color: '#000000'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FiUsers size={32} />
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                  Gestão de Usuários
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', opacity: 0.8 }}>
                  Gerencie todos os usuários da plataforma
                </p>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                  <FiSearch color="#B0B3B8" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <FiFilter color="#B0B3B8" />
                <select
                  value={filterType}
                  onChange={(e) => handleFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="premium">Premium</option>
                  <option value="basic">Basic</option>
                  <option value="affiliates">Afiliados</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                Mostrando {currentUsers.length} de {filteredUsers.length} usuários
              </span>
              <button
                onClick={() => handleUserAction('new', 'create')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #5CB85C, #4A9E4A)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <FiPlus /> Novo Usuário
              </button>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
                }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Usuário</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Tipo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Plano</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Saldo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Lucro</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Último Login</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user, index) => (
                    <tr key={user.id} style={{ 
                      borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.25rem' }}>{user.name}</div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.85rem' }}>{user.email}</div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>{user.phone}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: getUserTypeColor(user.user_type),
                          color: '#FFFFFF',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {user.user_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: user.plan_type === 'premium' 
                            ? 'linear-gradient(135deg, #E6C200, #D4AF37)' 
                            : 'linear-gradient(135deg, #4A9EDB, #357ABD)',
                          color: '#000000',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {user.plan_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: getStatusColor(user.is_active)
                          }}></div>
                          <span style={{ color: getStatusColor(user.is_active), fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#FFFFFF', fontWeight: 'bold' }}>
                        {formatCurrency(user.total_balance)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          color: user.total_profit >= 0 ? '#5CB85C' : '#D9534F',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(user.total_profit)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#B0B3B8', fontSize: '0.85rem' }}>
                        {formatDate(user.last_login)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleUserAction(user.id, 'view')}
                            style={{
                              background: 'rgba(74, 158, 219, 0.2)',
                              border: '1px solid rgba(74, 158, 219, 0.3)',
                              color: '#4A9EDB',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Visualizar"
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'edit')}
                            style={{
                              background: 'rgba(212, 175, 55, 0.2)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              color: '#D4AF37',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Editar"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                            style={{
                              background: user.is_active 
                                ? 'rgba(217, 83, 79, 0.2)' 
                                : 'rgba(92, 184, 92, 0.2)',
                              border: user.is_active 
                                ? '1px solid rgba(217, 83, 79, 0.3)' 
                                : '1px solid rgba(92, 184, 92, 0.3)',
                              color: user.is_active ? '#D9534F' : '#5CB85C',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title={user.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {user.is_active ? <FiLock size={14} /> : <FiUnlock size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ 
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      background: page === currentPage 
                        ? 'linear-gradient(135deg, #E6C200, #D4AF37)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      color: page === currentPage ? '#000000' : '#FFFFFF',
                      border: 'none',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
