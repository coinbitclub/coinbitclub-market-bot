import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalculatorIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  BellAlertIcon,
  CheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import NotificationContainer from './NotificationContainer';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Administração' }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard-connected',
      icon: ChartBarIcon,
      description: 'Painel principal com análise em tempo real',
      current: router.pathname === '/admin/dashboard-connected' || router.pathname === '/admin'
    },
    {
      name: 'Alertas',
      href: '/admin/alertas',
      icon: BellAlertIcon,
      description: 'Problemas críticos e solicitações pendentes',
      current: router.pathname === '/admin/alertas'
    },
    {
      name: 'Operações',
      href: '/admin/operacoes',
      icon: ArrowTrendingUpIcon,
      description: 'Histórico de trades e operações',
      current: router.pathname === '/admin/operacoes'
    },
    {
      name: 'Acertos',
      href: '/admin/acertos',
      icon: CheckIcon,
      description: 'Pedidos de reembolso e acertos pendentes',
      current: router.pathname === '/admin/acertos'
    },
    {
      name: 'Contabilidade',
      href: '/admin/contabilidade',
      icon: CalculatorIcon,
      description: 'Relatórios financeiros e receitas',
      current: router.pathname === '/admin/contabilidade'
    },
    {
      name: 'Despesas',
      href: '/admin/despesas',
      icon: CurrencyDollarIcon,
      description: 'Gestão de despesas operacionais',
      current: router.pathname === '/admin/despesas'
    },
    {
      name: 'Logs',
      href: '/admin/logs',
      icon: DocumentTextIcon,
      description: 'Logs do sistema',
      current: router.pathname === '/admin/logs'
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: UsersIcon,
      description: 'Gestão completa de usuários',
      current: router.pathname === '/admin/users'
    },
    {
      name: 'Afiliados',
      href: '/admin/affiliates',
      icon: UserGroupIcon,
      description: 'Gestão do programa de afiliados',
      current: router.pathname === '/admin/affiliates'
    },
    {
      name: 'Config Sistema',
      href: '/admin/configuracoes',
      icon: Cog6ToothIcon,
      description: 'Configurações do sistema',
      current: router.pathname === '/admin/configuracoes'
    }
  ];

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0b 25%, #1a1a1c 50%, #0a0a0b 75%, #000000 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
  };

  const headerStyle = {
    background: 'rgba(0, 0, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    padding: '1rem 0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    textDecoration: 'none',
  };

  const menuStyle = {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  };

  const menuItemStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    textDecoration: 'none',
    color: isActive ? '#FFD700' : '#B0B3B8',
    background: isActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
    border: isActive ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
    transition: 'all 0.3s ease',
    fontSize: '0.875rem',
    fontWeight: isActive ? '600' : '400',
    whiteSpace: 'nowrap' as const,
  });

  const userAreaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const userInfoStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    fontSize: '0.75rem',
  };

  const logoutButtonStyle = {
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    borderRadius: '6px',
    padding: '0.5rem',
    color: '#ff6b6b',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const mainContentStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <nav style={navStyle}>
          <Link href="/admin/dashboard-connected" style={logoStyle}>
            ⚡ CoinBitClub Admin
          </Link>
          
          <div style={menuStyle}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={menuItemStyle(item.current)}
                >
                  <Icon style={{ width: '16px', height: '16px' }} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div style={userAreaStyle}>
            {user && (
              <div style={userInfoStyle}>
                <div style={{ color: '#FFD700', fontWeight: '600' }}>{user.name}</div>
                <div style={{ color: '#B0B3B8' }}>{user.email}</div>
              </div>
            )}
            <button
              onClick={logout}
              style={logoutButtonStyle}
              title="Sair"
            >
              <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </nav>
      </header>

      <main style={mainContentStyle}>
        {children}
      </main>

      {/* Sistema de Notificações */}
      <NotificationContainer />
    </div>
  );
};

export default AdminLayout;


