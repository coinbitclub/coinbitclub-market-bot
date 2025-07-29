import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  FiHome, FiUsers, FiUserCheck, FiTrendingUp, FiAlertTriangle, 
  FiBarChart, FiDollarSign, FiSettings, FiSearch, FiFilter,
  FiEdit, FiTrash2, FiPlus, FiEye, FiLock, FiUnlock, FiPercent
} from 'react-icons/fi';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login: string;
  total_referrals: number;
  active_referrals: number;
  total_commission: number;
  this_month_commission: number;
  commission_rate: number;
  level: number;
  total_volume: number;
}

export default function AffiliatesManagementStandalone() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<Affiliate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [affiliatesPerPage] = useState(10);

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
        await loadAffiliates();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAffiliates(data.affiliates || []);
        setFilteredAffiliates(data.affiliates || []);
      } else {
        // Dados mock em caso de erro
        const mockAffiliates: Affiliate[] = [
          {
            id: '1',
            name: 'Maria Santos',
            email: 'maria@coinbitclub.com',
            phone: '(11) 99999-2222',
            country: 'BR',
            is_active: true,
            is_email_verified: true,
            created_at: '2025-01-18T14:30:00Z',
            last_login: '2025-01-25T09:15:00Z',
            total_referrals: 15,
            active_referrals: 12,
            total_commission: 2450.75,
            this_month_commission: 450.30,
            commission_rate: 1.5,
            level: 2,
            total_volume: 24507.50
          },
          {
            id: '2',
            name: 'Pedro Almeida',
            email: 'pedro@coinbitclub.com',
            phone: '(11) 99999-5555',
            country: 'BR',
            is_active: true,
            is_email_verified: false,
            created_at: '2025-01-19T11:30:00Z',
            last_login: '2025-01-25T06:20:00Z',
            total_referrals: 8,
            active_referrals: 6,
            total_commission: 1280.40,
            this_month_commission: 280.15,
            commission_rate: 1.5,
            level: 1,
            total_volume: 16005.00
          },
          {
            id: '3',
            name: 'Ana Costa',
            email: 'ana.costa@coinbitclub.com',
            phone: '(11) 99999-7777',
            country: 'BR',
            is_active: false,
            is_email_verified: true,
            created_at: '2025-01-10T16:45:00Z',
            last_login: '2025-01-20T11:20:00Z',
            total_referrals: 3,
            active_referrals: 1,
            total_commission: 189.25,
            this_month_commission: 0.00,
            commission_rate: 1.5,
            level: 1,
            total_volume: 3785.00
          },
          {
            id: '4',
            name: 'Carlos Rodrigues',
            email: 'carlos.r@coinbitclub.com',
            phone: '(11) 99999-8888',
            country: 'BR',
            is_active: true,
            is_email_verified: true,
            created_at: '2025-01-22T09:00:00Z',
            last_login: '2025-01-25T10:45:00Z',
            total_referrals: 25,
            active_referrals: 22,
            total_commission: 4890.80,
            this_month_commission: 890.50,
            commission_rate: 1.5,
            level: 3,
            total_volume: 40756.67
          }
        ];
        setAffiliates(mockAffiliates);
        setFilteredAffiliates(mockAffiliates);
      }
    } catch (error) {
      console.error('Erro ao carregar afiliados:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterAffiliates(term, filterType);
  };

  const handleFilter = (type: string) => {
    setFilterType(type);
    filterAffiliates(searchTerm, type);
  };

  const filterAffiliates = (search: string, type: string) => {
    let filtered = affiliates;

    if (search) {
      filtered = filtered.filter(affiliate => 
        affiliate.name.toLowerCase().includes(search.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== 'all') {
      filtered = filtered.filter(affiliate => {
        switch (type) {
          case 'active': return affiliate.is_active;
          case 'inactive': return !affiliate.is_active;
          case 'verified': return affiliate.is_email_verified;
          case 'unverified': return !affiliate.is_email_verified;
          case 'level1': return affiliate.level === 1;
          case 'level2': return affiliate.level === 2;
          case 'level3': return affiliate.level === 3;
          default: return true;
        }
      });
    }

    setFilteredAffiliates(filtered);
    setCurrentPage(1);
  };

  const handleAffiliateAction = async (affiliateId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadAffiliates();
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

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#4A9EDB';
      case 2: return '#E6C200';
      case 3: return '#BA55D3';
      default: return '#95A5A6';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#2ECC71' : '#E74C3C';
  };

  // Paginação
  const indexOfLastAffiliate = currentPage * affiliatesPerPage;
  const indexOfFirstAffiliate = indexOfLastAffiliate - affiliatesPerPage;
  const currentAffiliates = filteredAffiliates.slice(indexOfFirstAffiliate, indexOfLastAffiliate);
  const totalPages = Math.ceil(filteredAffiliates.length / affiliatesPerPage);

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
    { name: 'Gestão de Usuários', href: '/admin/users', icon: FiUsers },
    { name: 'Gestão de Afiliados', href: '/admin/affiliates', icon: FiUserCheck, active: true },
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
        <div style={{ fontSize: '1.2rem' }}>⚡ Carregando Afiliados...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Afiliados - CoinBitClub Admin</title>
        <meta name="description" content="Gestão de afiliados do CoinBitClub" />
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
              <FiUserCheck size={32} />
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                  Gestão de Afiliados
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', opacity: 0.8 }}>
                  Gerencie todos os afiliados da plataforma
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(74, 158, 219, 0.2), rgba(74, 158, 219, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(74, 158, 219, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiUsers color="#4A9EDB" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Total Afiliados</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {filteredAffiliates.length}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(46, 204, 113, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(46, 204, 113, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiTrendingUp color="#2ECC71" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Ativos</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {filteredAffiliates.filter(a => a.is_active).length}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(230, 194, 0, 0.2), rgba(230, 194, 0, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(230, 194, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiDollarSign color="#E6C200" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Comissões Total</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {formatCurrency(filteredAffiliates.reduce((sum, a) => sum + a.total_commission, 0))}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(186, 85, 211, 0.2), rgba(186, 85, 211, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(186, 85, 211, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiPercent color="#BA55D3" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Este Mês</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {formatCurrency(filteredAffiliates.reduce((sum, a) => sum + a.this_month_commission, 0))}
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
                  <option value="verified">Verificados</option>
                  <option value="unverified">Não Verificados</option>
                  <option value="level1">Nível 1</option>
                  <option value="level2">Nível 2</option>
                  <option value="level3">Nível 3</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                Mostrando {currentAffiliates.length} de {filteredAffiliates.length} afiliados
              </span>
              <button
                onClick={() => handleAffiliateAction('new', 'create')}
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
                <FiPlus /> Novo Afiliado
              </button>
            </div>
          </div>

          {/* Tabela de Afiliados */}
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
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Afiliado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Nível</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Indicações</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Comissões</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Volume</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Último Login</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAffiliates.map((affiliate, index) => (
                    <tr key={affiliate.id} style={{ 
                      borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.25rem' }}>{affiliate.name}</div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.85rem' }}>{affiliate.email}</div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>{affiliate.phone}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: getLevelColor(affiliate.level),
                          color: '#FFFFFF',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          Nível {affiliate.level}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: getStatusColor(affiliate.is_active)
                          }}></div>
                          <span style={{ color: getStatusColor(affiliate.is_active), fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {affiliate.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                            {affiliate.total_referrals} Total
                          </div>
                          <div style={{ color: '#5CB85C', fontSize: '0.85rem' }}>
                            {affiliate.active_referrals} Ativos
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            {formatCurrency(affiliate.total_commission)}
                          </div>
                          <div style={{ color: '#E6C200', fontSize: '0.85rem' }}>
                            Este mês: {formatCurrency(affiliate.this_month_commission)}
                          </div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>
                            Taxa: {affiliate.commission_rate}%
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#FFFFFF', fontWeight: 'bold' }}>
                        {formatCurrency(affiliate.total_volume)}
                      </td>
                      <td style={{ padding: '1rem', color: '#B0B3B8', fontSize: '0.85rem' }}>
                        {formatDate(affiliate.last_login)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAffiliateAction(affiliate.id, 'view')}
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
                            onClick={() => handleAffiliateAction(affiliate.id, 'edit')}
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
                            onClick={() => handleAffiliateAction(affiliate.id, affiliate.is_active ? 'deactivate' : 'activate')}
                            style={{
                              background: affiliate.is_active 
                                ? 'rgba(217, 83, 79, 0.2)' 
                                : 'rgba(92, 184, 92, 0.2)',
                              border: affiliate.is_active 
                                ? '1px solid rgba(217, 83, 79, 0.3)' 
                                : '1px solid rgba(92, 184, 92, 0.3)',
                              color: affiliate.is_active ? '#D9534F' : '#5CB85C',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title={affiliate.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {affiliate.is_active ? <FiLock size={14} /> : <FiUnlock size={14} />}
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
