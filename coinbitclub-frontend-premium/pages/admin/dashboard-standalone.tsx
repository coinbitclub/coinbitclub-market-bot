import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiHome, 
  FiUsers, 
  FiBarChart, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUserCheck,
  FiDollarSign,
  FiActivity,
  FiAlertTriangle,
  FiCreditCard,
  FiTrendingUp,
  FiDatabase
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'user' | 'affiliate';
}

const AdminDashboardStandalone = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
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
        <div style={{ fontSize: '1.2rem' }}>⚡ Carregando Dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
    { name: 'Dashboard Executivo', href: '/admin/dashboard-executive', icon: FiBarChart },
    { name: 'Gestão de Usuários', href: '/admin/users', icon: FiUsers },
    { name: 'Gestão de Afiliados', href: '/admin/affiliates', icon: FiUserCheck },
    { name: 'Operações', href: '/admin/operations', icon: FiTrendingUp },
    { name: 'Alertas', href: '/admin/alerts', icon: FiAlertTriangle },
    { name: 'Acertos', href: '/admin/acertos', icon: FiBarChart },
    { name: 'Contabilidade', href: '/admin/accounting', icon: FiDollarSign },
    { name: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ];

  return (
    <>
      <Head>
        <title>Dashboard Admin - CoinBitClub</title>
        <meta name="description" content="Dashboard administrativo do CoinBitClub" />
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
          {/* Logo */}
          <div style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid #333333',
            background: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ⚡ CoinBitClub
              </span>
            </div>
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#000',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🎯 PAINEL ADMIN
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1rem 0' }}>
            {navigationItems.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    color: isActive ? '#FFD700' : '#B0B3B8',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))'
                      : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    borderLeft: isActive ? '4px solid #FFD700' : '4px solid transparent',
                    borderRadius: isActive ? '0 12px 12px 0' : '0'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 191, 255, 0.05))';
                      e.currentTarget.style.color = '#00BFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#B0B3B8';
                    }
                  }}
                >
                  <Icon style={{ marginRight: '0.75rem', width: '1.25rem', height: '1.25rem' }} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div style={{ 
            padding: '1.5rem', 
            borderTop: '1px solid #333333',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#B0B3B8', margin: 0 }}>Logado como:</p>
              <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#FFFFFF' }}>{user.name}</p>
              <p style={{ fontSize: '0.75rem', color: '#B0B3B8', margin: 0 }}>{user.email}</p>
              <span style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                padding: '0.25rem 0.75rem',
                background: 'linear-gradient(135deg, #FF69B4, #FF1493)',
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                👑 Administrador
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '0.75rem',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, rgba(255, 69, 58, 0.2), rgba(255, 69, 58, 0.1))',
                border: '1px solid rgba(255, 69, 58, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 69, 58, 0.3), rgba(255, 69, 58, 0.2))';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 69, 58, 0.2), rgba(255, 69, 58, 0.1))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FiLogOut style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
              Sair do Sistema
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ marginLeft: '280px', flex: 1, padding: '2rem' }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000', 
            padding: '2rem', 
            borderRadius: '16px', 
            marginBottom: '2rem',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <h1 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '2.5rem', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              🎯 Bem-vindo, {user.name}
            </h1>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', opacity: 0.8 }}>
              Dashboard Administrativo - CoinBitClub
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #00BFFF, #0099CC)',
              color: '#FFFFFF',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0, 191, 255, 0.3)'
            }}>
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                backgroundColor: '#00FF00',
                borderRadius: '50%',
                marginRight: '0.75rem',
                animation: 'pulse 2s infinite'
              }}></div>
              ✅ SISTEMA ONLINE E OPERACIONAL
            </div>
          </div>

          {/* Cards de Métricas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            {/* Card 1 - Total de Usuários */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid rgba(255, 215, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#B0B3B8', fontSize: '0.875rem' }}>Total de Usuários</p>
                  <p style={{ margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#FFD700' }}>1,247</p>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 215, 0, 0.3)'
                }}>
                  <FiUsers style={{ width: '2rem', height: '2rem', color: '#FFD700' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  color: '#00BFFF', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(0, 191, 255, 0.1))',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 191, 255, 0.3)'
                }}>
                  +23
                </span>
                <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>novos hoje</span>
              </div>
            </div>

            {/* Card 2 - Usuários Ativos */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 191, 255, 0.05))',
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid rgba(0, 191, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#B0B3B8', fontSize: '0.875rem' }}>Usuários Ativos</p>
                  <p style={{ margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#00BFFF' }}>892</p>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(0, 191, 255, 0.1))', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 191, 255, 0.3)'
                }}>
                  <FiActivity style={{ width: '2rem', height: '2rem', color: '#00BFFF' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}>
                    456
                  </span>
                  <span style={{ color: '#B0B3B8', fontSize: '0.75rem' }}>teste</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: '#00FF7F', 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.2), rgba(0, 255, 127, 0.1))',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}>
                    436
                  </span>
                  <span style={{ color: '#B0B3B8', fontSize: '0.75rem' }}>produção</span>
                </div>
              </div>
            </div>

            {/* Card 3 - Precisão Diária */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 105, 180, 0.05))',
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid rgba(255, 105, 180, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#B0B3B8', fontSize: '0.875rem' }}>Precisão Diária</p>
                  <p style={{ margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#FF69B4' }}>78.5%</p>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 105, 180, 0.1))', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 105, 180, 0.3)'
                }}>
                  <FiBarChart style={{ width: '2rem', height: '2rem', color: '#FF69B4' }} />
                </div>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.15), rgba(255, 105, 180, 0.08))',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 105, 180, 0.2)'
              }}>
                <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Histórico: </span>
                <span style={{ color: '#FF69B4', fontWeight: 'bold' }}>73.2%</span>
              </div>
            </div>

            {/* Card 4 - Retorno Diário */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.1), rgba(0, 255, 127, 0.05))',
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid rgba(0, 255, 127, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#B0B3B8', fontSize: '0.875rem' }}>Retorno Diário</p>
                  <p style={{ margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#00FF7F' }}>+2.4%</p>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.2), rgba(0, 255, 127, 0.1))', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 255, 127, 0.3)'
                }}>
                  <FiDollarSign style={{ width: '2rem', height: '2rem', color: '#00FF7F' }} />
                </div>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.15), rgba(0, 255, 127, 0.08))',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(0, 255, 127, 0.2)'
              }}>
                <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Histórico: </span>
                <span style={{ color: '#00FF7F', fontWeight: 'bold' }}>+15.7%</span>
              </div>
            </div>
          </div>

          {/* Relatórios de IA */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.03), rgba(255, 215, 0, 0.01))',
            padding: '2rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(255, 215, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.75rem', 
              fontWeight: 'bold', 
              color: '#E6C200',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              🤖 Relatórios da Inteligência Artificial
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Análise de Sinais */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 215, 0, 0.02))',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 215, 0, 0.15)'
              }}>
                <h3 style={{ color: '#D4AF37', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                  📊 Análise de Sinais (Últimas 24h)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Sinais Processados:</span>
                    <span style={{ color: '#4A9EDB', fontWeight: 'bold' }}>2,847</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Precisão Média:</span>
                    <span style={{ color: '#5CB85C', fontWeight: 'bold' }}>78.5%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Operações Executadas:</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>156</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Taxa de Sucesso:</span>
                    <span style={{ color: '#5CB85C', fontWeight: 'bold' }}>82.3%</span>
                  </div>
                </div>
              </div>

              {/* Padrões de Mercado */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.05), rgba(0, 191, 255, 0.02))',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(0, 191, 255, 0.15)'
              }}>
                <h3 style={{ color: '#4A9EDB', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                  🧠 Padrões Identificados
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(92, 184, 92, 0.1), rgba(92, 184, 92, 0.05))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(92, 184, 92, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5CB85C', fontWeight: 'bold' }}>Bullish Divergence</span>
                      <span style={{ color: '#5CB85C', fontSize: '0.875rem' }}>BTC/USDT</span>
                    </div>
                    <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Confiança: 94%</span>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>Support Break</span>
                      <span style={{ color: '#D4AF37', fontSize: '0.875rem' }}>ETH/USDT</span>
                    </div>
                    <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Confiança: 87%</span>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(186, 85, 211, 0.1), rgba(186, 85, 211, 0.05))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(186, 85, 211, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#BA55D3', fontWeight: 'bold' }}>Volume Spike</span>
                      <span style={{ color: '#BA55D3', fontSize: '0.875rem' }}>ADA/USDT</span>
                    </div>
                    <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Confiança: 91%</span>
                  </div>
                </div>
              </div>

              {/* Performance da IA */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(186, 85, 211, 0.05), rgba(186, 85, 211, 0.02))',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(186, 85, 211, 0.15)'
              }}>
                <h3 style={{ color: '#BA55D3', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                  ⚡ Performance da IA
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Tempo de Resposta:</span>
                    <span style={{ color: '#5CB85C', fontWeight: 'bold' }}>12ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>CPU Usage:</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>34%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>GPU Usage:</span>
                    <span style={{ color: '#4A9EDB', fontWeight: 'bold' }}>67%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Modelo Ativo:</span>
                    <span style={{ color: '#BA55D3', fontWeight: 'bold' }}>v3.2.1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Últimas Decisões da IA */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))',
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(255, 215, 0, 0.15)'
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 215, 0, 0.04))',
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 215, 0, 0.15)'
              }}>
                <h3 style={{ color: '#D4AF37', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                  🎯 Últimas Decisões da IA (Tempo Real)
                </h3>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { time: '10:35:42', action: 'BUY', symbol: 'BTC/USDT', confidence: '96%', reason: 'RSI Oversold + Volume Spike' },
                    { time: '10:32:18', action: 'SELL', symbol: 'ETH/USDT', confidence: '89%', reason: 'Resistance Level Reached' },
                    { time: '10:28:55', action: 'HOLD', symbol: 'ADA/USDT', confidence: '78%', reason: 'Sideways Movement Detected' },
                    { time: '10:25:33', action: 'BUY', symbol: 'DOT/USDT', confidence: '91%', reason: 'Bullish Flag Pattern' }
                  ].map((decision, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          color: '#B0B3B8', 
                          fontSize: '0.875rem',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px'
                        }}>
                          {decision.time}
                        </span>
                        <span style={{ 
                          background: decision.action === 'BUY' 
                            ? 'linear-gradient(135deg, #5CB85C, #4A9E4A)' 
                            : decision.action === 'SELL'
                            ? 'linear-gradient(135deg, #D9534F, #C9302C)'
                            : 'linear-gradient(135deg, #D4AF37, #B8941F)',
                          color: '#000',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          {decision.action}
                        </span>
                        <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{decision.symbol}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          color: '#4A9EDB', 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, rgba(74, 158, 219, 0.15), rgba(74, 158, 219, 0.08))',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          {decision.confidence}
                        </span>
                        <span style={{ color: '#B0B3B8', fontSize: '0.875rem', maxWidth: '200px' }}>
                          {decision.reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Relatórios do Sistema */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.03), rgba(0, 191, 255, 0.01))',
            padding: '2rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(0, 191, 255, 0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.75rem', 
              fontWeight: 'bold', 
              color: '#4A9EDB',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              📋 Relatórios do Sistema
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Logs do Sistema */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.05), rgba(0, 191, 255, 0.02))',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(0, 191, 255, 0.15)'
              }}>
                <h3 style={{ color: '#4A9EDB', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                  📝 Logs do Sistema (Últimas 6h)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {[
                    { time: '10:35', level: 'INFO', message: 'IA Model v3.2.1 loaded successfully' },
                    { time: '10:30', level: 'SUCCESS', message: 'BTC/USDT order executed: +$45.50' },
                    { time: '10:25', level: 'WARNING', message: 'High volatility detected on ETH/USDT' },
                    { time: '10:20', level: 'INFO', message: 'Database backup completed' },
                    { time: '10:15', level: 'SUCCESS', message: 'Connection to Binance API restored' },
                    { time: '10:10', level: 'INFO', message: 'Signal processor restarted' }
                  ].map((log, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ color: '#B0B3B8', minWidth: '40px' }}>{log.time}</span>
                      <span style={{ 
                        color: log.level === 'SUCCESS' ? '#5CB85C' 
                              : log.level === 'WARNING' ? '#D4AF37' 
                              : log.level === 'ERROR' ? '#D9534F' 
                              : '#4A9EDB',
                        fontWeight: 'bold',
                        minWidth: '70px'
                      }}>
                        {log.level}
                      </span>
                      <span style={{ color: '#FFFFFF' }}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Métricas de Performance */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(92, 184, 92, 0.05), rgba(92, 184, 92, 0.02))',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(92, 184, 92, 0.15)'
              }}>
                <h3 style={{ color: '#5CB85C', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                  ⚡ Métricas de Performance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Uptime:</span>
                    <span style={{ color: '#5CB85C', fontWeight: 'bold' }}>99.97%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Latência Média:</span>
                    <span style={{ color: '#4A9EDB', fontWeight: 'bold' }}>8ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>RAM Usage:</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>2.1GB / 8GB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Disk Usage:</span>
                    <span style={{ color: '#BA55D3', fontWeight: 'bold' }}>45.2GB / 100GB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#B0B3B8' }}>Network I/O:</span>
                    <span style={{ color: '#4A9EDB', fontWeight: 'bold' }}>1.2MB/s</span>
                  </div>
                </div>
              </div>

              {/* Alertas e Notificações */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(186, 85, 211, 0.05), rgba(186, 85, 211, 0.02))',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(186, 85, 211, 0.15)'
              }}>
                <h3 style={{ color: '#BA55D3', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                  🚨 Alertas e Notificações
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(92, 184, 92, 0.1), rgba(92, 184, 92, 0.05))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(92, 184, 92, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5CB85C', fontWeight: 'bold' }}>✅ Sistema Estável</span>
                      <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Agora</span>
                    </div>
                    <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Todos os serviços operacionais</span>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>⚠️ Alta Volatilidade</span>
                      <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>5min atrás</span>
                    </div>
                    <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>ETH/USDT com volatilidade elevada</span>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(74, 158, 219, 0.1), rgba(74, 158, 219, 0.05))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(74, 158, 219, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4A9EDB', fontWeight: 'bold' }}>ℹ️ Backup Realizado</span>
                      <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>15min atrás</span>
                    </div>
                    <span style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Backup automático concluído</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 191, 255, 0.05))',
            padding: '2rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(0, 191, 255, 0.2)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.75rem', 
              fontWeight: 'bold', 
              color: '#00BFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              🔧 Status dos Microserviços
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {[
                { name: 'Signal Ingestor', status: 'online', update: '10:35' },
                { name: 'Signal Processor', status: 'online', update: '10:35' },
                { name: 'Decision Engine', status: 'online', update: '10:34' },
                { name: 'Order Executor', status: 'online', update: '10:35' }
              ].map((service) => (
                <div key={service.name} style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.15), rgba(0, 255, 127, 0.08))',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 255, 127, 0.3)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ 
                      fontWeight: '600', 
                      color: '#FFFFFF', 
                      margin: 0,
                      fontSize: '1rem'
                    }}>
                      {service.name}
                    </h3>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #00FF7F, #00CC66)',
                      padding: '0.5rem', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 255, 127, 0.3)'
                    }}>
                      <FiActivity style={{ width: '1rem', height: '1rem', color: '#000' }} />
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.2), rgba(0, 255, 127, 0.1))',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 127, 0.3)'
                  }}>
                    <span style={{ 
                      color: '#00FF7F', 
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '0.375rem',
                        height: '0.375rem',
                        backgroundColor: '#00FF7F',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      ONLINE
                    </span>
                    <span style={{ 
                      color: '#B0B3B8', 
                      fontSize: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      {service.update}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operações em Tempo Real */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 105, 180, 0.05))',
            padding: '2rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(255, 105, 180, 0.2)'
          }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.75rem', 
              fontWeight: 'bold', 
              color: '#FF69B4',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              ⚡ Operações em Tempo Real
            </h2>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.2))',
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(255, 105, 180, 0.3)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ 
                      background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 105, 180, 0.1))',
                      borderBottom: '2px solid rgba(255, 105, 180, 0.3)'
                    }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '1rem', 
                        color: '#FF69B4', 
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Símbolo
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '1rem', 
                        color: '#FF69B4', 
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Tipo
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '1rem', 
                        color: '#FF69B4', 
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Exchange
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '1rem', 
                        color: '#FF69B4', 
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Valor
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '1rem', 
                        color: '#FF69B4', 
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        P&L
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '1rem', 
                        color: '#FF69B4', 
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { symbol: 'BTC/USDT', type: 'LONG', exchange: 'Binance', amount: 1000, profit: 45.50, status: 'ATIVA' },
                      { symbol: 'ETH/USDT', type: 'SHORT', exchange: 'Bybit', amount: 500, profit: -12.30, status: 'ATIVA' },
                      { symbol: 'ADA/USDT', type: 'LONG', exchange: 'Binance', amount: 750, profit: 67.80, status: 'FECHADA' }
                    ].map((operation, index) => (
                      <tr key={index} style={{ 
                        borderBottom: '1px solid rgba(255, 105, 180, 0.2)',
                        transition: 'all 0.3s ease'
                      }}>
                        <td style={{ 
                          padding: '1rem', 
                          fontWeight: 'bold', 
                          color: '#FFFFFF',
                          fontSize: '1.1rem'
                        }}>
                          {operation.symbol}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            background: operation.type === 'LONG' 
                              ? 'linear-gradient(135deg, #00FF7F, #00CC66)' 
                              : 'linear-gradient(135deg, #FF6B6B, #FF4757)',
                            color: '#000', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            boxShadow: operation.type === 'LONG' 
                              ? '0 2px 8px rgba(0, 255, 127, 0.3)'
                              : '0 2px 8px rgba(255, 107, 107, 0.3)'
                          }}>
                            {operation.type}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(0, 191, 255, 0.1))',
                            color: '#00BFFF', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            border: '1px solid rgba(0, 191, 255, 0.3)'
                          }}>
                            {operation.exchange}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          fontWeight: 'bold', 
                          color: '#FFD700',
                          fontSize: '1.1rem'
                        }}>
                          ${operation.amount.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          <span style={{
                            color: operation.profit >= 0 ? '#00FF7F' : '#FF6B6B',
                            background: operation.profit >= 0 
                              ? 'linear-gradient(135deg, rgba(0, 255, 127, 0.2), rgba(0, 255, 127, 0.1))'
                              : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1))',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: operation.profit >= 0 
                              ? '1px solid rgba(0, 255, 127, 0.3)'
                              : '1px solid rgba(255, 107, 107, 0.3)'
                          }}>
                            {operation.profit >= 0 ? '+' : ''}${operation.profit.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            background: operation.status === 'ATIVA' 
                              ? 'linear-gradient(135deg, #00BFFF, #0099CC)' 
                              : 'linear-gradient(135deg, rgba(176, 179, 184, 0.3), rgba(176, 179, 184, 0.2))',
                            color: operation.status === 'ATIVA' ? '#FFFFFF' : '#B0B3B8', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            border: operation.status === 'ATIVA' 
                              ? '1px solid rgba(0, 191, 255, 0.3)'
                              : '1px solid rgba(176, 179, 184, 0.3)'
                          }}>
                            {operation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '3rem', 
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(0, 191, 255, 0.05))',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0',
              background: 'linear-gradient(45deg, #FFD700, #00BFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              ✅ Sistema CoinBitClub Funcionando Perfeitamente!
            </h3>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '1rem', 
              color: '#B0B3B8'
            }}>
              Última atualização: {new Date().toLocaleString('pt-BR')} • Versão Admin v2.0
            </p>
            <div style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                color: '#00FF7F',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#00FF7F',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                Todos os sistemas operacionais
              </span>
              <span style={{ 
                color: '#FFD700',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#FFD700',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                IA processando em tempo real
              </span>
              <span style={{ 
                color: '#00BFFF',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#00BFFF',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                Trading automático ativo
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default AdminDashboardStandalone;
