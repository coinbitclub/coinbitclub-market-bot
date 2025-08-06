import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
}

interface NavigationItem {
  label: string;
  icon: string;
  href: string;
  roles?: string[];
  badge?: string | number;
}

const PremiumLayout: React.FC<LayoutProps> = ({ 
  children, 
  title = "CoinBitClub MarketBot",
  requireAuth = true 
}) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar horário a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Verificar autenticação
  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [requireAuth, isAuthenticated, router]);

  // Configuração de navegação baseada no role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { label: 'Dashboard', icon: '📊', href: '/dashboard' },
      { label: 'Operações', icon: '⚡', href: '/operations' },
      { label: 'Configurações', icon: '⚙️', href: '/settings' },
    ];

    const roleItems: Record<string, NavigationItem[]> = {
      admin: [
        { label: 'Admin Dashboard', icon: '👑', href: '/admin/dashboard' },
        { label: 'Usuários', icon: '👥', href: '/admin/users' },
        { label: 'Relatórios', icon: '📈', href: '/admin/reports' },
        { label: 'Sistema', icon: '🔧', href: '/admin/system' },
      ],
      affiliate: [
        { label: 'Afiliados', icon: '🤝', href: '/affiliate/dashboard' },
        { label: 'Comissões', icon: '💰', href: '/affiliate/commissions' },
        { label: 'Indicações', icon: '👨‍👩‍👧‍👦', href: '/affiliate/referrals' },
      ],
      operator: [
        { label: 'Operações', icon: '🎯', href: '/operator/dashboard' },
        { label: 'Monitoramento', icon: '📡', href: '/operator/monitoring' },
      ],
      manager: [
        { label: 'Gestão', icon: '📋', href: '/manager/dashboard' },
        { label: 'Equipe', icon: '👥', href: '/manager/team' },
      ],
    };

    const userRoleItems = user?.role ? roleItems[user.role] || [] : [];
    return [...userRoleItems, ...baseItems];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-auto
      `}>
        <div className="h-full bg-white/5 backdrop-blur-xl border-r border-white/10">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-black font-bold">
                ₿
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">CoinBitClub</h1>
                <p className="text-xs text-gray-400">MarketBot Premium</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {user?.role || 'user'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = router.pathname === item.href || 
                              (item.href !== '/' && router.pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 text-yellow-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Time Display */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-white text-sm font-mono">
                {currentTime.toLocaleTimeString('pt-BR')}
              </div>
              <div className="text-gray-400 text-xs">
                {currentTime.toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page Title */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-white truncate">
                  {title}
                </h1>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400 hidden sm:inline">Online</span>
                </div>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                  <span className="text-lg">🔔</span>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 p-2 text-gray-400 hover:text-white transition-colors"
                    title="Sair"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="hidden sm:inline text-sm">Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              © 2025 CoinBitClub. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-4">
              <span>v3.0.0</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Sistema Operacional</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PremiumLayout;


