'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import AdminLayout from './admin-layout'
import { 
  Users, UserPlus, Search, Filter, MoreHorizontal, Edit, 
  Trash2, Eye, Shield, Key, CreditCard, Activity,
  UserCheck, UserX, Mail, Phone, Calendar, MapPin,
  DollarSign, TrendingUp, AlertTriangle, Download,
  RefreshCw, Settings, Lock, Unlock
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  country: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  registeredAt: string
  lastLoginAt?: string
  totalTrades: number
  totalRevenue: number
  apiKeysCount: number
  verified: boolean
  twoFactorEnabled: boolean
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  suspendedUsers: number
  totalRevenue: number
  avgRevenuePerUser: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user_001',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      phone: '+55 11 99999-9999',
      country: 'Brasil',
      plan: 'pro',
      status: 'active',
      registeredAt: '2025-01-15T10:30:00Z',
      lastLoginAt: '2025-07-28T08:45:00Z',
      totalTrades: 156,
      totalRevenue: 2456.78,
      apiKeysCount: 3,
      verified: true,
      twoFactorEnabled: true
    },
    {
      id: 'user_002',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      phone: '+55 21 88888-8888',
      country: 'Brasil',
      plan: 'enterprise',
      status: 'active',
      registeredAt: '2024-12-20T14:15:00Z',
      lastLoginAt: '2025-07-27T19:30:00Z',
      totalTrades: 342,
      totalRevenue: 5678.90,
      apiKeysCount: 5,
      verified: true,
      twoFactorEnabled: true
    },
    {
      id: 'user_003',
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@email.com',
      country: 'Portugal',
      plan: 'free',
      status: 'pending',
      registeredAt: '2025-07-27T16:20:00Z',
      totalTrades: 0,
      totalRevenue: 0,
      apiKeysCount: 0,
      verified: false,
      twoFactorEnabled: false
    }
  ])

  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [userStats] = useState<UserStats>({
    totalUsers: 1247,
    activeUsers: 892,
    newUsersToday: 23,
    suspendedUsers: 8,
    totalRevenue: 127543.89,
    avgRevenuePerUser: 142.67
  })

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    plan: 'free' as 'free' | 'pro' | 'enterprise'
  })

  useEffect(() => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    // Filter by plan
    if (planFilter !== 'all') {
      filtered = filtered.filter(user => user.plan === planFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, planFilter])

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simulação de API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const user: User = {
        id: `user_${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        plan: newUser.plan,
        status: 'pending',
        registeredAt: new Date().toISOString(),
        totalTrades: 0,
        totalRevenue: 0,
        apiKeysCount: 0,
        verified: false,
        twoFactorEnabled: false
      }

      setUsers(prev => [user, ...prev])
      setNewUser({ name: '', email: '', phone: '', country: '', plan: 'free' })
      setShowEditDialog(false)
      
      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar usuário",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUserStatus = async (userId: string, newStatus: User['status']) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
      
      toast({
        title: "Sucesso!",
        description: "Status do usuário atualizado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      toast({
        title: "Sucesso!",
        description: "Usuário removido com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover usuário",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <AdminLayout activeSection="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie usuários, permissões e atividades
            </p>
          </div>
          
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Nome do usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+55 11 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={newUser.country}
                    onChange={(e) => setNewUser({...newUser, country: e.target.value})}
                    placeholder="Brasil"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={newUser.plan} onValueChange={(value: any) => setNewUser({...newUser, plan: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="pro">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={isLoading}>
                  {isLoading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{userStats.newUsersToday} hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{userStats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(userStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(userStats.avgRevenuePerUser)} média/usuário
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Suspensos</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{userStats.suspendedUsers}</div>
              <p className="text-xs text-muted-foreground">
                {((userStats.suspendedUsers / userStats.totalUsers) * 100).toFixed(2)}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="pro">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Gerencie todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              {user.verified && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verificado
                                </Badge>
                              )}
                              {user.twoFactorEnabled && (
                                <Badge variant="outline" className="text-xs">
                                  <Key className="h-3 w-3 mr-1" />
                                  2FA
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getPlanColor(user.plan)}>
                          {user.plan === 'free' ? 'Gratuito' :
                           user.plan === 'pro' ? 'Pro' : 'Enterprise'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status === 'active' ? 'Ativo' :
                           user.status === 'inactive' ? 'Inativo' :
                           user.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {user.totalTrades.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.apiKeysCount} API Keys
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(user.totalRevenue)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Registrado: {formatDate(user.registeredAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newStatus = user.status === 'active' ? 'suspended' : 'active'
                              handleUpdateUserStatus(user.id, newStatus)
                            }}
                          >
                            {user.status === 'active' ? 
                              <Lock className="h-4 w-4" /> : 
                              <Unlock className="h-4 w-4" />
                            }
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Informações completas e atividades do usuário
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Geral</TabsTrigger>
                  <TabsTrigger value="activity">Atividade</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <p className="text-sm font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <p className="text-sm font-medium">{selectedUser.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label>País</Label>
                      <p className="text-sm font-medium">{selectedUser.country}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total de Trades</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedUser.totalTrades}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">API Keys</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedUser.apiKeysCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Último Login</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Nunca'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Receita Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(selectedUser.totalRevenue)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Plano Atual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={getPlanColor(selectedUser.plan)}>
                          {selectedUser.plan === 'free' ? 'Gratuito' :
                           selectedUser.plan === 'pro' ? 'Pro' : 'Enterprise'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Verificado</Label>
                        <p className="text-sm text-muted-foreground">Status de verificação do email</p>
                      </div>
                      <Badge className={selectedUser.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedUser.verified ? 'Verificado' : 'Não Verificado'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Autenticação 2FA</Label>
                        <p className="text-sm text-muted-foreground">Dois fatores habilitado</p>
                      </div>
                      <Badge className={selectedUser.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedUser.twoFactorEnabled ? 'Habilitado' : 'Desabilitado'}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
