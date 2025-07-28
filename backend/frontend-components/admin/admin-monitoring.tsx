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
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import AdminLayout from './admin-layout'
import { 
  Activity, Server, Database, Cpu, MemoryStick, HardDrive,
  Wifi, Globe, Eye, RefreshCw, Download, AlertTriangle,
  CheckCircle, XCircle, Clock, Zap, BarChart3, TrendingUp,
  TrendingDown, Monitor, Smartphone, Users, DollarSign,
  Shield, Key, Mail, Bell, Settings, Search, Filter
} from "lucide-react"

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    inbound: number
    outbound: number
    connections: number
  }
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'warning' | 'maintenance'
  uptime: string
  lastCheck: string
  responseTime: number
  version: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  service: string
  message: string
  details?: string
}

interface PerformanceData {
  timestamp: string
  responseTime: number
  requests: number
  errors: number
  activeUsers: number
}

export default function AdminMonitoring() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [searchTerm, setSearchTerm] = useState('')
  const [logLevel, setLogLevel] = useState('all')

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: {
      usage: 45.2,
      cores: 8,
      temperature: 65
    },
    memory: {
      used: 6.4,
      total: 16,
      percentage: 40
    },
    disk: {
      used: 125,
      total: 500,
      percentage: 25
    },
    network: {
      inbound: 12.5,
      outbound: 8.3,
      connections: 1247
    }
  })

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Gateway',
      status: 'online',
      uptime: '99.9%',
      lastCheck: '2025-07-28T10:45:00Z',
      responseTime: 125,
      version: 'v2.1.0'
    },
    {
      name: 'Database',
      status: 'online',
      uptime: '99.8%',
      lastCheck: '2025-07-28T10:45:00Z',
      responseTime: 45,
      version: 'PostgreSQL 14.2'
    },
    {
      name: 'Trading Engine',
      status: 'warning',
      uptime: '98.5%',
      lastCheck: '2025-07-28T10:44:00Z',
      responseTime: 350,
      version: 'v1.8.5'
    },
    {
      name: 'Email Service',
      status: 'online',
      uptime: '99.2%',
      lastCheck: '2025-07-28T10:45:00Z',
      responseTime: 200,
      version: 'v1.2.1'
    },
    {
      name: 'Analytics Engine',
      status: 'offline',
      uptime: '95.1%',
      lastCheck: '2025-07-28T10:30:00Z',
      responseTime: 0,
      version: 'v3.0.2'
    }
  ])

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log_001',
      timestamp: '2025-07-28T10:45:32Z',
      level: 'info',
      service: 'API Gateway',
      message: 'Requisição processada com sucesso',
      details: 'GET /api/v1/user/profile - 200 OK - 125ms'
    },
    {
      id: 'log_002',
      timestamp: '2025-07-28T10:45:28Z',
      level: 'warn',
      service: 'Trading Engine',
      message: 'Alta latência detectada',
      details: 'Tempo de resposta: 350ms (limite: 300ms)'
    },
    {
      id: 'log_003',
      timestamp: '2025-07-28T10:45:15Z',
      level: 'error',
      service: 'Analytics Engine',
      message: 'Falha na conexão com o banco de dados',
      details: 'Connection timeout after 30s'
    },
    {
      id: 'log_004',
      timestamp: '2025-07-28T10:44:58Z',
      level: 'info',
      service: 'Email Service',
      message: 'Email de verificação enviado',
      details: 'Para: joao@email.com - Template: verification'
    },
    {
      id: 'log_005',
      timestamp: '2025-07-28T10:44:42Z',
      level: 'debug',
      service: 'Database',
      message: 'Query executada',
      details: 'SELECT * FROM users WHERE active = true - 45ms'
    }
  ])

  const [performanceData] = useState<PerformanceData[]>([
    { timestamp: '10:30', responseTime: 120, requests: 450, errors: 2, activeUsers: 892 },
    { timestamp: '10:35', responseTime: 135, requests: 523, errors: 1, activeUsers: 905 },
    { timestamp: '10:40', responseTime: 142, requests: 478, errors: 3, activeUsers: 887 },
    { timestamp: '10:45', responseTime: 125, requests: 612, errors: 0, activeUsers: 923 }
  ])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshMetrics()
      }, refreshInterval * 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const refreshMetrics = async () => {
    // Simula atualização dos dados
    const variance = 0.1
    setSystemMetrics(prev => ({
      cpu: {
        ...prev.cpu,
        usage: Math.max(0, Math.min(100, prev.cpu.usage + (Math.random() - 0.5) * 10))
      },
      memory: {
        ...prev.memory,
        percentage: Math.max(0, Math.min(100, prev.memory.percentage + (Math.random() - 0.5) * 5))
      },
      network: {
        ...prev.network,
        inbound: Math.max(0, prev.network.inbound + (Math.random() - 0.5) * 2),
        outbound: Math.max(0, prev.network.outbound + (Math.random() - 0.5) * 2)
      }
    }))
  }

  const handleRestartService = async (serviceName: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setServices(prev => prev.map(service => 
        service.name === serviceName 
          ? { ...service, status: 'online' as const, lastCheck: new Date().toISOString() }
          : service
      ))
      
      toast({
        title: "Sucesso!",
        description: `Serviço ${serviceName} reiniciado`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao reiniciar serviço",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200'
      case 'offline': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'maintenance': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'debug': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR')
  }

  const formatBytes = (bytes: number, unit: string = 'GB') => {
    return `${bytes.toFixed(1)} ${unit}`
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = logLevel === 'all' || log.level === logLevel
    
    return matchesSearch && matchesLevel
  })

  return (
    <AdminLayout activeSection="monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoramento do Sistema</h1>
            <p className="text-muted-foreground">
              Monitore performance, serviços e logs em tempo real
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={refreshMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Logs
            </Button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.cpu.usage.toFixed(1)}%</div>
              <Progress value={systemMetrics.cpu.usage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {systemMetrics.cpu.cores} cores • {systemMetrics.cpu.temperature}°C
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memória</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.memory.percentage.toFixed(1)}%</div>
              <Progress value={systemMetrics.memory.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disco</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.disk.percentage.toFixed(1)}%</div>
              <Progress value={systemMetrics.disk.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rede</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.network.connections}</div>
              <p className="text-xs text-muted-foreground">
                ↓ {formatBytes(systemMetrics.network.inbound, 'MB/s')} • 
                ↑ {formatBytes(systemMetrics.network.outbound, 'MB/s')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Serviços</CardTitle>
                  <CardDescription>Resumo do estado atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.slice(0, 3).map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {service.status === 'online' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {service.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {service.status === 'offline' && <XCircle className="h-4 w-4 text-red-600" />}
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status === 'online' ? 'Online' :
                           service.status === 'warning' ? 'Atenção' : 'Offline'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas Recentes</CardTitle>
                  <CardDescription>Eventos que requerem atenção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Trading Engine:</strong> Alta latência detectada (350ms)
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Analytics Engine:</strong> Serviço offline há 15 minutos
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Gráfico de Performance</CardTitle>
                <CardDescription>Métricas dos últimos 30 minutos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Gráfico de performance em tempo real
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Serviços</CardTitle>
                <CardDescription>
                  Monitoramento detalhado de todos os serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Resposta</TableHead>
                        <TableHead>Versão</TableHead>
                        <TableHead>Última Verificação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.name}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Server className="h-4 w-4" />
                              <span className="font-medium">{service.name}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={getStatusColor(service.status)}>
                              {service.status === 'online' ? 'Online' :
                               service.status === 'warning' ? 'Atenção' :
                               service.status === 'offline' ? 'Offline' : 'Manutenção'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <span className="font-medium">{service.uptime}</span>
                          </TableCell>
                          
                          <TableCell>
                            <span className={service.responseTime > 300 ? 'text-red-600' : 
                                           service.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'}>
                              {service.responseTime > 0 ? `${service.responseTime}ms` : '-'}
                            </span>
                          </TableCell>
                          
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {service.version}
                            </code>
                          </TableCell>
                          
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(service.lastCheck)}
                            </span>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestartService(service.name)}
                                disabled={isLoading}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
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
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar em logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os níveis</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="warn">Aviso</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="autoRefresh" className="text-sm">Auto-refresh:</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
                    >
                      {autoRefresh ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs do Sistema ({filteredLogs.length})</CardTitle>
                <CardDescription>
                  Logs em tempo real de todos os serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <span className="text-xs font-mono">
                              {formatDate(log.timestamp)}
                            </span>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={getLogLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <span className="text-sm font-medium">{log.service}</span>
                          </TableCell>
                          
                          <TableCell>
                            <span className="text-sm">{log.message}</span>
                          </TableCell>
                          
                          <TableCell>
                            {log.details && (
                              <code className="text-xs bg-muted px-2 py-1 rounded block max-w-xs truncate">
                                {log.details}
                              </code>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">125ms</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingDown className="inline h-3 w-3 text-green-600" />
                    -5ms da última hora
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requisições/min</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">612</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 text-green-600" />
                    +45 da última hora
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0.1%</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingDown className="inline h-3 w-3 text-green-600" />
                    -0.2% da última hora
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">923</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 text-green-600" />
                    +18 da última hora
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Detalhadas</CardTitle>
                <CardDescription>Performance dos últimos 30 minutos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horário</TableHead>
                        <TableHead>Tempo de Resposta</TableHead>
                        <TableHead>Requisições</TableHead>
                        <TableHead>Erros</TableHead>
                        <TableHead>Usuários Ativos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{data.timestamp}</TableCell>
                          <TableCell>
                            <span className={data.responseTime > 300 ? 'text-red-600' : 
                                           data.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'}>
                              {data.responseTime}ms
                            </span>
                          </TableCell>
                          <TableCell>{data.requests.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={data.errors > 0 ? 'text-red-600' : 'text-green-600'}>
                              {data.errors}
                            </span>
                          </TableCell>
                          <TableCell>{data.activeUsers.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
