import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Database,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Users,
  BarChart3,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Target,
  Globe,
  Server,
  Bot,
  Webhook,
  LineChart
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface AIMonitoringData {
  overview: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    activeWebhooks: number;
    errorRate: number;
    lastUpdate: string;
    status: 'healthy' | 'warning' | 'critical';
  };
  services: Array<{
    id: string;
    name: string;
    type: 'webhook' | 'microservice' | 'api' | 'database';
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    uptime: number;
    lastCheck: string;
    errorCount: number;
    requestCount: number;
  }>;
  aiMetrics: {
    gptRequests: number;
    gptTokensUsed: number;
    cacheHitRate: number;
    processingTime: number;
    predictionAccuracy: number;
    marketAnalysisCount: number;
    tradingSignals: number;
    volatilityAlerts: number;
  };
  security: {
    ipValidations: number;
    blockedRequests: number;
    authFailures: number;
    suspiciousActivity: number;
    railwayIPStatus: 'valid' | 'invalid' | 'checking';
    lastSecurityScan: string;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    databaseConnections: number;
    redisConnections: number;
    activeUsers: number;
    queueSize: number;
  };
  charts: {
    requestsOverTime: Array<{
      timestamp: string;
      requests: number;
      errors: number;
      responseTime: number;
    }>;
    serviceHealth: Array<{
      name: string;
      uptime: number;
      color: string;
    }>;
    aiUsage: Array<{
      hour: string;
      gptRequests: number;
      cacheHits: number;
      predictions: number;
    }>;
  };
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    service: string;
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

const AdminIADashboard: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<AIMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 15000); // Refresh every 15 seconds
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from IA monitoring services
      const [overviewResponse, servicesResponse, metricsResponse, securityResponse] = await Promise.all([
        fetch('/api/admin/ia/overview'),
        fetch('/api/admin/ia/services'),
        fetch('/api/admin/ia/metrics'),
        fetch('/api/admin/ia/security')
      ]);

      if (!overviewResponse.ok || !servicesResponse.ok || !metricsResponse.ok || !securityResponse.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const [overview, services, metrics, security] = await Promise.all([
        overviewResponse.json(),
        servicesResponse.json(),
        metricsResponse.json(),
        securityResponse.json()
      ]);

      // Get performance data from system
      const performanceResponse = await fetch('/api/admin/ia/performance');
      const performance = performanceResponse.ok ? await performanceResponse.json() : getDefaultPerformance();

      // Get charts data
      const chartsResponse = await fetch('/api/admin/ia/charts');
      const charts = chartsResponse.ok ? await chartsResponse.json() : getDefaultCharts();

      // Get alerts data
      const alertsResponse = await fetch('/api/admin/ia/alerts');
      const alerts = alertsResponse.ok ? await alertsResponse.json() : [];

      setMonitoringData({
        overview,
        services,
        aiMetrics: metrics,
        security,
        performance,
        charts,
        alerts
      });
      
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do monitoramento IA');
      console.error('IA Monitoring fetch error:', err);
      
      // Fallback to default data if API fails
      setMonitoringData(getDefaultMonitoringData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPerformance = () => ({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    databaseConnections: 0,
    redisConnections: 0,
    activeUsers: 0,
    queueSize: 0
  });

  const getDefaultCharts = () => ({
    requestsOverTime: [],
    serviceHealth: [],
    aiUsage: []
  });

  const getDefaultMonitoringData = (): AIMonitoringData => ({
    overview: {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      activeWebhooks: 0,
      errorRate: 0,
      lastUpdate: new Date().toISOString(),
      status: 'warning'
    },
    services: [],
    aiMetrics: {
      gptRequests: 0,
      gptTokensUsed: 0,
      cacheHitRate: 0,
      processingTime: 0,
      predictionAccuracy: 0,
      marketAnalysisCount: 0,
      tradingSignals: 0,
      volatilityAlerts: 0
    },
    security: {
      ipValidations: 0,
      blockedRequests: 0,
      authFailures: 0,
      suspiciousActivity: 0,
      railwayIPStatus: 'checking',
      lastSecurityScan: new Date().toISOString()
    },
    performance: getDefaultPerformance(),
    charts: getDefaultCharts(),
    alerts: []
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'valid':
        return 'text-green-500';
      case 'warning':
      case 'degraded':
        return 'text-yellow-500';
      case 'critical':
      case 'offline':
      case 'invalid':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'valid':
        return 'default';
      case 'warning':
      case 'degraded':
        return 'secondary';
      case 'critical':
      case 'offline':
      case 'invalid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex items-center space-x-4">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          <span className="text-white text-lg">Carregando Dashboard IA...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Alert className="max-w-md border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            {error}
            <Button 
              onClick={fetchMonitoringData} 
              className="ml-4 bg-orange-600 hover:bg-orange-700"
              size="sm"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!monitoringData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-600 rounded-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard IA CoinbitClub</h1>
            <p className="text-gray-400">Monitoramento Inteligente em Tempo Real</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button onClick={fetchMonitoringData} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Status Geral</CardTitle>
            <div className={`p-2 rounded-full ${
              monitoringData.overview.status === 'healthy' ? 'bg-green-500/20' :
              monitoringData.overview.status === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              {monitoringData.overview.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : monitoringData.overview.status === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              <Badge variant={getStatusBadgeVariant(monitoringData.overview.status)}>
                {monitoringData.overview.status === 'healthy' ? 'Saudável' :
                 monitoringData.overview.status === 'warning' ? 'Atenção' : 'Crítico'}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">
              Última atualização: {new Date(monitoringData.overview.lastUpdate).toLocaleTimeString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Requisições</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.overview.totalRequests)}</div>
            <p className="text-xs text-gray-400">
              Taxa de sucesso: {formatPercentage(monitoringData.overview.successRate)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatDuration(monitoringData.overview.averageResponseTime)}
            </div>
            <p className="text-xs text-gray-400">
              Webhooks ativos: {monitoringData.overview.activeWebhooks}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatPercentage(monitoringData.overview.errorRate)}
            </div>
            <p className="text-xs text-gray-400">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-900">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">Visão Geral</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-orange-600">Serviços</TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-orange-600">IA & Análise</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-orange-600">Segurança</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-orange-600">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests Over Time Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Requisições ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monitoringData.charts.requestsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Area type="monotone" dataKey="requests" stackId="1" stroke="#F97316" fill="#F97316" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="errors" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Service Health */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Saúde dos Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monitoringData.charts.serviceHealth}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="uptime"
                      >
                        {monitoringData.charts.serviceHealth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monitoringData.alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum alerta ativo</p>
                  </div>
                ) : (
                  monitoringData.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        alert.type === 'critical' ? 'bg-red-500/20' :
                        alert.type === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.type === 'critical' ? 'text-red-500' :
                          alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{alert.service}</span>
                          <Badge variant={alert.resolved ? "default" : "destructive"}>
                            {alert.resolved ? "Resolvido" : "Ativo"}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{alert.message}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(alert.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {monitoringData.services.map((service) => (
              <Card key={service.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{service.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(service.status)}>
                      {service.status === 'online' ? 'Online' :
                       service.status === 'offline' ? 'Offline' : 'Degradado'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {service.type === 'webhook' && <Webhook className="h-4 w-4 text-orange-500" />}
                    {service.type === 'microservice' && <Server className="h-4 w-4 text-blue-500" />}
                    {service.type === 'api' && <Globe className="h-4 w-4 text-green-500" />}
                    {service.type === 'database' && <Database className="h-4 w-4 text-purple-500" />}
                    <span className="text-sm text-gray-400 capitalize">{service.type}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Tempo de Resposta</p>
                      <p className="text-lg font-semibold text-white">{formatDuration(service.responseTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Uptime</p>
                      <p className="text-lg font-semibold text-white">{formatPercentage(service.uptime)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Requisições</p>
                      <p className="text-lg font-semibold text-white">{formatNumber(service.requestCount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Erros</p>
                      <p className="text-lg font-semibold text-red-400">{formatNumber(service.errorCount)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400">Última Verificação</p>
                    <p className="text-sm text-gray-300">
                      {new Date(service.lastCheck).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI & Analysis Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Requisições GPT</CardTitle>
                <Bot className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.aiMetrics.gptRequests)}</div>
                <p className="text-xs text-gray-400">
                  Tokens: {formatNumber(monitoringData.aiMetrics.gptTokensUsed)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatPercentage(monitoringData.aiMetrics.cacheHitRate)}</div>
                <p className="text-xs text-gray-400">
                  Tempo: {formatDuration(monitoringData.aiMetrics.processingTime)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Precisão IA</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatPercentage(monitoringData.aiMetrics.predictionAccuracy)}</div>
                <p className="text-xs text-gray-400">
                  Análises: {formatNumber(monitoringData.aiMetrics.marketAnalysisCount)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Sinais Trading</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.aiMetrics.tradingSignals)}</div>
                <p className="text-xs text-gray-400">
                  Alertas: {formatNumber(monitoringData.aiMetrics.volatilityAlerts)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Usage Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Uso da IA por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monitoringData.charts.aiUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="gptRequests" fill="#F97316" />
                    <Bar dataKey="cacheHits" fill="#10B981" />
                    <Bar dataKey="predictions" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Validações IP</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.security.ipValidations)}</div>
                <p className="text-xs text-gray-400">
                  Railway IP: <span className={getStatusColor(monitoringData.security.railwayIPStatus)}>
                    {monitoringData.security.railwayIPStatus === 'valid' ? 'Válido' :
                     monitoringData.security.railwayIPStatus === 'invalid' ? 'Inválido' : 'Verificando'}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Requisições Bloqueadas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.security.blockedRequests)}</div>
                <p className="text-xs text-gray-400">
                  Falhas auth: {formatNumber(monitoringData.security.authFailures)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Atividade Suspeita</CardTitle>
                <Eye className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.security.suspiciousActivity)}</div>
                <p className="text-xs text-gray-400">
                  Últimas 24h
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Último Scan</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-white">
                  {new Date(monitoringData.security.lastSecurityScan).toLocaleTimeString('pt-BR')}
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(monitoringData.security.lastSecurityScan).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">CPU</CardTitle>
                <Cpu className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatPercentage(monitoringData.performance.cpuUsage)}</div>
                <Progress value={monitoringData.performance.cpuUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Memória</CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatPercentage(monitoringData.performance.memoryUsage)}</div>
                <Progress value={monitoringData.performance.memoryUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Disco</CardTitle>
                <Server className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatPercentage(monitoringData.performance.diskUsage)}</div>
                <Progress value={monitoringData.performance.diskUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Usuários Ativos</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(monitoringData.performance.activeUsers)}</div>
                <p className="text-xs text-gray-400">
                  Conexões BD: {formatNumber(monitoringData.performance.databaseConnections)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Conexões de Rede</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Latência de Rede</span>
                  <span className="text-white font-semibold">{formatDuration(monitoringData.performance.networkLatency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Conexões Redis</span>
                  <span className="text-white font-semibold">{formatNumber(monitoringData.performance.redisConnections)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tamanho da Fila</span>
                  <span className="text-white font-semibold">{formatNumber(monitoringData.performance.queueSize)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Resumo do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    {formatPercentage((monitoringData.performance.cpuUsage + monitoringData.performance.memoryUsage + monitoringData.performance.diskUsage) / 3)}
                  </div>
                  <p className="text-gray-400">Saúde Geral do Sistema</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-white">{formatNumber(monitoringData.services.length)}</div>
                    <p className="text-xs text-gray-400">Serviços</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{formatNumber(monitoringData.alerts.filter(a => !a.resolved).length)}</div>
                    <p className="text-xs text-gray-400">Alertas</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{formatPercentage(monitoringData.overview.successRate)}</div>
                    <p className="text-xs text-gray-400">Sucesso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIADashboard;
