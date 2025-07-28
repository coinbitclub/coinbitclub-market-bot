'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Sheet, SheetContent, SheetDescription, SheetHeader, 
  SheetTitle, SheetTrigger 
} from "@/components/ui/sheet"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Menu, Home, Users, DollarSign, Settings, Activity, 
  Shield, Bell, Search, LogOut, User, Moon, Sun,
  BarChart3, FileText, Database, Zap, AlertTriangle,
  ChevronDown, Crown, Eye
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
  activeSection?: string
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  avatar?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: string
  read: boolean
}

export default function AdminLayout({ children, activeSection = 'dashboard' }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif1',
      title: 'Sistema Online',
      message: 'Todos os serviços operando normalmente',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 'notif2', 
      title: 'Alto Volume de Trading',
      message: 'Volume 150% acima da média nas últimas 2h',
      type: 'info',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: 'notif3',
      title: 'API Binance Lenta',
      message: 'Latência elevada detectada - monitorando',
      type: 'warning',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ])

  const [currentAdmin] = useState<AdminUser>({
    id: 'admin_001',
    name: 'João Administrador',
    email: 'admin@coinbitclub.com',
    role: 'super_admin',
    avatar: undefined
  })

  const [systemStats] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    totalRevenue: 45789.32,
    systemUptime: 99.94
  })

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Visão geral do sistema'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      description: 'Gestão de usuários e permissões'
    },
    {
      id: 'financial',
      label: 'Financeiro',
      icon: DollarSign,
      description: 'Relatórios e análises financeiras'
    },
    {
      id: 'monitoring',
      label: 'Monitoramento',
      icon: Activity,
      description: 'Status do sistema em tempo real'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      description: 'Analytics e relatórios detalhados'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ]

  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleNavigation = (sectionId: string) => {
    console.log(`Navegando para: ${sectionId}`)
    setSidebarOpen(false)
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'moderator': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Administrador'
      case 'moderator': return 'Moderador'
      default: return 'Usuário'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success': return <Zap className="h-4 w-4 text-green-500" />
      default: return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  // Sidebar Component
  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'} bg-background border-r`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">CoinbitClub</h2>
            <p className="text-sm text-muted-foreground">Painel Administrativo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start h-12 ${
                isActive ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => handleNavigation(item.id)}
            >
              <Icon className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                {!mobile && (
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            </Button>
          )
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usuários:</span>
              <span className="font-medium">{systemStats.totalUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ativos:</span>
              <span className="font-medium text-green-600">{systemStats.activeUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime:</span>
              <span className="font-medium text-blue-600">{systemStats.systemUptime}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Top Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 flex-1">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold">Admin</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground capitalize">{activeSection}</span>
              </div>

              {/* Search */}
              <div className="hidden md:flex items-center space-x-4 mr-4">
                <Button variant="outline" size="sm" className="w-64 justify-start text-muted-foreground">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar usuários, relatórios...
                </Button>
              </div>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>
                    Notificações ({unreadNotifications} não lidas)
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex items-start space-x-3 p-3"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-primary rounded-full" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm">
                    Ver todas as notificações
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-2 h-10 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentAdmin.avatar} />
                      <AvatarFallback>
                        {currentAdmin.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block ml-2 text-left">
                      <p className="text-sm font-medium">{currentAdmin.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleLabel(currentAdmin.role)}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentAdmin.name}</p>
                      <p className="text-xs text-muted-foreground">{currentAdmin.email}</p>
                      <Badge className={getRoleColor(currentAdmin.role)}>
                        {getRoleLabel(currentAdmin.role)}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver como Usuário
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="container px-4 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
