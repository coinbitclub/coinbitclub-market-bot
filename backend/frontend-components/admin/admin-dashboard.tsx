'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import AdminLayout from './admin-layout'
import { 
  Users, DollarSign, TrendingUp, Activity, AlertTriangle, 
  CheckCircle, Clock, Zap, Database, Server, Wifi,
  ArrowUp, ArrowDown, RefreshCw, Download, Eye,
  UserCheck, UserX, CreditCard, Shield, Globe
} from "lucide-react"

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  totalTrades: number
  activeBots: number
  systemUptime: number
  apiLatency: number
}

interface UserActivity {
  date: string
  registrations: number
  active_users: number
  trades: number
  revenue: number
}

interface ExchangeStatus {
  name: string
  status: 'online' | 'degraded' | 'offline'
  latency: number
  uptime: number
  users_connected: number
}

interface SystemAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  
  // System Metrics
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 1247,
    activeUsers: 892,
    totalRevenue: 127543.89,
    monthlyRevenue: 34567.21,
    totalTrades: 45789,
    activeBots: 567,
    systemUptime: 99.94,
    apiLatency: 145
  })

  // Activity Data for Charts
  const [activityData] = useState<UserActivity[]>([
    { date: '22/07', registrations: 45, active_users: 823, trades: 1234, revenue: 4567.89 },
    { date: '23/07', registrations: 67, active_users: 854, trades: 1456, revenue: 5234.12 },
    { date: '24/07', registrations: 34, active_users: 876, trades: 1345, revenue: 4876.43 },
    { date: '25/07', registrations: 89, active_users: 901, trades: 1567, revenue: 6123.56 },
    { date: '26/07', registrations: 56, active_users: 889, trades: 1423, revenue: 5456.78 },
    { date: '27/07', registrations: 78, active_users: 912, trades: 1678, revenue: 6789.12 },
    { date: '28/07', registrations: 92, active_users: 934, trades: 1789, revenue: 7234.45 }
  ])

  // Exchange Status
  const [exchanges] = useState<ExchangeStatus[]>([
    { name: 'Binance', status: 'online', latency: 120, uptime: 99.98, users_connected: 456 },
    { name: 'Bybit', status: 'online', latency: 145, uptime: 99.95, users_connected: 234 },
    { name: 'OKX', status: 'degraded', latency: 289, uptime: 98.87, users_connected: 123 },
    { name: 'KuCoin', status: 'online', latency: 167, uptime: 99.92, users_connected: 89 }
  ])

  // System Alerts
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: 'alert1',
      type: 'warning',
      title: 'OKX API Lenta',
      message: 'Latência elevada detectada na API da OKX (289ms)',
      timestamp: new Date().toISOString(),
      severity: 'medium'
    },
    {
      id: 'alert2',
      type: 'info',
      title: 'Alto Volume de Trading',
      message: 'Volume 180% acima da média nas últimas 3 horas',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      severity: 'low'
    },
    {
      id: 'alert3',
      type: 'success',
      title: 'Backup Concluído',
      message: 'Backup automático do banco de dados finalizado com sucesso',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: 'low'
    }
  ])

  const revenueDistribution = [
    { name: 'Comissões Trading', value: 67.4, amount: 21234.56 },
    { name: 'Planos Premium', value: 23.1, amount: 7890.12 },
    { name: 'API Calls', value: 6.8, amount: 2145.67 },
    { name: 'Outros', value: 2.7, amount: 856.43 }
  ]

  useEffect(() => {
    // Simular carregamento de dados
    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Simulação de API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('✅ Dados do dashboard administrativo carregados')
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()

    // Auto-refresh dos dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [selectedTimeRange])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'offline': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Zap className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <AdminLayout activeSection="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">
              Visão geral completa do sistema CoinbitClub
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              Ver Relatório
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12% este mês
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {formatPercentage((metrics.activeUsers / metrics.totalUsers) * 100)} do total
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {formatCurrency(metrics.monthlyRevenue)} este mês
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPercentage(metrics.systemUptime)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Últimos 30 dias
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade dos Usuários</CardTitle>
              <CardDescription>
                Registros, usuários ativos e trades nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="active_users" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stackId="1"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Receita</CardTitle>
              <CardDescription>
                Origem das receitas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* System Status and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Exchange Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Status das Exchanges</CardTitle>
              <CardDescription>
                Monitoramento em tempo real das APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exchanges.map((exchange) => (
                  <div key={exchange.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`h-3 w-3 rounded-full ${
                        exchange.status === 'online' ? 'bg-green-500' :
                        exchange.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h4 className="font-semibold">{exchange.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exchange.users_connected} usuários conectados
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <Badge className={getStatusBadge(exchange.status)}>
                        {exchange.status === 'online' ? 'Online' :
                         exchange.status === 'degraded' ? 'Degradado' : 'Offline'}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        <div>Latência: {exchange.latency}ms</div>
                        <div>Uptime: {formatPercentage(exchange.uptime)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas do Sistema</CardTitle>
              <CardDescription>
                Notificações importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`border-l-4 p-3 rounded ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getAlertIcon(alert.type)}
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
            <CardDescription>
              Indicadores técnicos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Latência Média</span>
                  <span className="text-sm text-muted-foreground">{metrics.apiLatency}ms</span>
                </div>
                <Progress value={((300 - metrics.apiLatency) / 300) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bots Ativos</span>
                  <span className="text-sm text-muted-foreground">{metrics.activeBots}</span>
                </div>
                <Progress value={(metrics.activeBots / 1000) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Sucesso</span>
                  <span className="text-sm text-muted-foreground">94.7%</span>
                </div>
                <Progress value={94.7} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uso de Recursos</span>
                  <span className="text-sm text-muted-foreground">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Operações administrativas frequentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col">
                <Database className="h-6 w-6 mb-2" />
                Backup Manual
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Shield className="h-6 w-6 mb-2" />
                Verificar Segurança
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Globe className="h-6 w-6 mb-2" />
                Status APIs
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Server className="h-6 w-6 mb-2" />
                Logs do Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
