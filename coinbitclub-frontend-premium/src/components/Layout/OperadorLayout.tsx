import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../store/authStore';
import { 
  FiHome, 
  FiTrendingUp, 
  FiMonitor, 
  FiActivity, 
  FiBarChart2 as FiBarChart3,
  FiMenu,
  FiX,
  FiLogOut,
  FiBell,
  FiSearch
} from 'react-icons/fi';

interface OperadorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const OperadorLayout: React.FC<OperadorLayoutProps> = ({ children, title = 'Dashboard Operador' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/operador/dashboard', icon: FiHome },
    { name: 'Trading', href: '/operador/trading', icon: FiTrendingUp },
    { name: 'Monitoramento', href: '/operador/monitoring', icon: FiMonitor },
    { name: 'Sinais', href: '/operador/signals', icon: FiActivity },
    { name: 'Performance', href: '/operador/performance', icon: FiBarChart3 },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-900/95 backdrop-blur-sm border-r border-green-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">
              O
            </div>
            <span className="text-white font-bold text-lg">Operador</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-400/20 to-emerald-500/20 text-green-400 border border-green-400/30'
                      : 'text-gray-300 hover:text-white hover:bg-green-800/50'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-green-400' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center font-bold text-white">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'Operador'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-green-800 hover:text-white transition-colors"
          >
            <FiLogOut className="mr-3 h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-green-800 bg-green-900/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 lg:gap-x-6">
            <div className="relative flex flex-1">
              <FiSearch className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
              <input
                className="block h-full w-full border-0 bg-green-800/50 py-0 pl-10 pr-3 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-green-400 sm:text-sm rounded-lg"
                placeholder="Buscar..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="relative p-2 text-gray-400 hover:text-white">
                <FiBell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-gray-400">Operações e monitoramento em tempo real</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OperadorLayout;


