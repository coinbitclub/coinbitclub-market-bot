import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Activity,
  Wallet,
  Settings,
  User,
  Key,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  Phone,
  Mail,
  Moon,
  Sun,
  Globe
} from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'basic' | 'premium' | 'pro';
  balance: number;
  status: 'active' | 'inactive' | 'suspended';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock user data - in production this would come from auth context
  const user: User = {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    avatar: '',
    plan: 'premium',
    balance: 25847.50,
    status: 'active'
  };

  // Mock notifications
  const mockNotifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Operação Concluída',
      message: 'Compra de BTC/USDT executada com sucesso',
      type: 'success',
      timestamp: '2025-07-28T10:30:00Z',
      read: false
    },
    {
      id: '2',
      title: 'API Rate Limit',
      message: 'Aproximando do limite de requisições',
      type: 'warning',
      timestamp: '2025-07-28T09:20:00Z',
      read: false
    },
    {
      id: '3',
      title: 'Novo Sistema IA',
      message: 'IA Águia 2.0 disponível para ativação',
      type: 'info',
      timestamp: '2025-07-28T08:00:00Z',
      read: true
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/user/dashboard',
      icon: LayoutDashboard,
      current: router.pathname === '/user/dashboard'
    },
    {
      name: 'Operações',
      href: '/user/operations',
      icon: Activity,
      current: router.pathname === '/user/operations'
    },
    {
      name: 'Saldo & Transações',
      href: '/user/balance',
      icon: Wallet,
      current: router.pathname === '/user/balance'
    },
    {
      name: 'API Keys',
      href: '/user/api-keys',
      icon: Key,
      current: router.pathname === '/user/api-keys'
    },
    {
      name: 'Perfil',
      href: '/user/profile',
      icon: User,
      current: router.pathname === '/user/profile'
    },
    {
      name: 'Configurações',
      href: '/user/settings',
      icon: Settings,
      current: router.pathname === '/user/settings'
    },
    {
      name: 'Suporte',
      href: '/user/support',
      icon: HelpCircle,
      current: router.pathname === '/user/support'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-600';
      case 'premium': return 'bg-yellow-600';
      case 'pro': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const handleLogout = () => {
    // In production, this would handle actual logout
    router.push('/login');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gradient-to-br from-gray-900 to-black' : 'bg-gray-50'}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-black/90 backdrop-blur-sm border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">CB</span>
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                CoinBit Club
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-yellow-600 text-black font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
                <Badge className={`${getPlanBadgeColor(user.plan)} text-white text-xs mt-1`}>
                  {user.plan.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 rounded-lg border border-yellow-400/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Saldo Total</span>
                <DollarSign className="h-4 w-4 text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-yellow-400">
                {formatCurrency(user.balance)}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-yellow-600 text-black'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}>
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-800">
            <div className="space-y-2">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Iniciar Trading
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                <Zap className="h-4 w-4 mr-2" />
                IA Águia
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className={`sticky top-0 z-30 ${darkMode ? 'bg-black/80 backdrop-blur-sm border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex h-16 items-center justify-between px-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search and breadcrumb area */}
            <div className="flex-1 flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-400">
                <span>Usuário</span>
                <span>/</span>
                <span className="text-white font-medium">
                  {navigation.find(item => item.current)?.name || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="hidden md:flex"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-xs p-0 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 mr-4">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex-col items-start p-4 cursor-pointer"
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex w-full items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-400'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-blue-400 hover:text-blue-300">
                    Ver todas as notificações
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-yellow-600 text-black font-bold text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/user/profile">
                      <a className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/user/settings">
                      <a className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/user/api-keys">
                      <a className="flex items-center">
                        <Key className="mr-2 h-4 w-4" />
                        API Keys
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/user/support">
                      <a className="flex items-center">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Suporte
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Status bar */}
        <div className={`${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-100 border-t border-gray-200'} px-6 py-2`}>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Conexão Segura</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>API: Conectado</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span>Última atualização: {new Date().toLocaleTimeString()}</span>
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
