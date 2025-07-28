'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { 
  Settings, TrendingUp, Shield, DollarSign, Clock, 
  AlertTriangle, CheckCircle, Activity, Target,
  BarChart3, PieChart, LineChart, Zap, Brain,
  Save, RefreshCw, Copy, Download, Upload
} from "lucide-react"

interface TradingConfig {
  // Risk Management
  maxDailyLoss: number
  maxPositionSize: number
  stopLossPercentage: number
  takeProfitPercentage: number
  riskPerTrade: number
  
  // Strategy Settings
  strategy: string
  timeframe: string
  indicators: string[]
  signalConfirmation: number
  
  // Auto Trading
  autoTradingEnabled: boolean
  maxConcurrentTrades: number
  tradingHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  
  // Advanced Settings
  slippageProtection: number
  orderTimeout: number
  retryOnFailure: boolean
  paperTradingMode: boolean
  
  // Notifications
  notifyOnEntry: boolean
  notifyOnExit: boolean
  notifyOnError: boolean
  
  // Portfolio Management
  portfolioBalance: number
  allowedAssets: string[]
  rebalanceFrequency: string
}

interface Strategy {
  id: string
  name: string
  description: string
  winRate: number
  profitFactor: number
  maxDrawdown: number
  active: boolean
}

interface TradingPair {
  symbol: string
  name: string
  enabled: boolean
  allocation: number
}

export default function TradingConfiguration() {
  const [config, setConfig] = useState<TradingConfig>({
    maxDailyLoss: 5,
    maxPositionSize: 10,
    stopLossPercentage: 2,
    takeProfitPercentage: 6,
    riskPerTrade: 1,
    strategy: 'momentum',
    timeframe: '1h',
    indicators: ['rsi', 'macd', 'ema'],
    signalConfirmation: 2,
    autoTradingEnabled: true,
    maxConcurrentTrades: 3,
    tradingHours: {
      enabled: true,
      start: '09:00',
      end: '18:00',
      timezone: 'America/Sao_Paulo'
    },
    slippageProtection: 0.5,
    orderTimeout: 30,
    retryOnFailure: true,
    paperTradingMode: false,
    notifyOnEntry: true,
    notifyOnExit: true,
    notifyOnError: true,
    portfolioBalance: 10000,
    allowedAssets: ['BTC', 'ETH', 'BNB', 'SOL'],
    rebalanceFrequency: 'weekly'
  })

  const [strategies] = useState<Strategy[]>([
    {
      id: 'momentum',
      name: 'Momentum Trading',
      description: 'Segue tendências de alta/baixa com confirmação de volume',
      winRate: 68,
      profitFactor: 1.45,
      maxDrawdown: 12,
      active: true
    },
    {
      id: 'mean_reversion',
      name: 'Mean Reversion',
      description: 'Aproveita reversões em níveis de suporte/resistência',
      winRate: 72,
      profitFactor: 1.38,
      maxDrawdown: 8,
      active: false
    },
    {
      id: 'scalping',
      name: 'Scalping',
      description: 'Operações rápidas em timeframes menores',
      winRate: 75,
      profitFactor: 1.25,
      maxDrawdown: 15,
      active: false
    },
    {
      id: 'swing',
      name: 'Swing Trading',
      description: 'Posições de médio prazo (2-10 dias)',
      winRate: 65,
      profitFactor: 1.65,
      maxDrawdown: 18,
      active: false
    }
  ])

  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([
    { symbol: 'BTCUSDT', name: 'Bitcoin', enabled: true, allocation: 40 },
    { symbol: 'ETHUSDT', name: 'Ethereum', enabled: true, allocation: 30 },
    { symbol: 'BNBUSDT', name: 'Binance Coin', enabled: true, allocation: 15 },
    { symbol: 'SOLUSDT', name: 'Solana', enabled: true, allocation: 10 },
    { symbol: 'ADAUSDT', name: 'Cardano', enabled: false, allocation: 5 }
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('risk')

  useEffect(() => {
    const loadTradingConfig = async () => {
      setIsLoading(true)
      try {
        // Simulação de API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('✅ Configurações de trading carregadas')
      } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar configurações de trading",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTradingConfig()
  }, [])

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      // Validações básicas
      if (config.maxDailyLoss <= 0 || config.maxDailyLoss > 20) {
        throw new Error('Perda máxima diária deve estar entre 0.1% e 20%')
      }
      
      if (config.riskPerTrade <= 0 || config.riskPerTrade > 5) {
        throw new Error('Risco por trade deve estar entre 0.1% e 5%')
      }

      // Simulação de API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Sucesso!",
        description: "Configurações de trading salvas com sucesso",
      })
      
      console.log('✅ Configurações salvas:', config)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar configurações",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStrategyChange = (strategyId: string) => {
    setConfig({...config, strategy: strategyId})
  }

  const togglePairEnabled = (symbol: string) => {
    setTradingPairs(prev => prev.map(pair => 
      pair.symbol === symbol 
        ? {...pair, enabled: !pair.enabled}
        : pair
    ))
  }

  const updatePairAllocation = (symbol: string, allocation: number) => {
    setTradingPairs(prev => prev.map(pair => 
      pair.symbol === symbol 
        ? {...pair, allocation}
        : pair
    ))
  }

  const exportConfig = () => {
    const configData = JSON.stringify({ config, tradingPairs }, null, 2)
    const blob = new Blob([configData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trading-config.json'
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Sucesso!",
      description: "Configurações exportadas com sucesso",
    })
  }

  const getRiskLevel = (riskPerTrade: number) => {
    if (riskPerTrade <= 1) return { level: 'Baixo', color: 'text-green-600' }
    if (riskPerTrade <= 2.5) return { level: 'Médio', color: 'text-yellow-600' }
    return { level: 'Alto', color: 'text-red-600' }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações de Trading</h1>
          <p className="text-muted-foreground">
            Configure suas estratégias e parâmetros de trading automatizado
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleSaveConfig} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {config.autoTradingEnabled ? 'Ativo' : 'Pausado'}
            </div>
            <p className="text-xs text-muted-foreground">
              {config.paperTradingMode ? 'Modo Simulação' : 'Modo Real'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível de Risco</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskLevel(config.riskPerTrade).color}`}>
              {getRiskLevel(config.riskPerTrade).level}
            </div>
            <p className="text-xs text-muted-foreground">
              {config.riskPerTrade}% por operação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estratégia Ativa</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {strategies.find(s => s.id === config.strategy)?.name.split(' ')[0] || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Win Rate: {strategies.find(s => s.id === config.strategy)?.winRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pares Ativos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tradingPairs.filter(p => p.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {tradingPairs.length} disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="risk">
            <Shield className="h-4 w-4 mr-2" />
            Risco
          </TabsTrigger>
          <TabsTrigger value="strategy">
            <Brain className="h-4 w-4 mr-2" />
            Estratégia
          </TabsTrigger>
          <TabsTrigger value="pairs">
            <BarChart3 className="h-4 w-4 mr-2" />
            Pares
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="h-4 w-4 mr-2" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4 mr-2" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Risk Management Tab */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Risco</CardTitle>
              <CardDescription>
                Configure os parâmetros de proteção do seu capital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Perda Máxima Diária (%)</Label>
                  <div className="space-y-3">
                    <Slider
                      value={[config.maxDailyLoss]}
                      onValueChange={(value) => setConfig({...config, maxDailyLoss: value[0]})}
                      max={20}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0.1%</span>
                      <span className="font-medium">{config.maxDailyLoss}%</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Risco por Trade (%)</Label>
                  <div className="space-y-3">
                    <Slider
                      value={[config.riskPerTrade]}
                      onValueChange={(value) => setConfig({...config, riskPerTrade: value[0]})}
                      max={5}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0.1%</span>
                      <span className="font-medium">{config.riskPerTrade}%</span>
                      <span>5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={config.stopLossPercentage}
                    onChange={(e) => setConfig({...config, stopLossPercentage: parseFloat(e.target.value)})}
                    min={0.5}
                    max={10}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    value={config.takeProfitPercentage}
                    onChange={(e) => setConfig({...config, takeProfitPercentage: parseFloat(e.target.value)})}
                    min={1}
                    max={50}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tamanho Máximo da Posição (% do portfólio)</Label>
                <div className="space-y-3">
                  <Slider
                    value={[config.maxPositionSize]}
                    onValueChange={(value) => setConfig({...config, maxPositionSize: value[0]})}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1%</span>
                    <span className="font-medium">{config.maxPositionSize}%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ratio Risco/Recompensa:</strong> {(config.takeProfitPercentage / config.stopLossPercentage).toFixed(2)}:1
                  {config.takeProfitPercentage / config.stopLossPercentage < 2 && (
                    <span className="text-yellow-600"> - Considere melhorar o ratio para pelo menos 2:1</span>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seleção de Estratégia</CardTitle>
                <CardDescription>
                  Escolha a estratégia de trading que melhor se adapta ao seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {strategies.map((strategy) => (
                    <div 
                      key={strategy.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        config.strategy === strategy.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleStrategyChange(strategy.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{strategy.name}</h3>
                        <div className="flex items-center space-x-2">
                          {config.strategy === strategy.id && (
                            <Badge>Ativa</Badge>
                          )}
                          <CheckCircle className={`h-5 w-5 ${
                            config.strategy === strategy.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {strategy.description}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Win Rate:</span>
                          <div className="font-medium text-green-600">{strategy.winRate}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit Factor:</span>
                          <div className="font-medium">{strategy.profitFactor}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Drawdown:</span>
                          <div className="font-medium text-red-600">{strategy.maxDrawdown}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações da Estratégia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <Select value={config.timeframe} onValueChange={(value) => setConfig({...config, timeframe: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 minuto</SelectItem>
                        <SelectItem value="5m">5 minutos</SelectItem>
                        <SelectItem value="15m">15 minutos</SelectItem>
                        <SelectItem value="1h">1 hora</SelectItem>
                        <SelectItem value="4h">4 horas</SelectItem>
                        <SelectItem value="1d">1 dia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmações de Sinal</Label>
                    <Select 
                      value={config.signalConfirmation.toString()} 
                      onValueChange={(value) => setConfig({...config, signalConfirmation: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 confirmação</SelectItem>
                        <SelectItem value="2">2 confirmações</SelectItem>
                        <SelectItem value="3">3 confirmações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Indicadores Técnicos</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {['rsi', 'macd', 'ema', 'bollinger', 'stochastic', 'volume', 'momentum', 'williams'].map((indicator) => (
                      <div key={indicator} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={indicator}
                          checked={config.indicators.includes(indicator)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig({...config, indicators: [...config.indicators, indicator]})
                            } else {
                              setConfig({...config, indicators: config.indicators.filter(i => i !== indicator)})
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={indicator} className="text-sm capitalize">
                          {indicator}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trading Pairs Tab */}
        <TabsContent value="pairs">
          <Card>
            <CardHeader>
              <CardTitle>Pares de Trading</CardTitle>
              <CardDescription>
                Configure quais ativos serão negociados e suas alocações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tradingPairs.map((pair) => (
                  <div key={pair.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={pair.enabled}
                        onCheckedChange={() => togglePairEnabled(pair.symbol)}
                      />
                      <div>
                        <h3 className="font-semibold">{pair.name}</h3>
                        <p className="text-sm text-muted-foreground">{pair.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="space-y-1 text-right">
                        <Label className="text-xs">Alocação</Label>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={pair.allocation}
                            onChange={(e) => updatePairAllocation(pair.symbol, parseInt(e.target.value))}
                            disabled={!pair.enabled}
                            min={0}
                            max={100}
                            className="text-center"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">%</div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-sm">
                <span>Total de Alocação:</span>
                <span className={`font-semibold ${
                  tradingPairs.filter(p => p.enabled).reduce((sum, p) => sum + p.allocation, 0) === 100 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {tradingPairs.filter(p => p.enabled).reduce((sum, p) => sum + p.allocation, 0)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Automação</CardTitle>
                <CardDescription>
                  Configure quando e como o sistema deve operar automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Trading Automatizado</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar execução automática de trades
                    </p>
                  </div>
                  <Switch
                    checked={config.autoTradingEnabled}
                    onCheckedChange={(checked) => setConfig({...config, autoTradingEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Simulação</Label>
                    <p className="text-sm text-muted-foreground">
                      Executar trades em modo de teste
                    </p>
                  </div>
                  <Switch
                    checked={config.paperTradingMode}
                    onCheckedChange={(checked) => setConfig({...config, paperTradingMode: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Máximo de Trades Simultâneos</Label>
                  <div className="space-y-3">
                    <Slider
                      value={[config.maxConcurrentTrades]}
                      onValueChange={(value) => setConfig({...config, maxConcurrentTrades: value[0]})}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>1</span>
                      <span className="font-medium">{config.maxConcurrentTrades}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Horário de Funcionamento</Label>
                    <Switch
                      checked={config.tradingHours.enabled}
                      onCheckedChange={(checked) => setConfig({
                        ...config, 
                        tradingHours: {...config.tradingHours, enabled: checked}
                      })}
                    />
                  </div>

                  {config.tradingHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Horário de Início</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={config.tradingHours.start}
                          onChange={(e) => setConfig({
                            ...config,
                            tradingHours: {...config.tradingHours, start: e.target.value}
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">Horário de Término</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={config.tradingHours.end}
                          onChange={(e) => setConfig({
                            ...config,
                            tradingHours: {...config.tradingHours, end: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notificar ao Entrar em Posição</Label>
                  <Switch
                    checked={config.notifyOnEntry}
                    onCheckedChange={(checked) => setConfig({...config, notifyOnEntry: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notificar ao Sair de Posição</Label>
                  <Switch
                    checked={config.notifyOnExit}
                    onCheckedChange={(checked) => setConfig({...config, notifyOnExit: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notificar Erros</Label>
                  <Switch
                    checked={config.notifyOnError}
                    onCheckedChange={(checked) => setConfig({...config, notifyOnError: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Parâmetros técnicos para usuários experientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slippage">Proteção contra Slippage (%)</Label>
                  <Input
                    id="slippage"
                    type="number"
                    value={config.slippageProtection}
                    onChange={(e) => setConfig({...config, slippageProtection: parseFloat(e.target.value)})}
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout de Ordem (segundos)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.orderTimeout}
                    onChange={(e) => setConfig({...config, orderTimeout: parseInt(e.target.value)})}
                    min={5}
                    max={300}
                    step={5}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Retry em Caso de Falha</Label>
                  <p className="text-sm text-muted-foreground">
                    Tentar novamente ordens que falharam
                  </p>
                </div>
                <Switch
                  checked={config.retryOnFailure}
                  onCheckedChange={(checked) => setConfig({...config, retryOnFailure: checked})}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="portfolioBalance">Saldo do Portfólio (USD)</Label>
                <Input
                  id="portfolioBalance"
                  type="number"
                  value={config.portfolioBalance}
                  onChange={(e) => setConfig({...config, portfolioBalance: parseFloat(e.target.value)})}
                  min={100}
                  step={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Frequência de Rebalanceamento</Label>
                <Select 
                  value={config.rebalanceFrequency} 
                  onValueChange={(value) => setConfig({...config, rebalanceFrequency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Nunca</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Modificar estas configurações pode afetar significativamente 
                  a performance do sistema. Recomendamos testar em modo simulação antes de aplicar 
                  em trading real.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
