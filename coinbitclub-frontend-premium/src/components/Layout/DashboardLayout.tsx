import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Navegação baseada no tipo de usuário
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    ];

    switch (user.user_type) {
      case 'admin':
        return [
          ...baseItems,
          { name: 'Gestão de Usuários', href: '/admin/users', icon: FiUsers },
          { name: 'Gestão de Afiliados', href: '/admin/affiliates', icon: FiUserCheck },
          { name: 'Operações', href: '/admin/operations', icon: FiActivity },
          { name: 'Alertas', href: '/admin/alerts', icon: FiAlertTriangle },
          { name: 'Acertos', href: '/admin/adjustments', icon: FiDollarSign },
          { name: 'Contabilidade', href: '/admin/accounting', icon: FiBarChart },
          { name: 'Configurações', href: '/admin/settings', icon: FiSettings },
        ];

      case 'affiliate':
        return [
          ...baseItems,
          { name: 'Operações', href: '/affiliate/operations', icon: FiActivity },
          { name: 'Planos', href: '/affiliate/plans', icon: FiCreditCard },
          { name: 'Gestão de Indicados', href: '/affiliate/referrals', icon: FiUsers },
          { name: 'Comissões', href: '/affiliate/commissions', icon: FiDollarSign },
          { name: 'Configurações', href: '/affiliate/settings', icon: FiSettings },
        ];

      case 'user':
      default:
        return [
          ...baseItems,
          { name: 'Operações', href: '/user/operations', icon: FiActivity },
          { name: 'Planos', href: '/user/plans', icon: FiCreditCard },
          { name: 'Configurações', href: '/user/settings', icon: FiSettings },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const getUserTypeLabel = () => {
    switch (user.user_type) {
      case 'admin': return 'Administrador';
      case 'affiliate': return 'Afiliado';
      case 'user': return 'Usuário';
      default: return 'Usuário';
    }
  };

  const getUserTypeColor = () => {
    switch (user.user_type) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'affiliate': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <img
                className="h-8 w-auto"
                src="/logo.png"
                alt="CoinBitClub"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">CoinBitClub</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-4 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">{user.name}</p>
                <p className="text-sm font-medium text-gray-500">{getUserTypeLabel()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img
                className="h-8 w-auto"
                src="/logo.png"
                alt="CoinBitClub"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">CoinBitClub</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigationItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor()}`}>
                  {getUserTypeLabel()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
                title="Logout"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>
        </div>

        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {router.pathname === '/dashboard' ? 'Dashboard' : 
                   router.pathname.includes('/admin') ? 'Administração' :
                   router.pathname.includes('/affiliate') ? 'Área do Afiliado' :
                   'Área do Usuário'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleString('pt-BR')}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Sistema Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


