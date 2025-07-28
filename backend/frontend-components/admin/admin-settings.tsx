'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import AdminLayout from './admin-layout'
import { 
  Settings, Save, RefreshCw, Database, Shield, Mail,
  Globe, DollarSign, Key, Bell, Users, Activity,
  Lock, Unlock, Eye, EyeOff, Plus, Trash2, Edit,
  AlertTriangle, CheckCircle, Server, Zap, Code,
  Palette, Monitor, Smartphone, Tablet, Webhook
} from "lucide-react"

interface SystemSettings {
  siteName: string
  siteDescription: string
  supportEmail: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  twoFactorRequired: boolean
  maxLoginAttempts: number
  sessionTimeout: number
  defaultCurrency: string
  defaultLanguage: string
  timezone: string
}

interface ApiSettings {
  rateLimit: number
  webhookUrl: string
  webhookSecret: string
  apiVersions: string[]
  enableLogging: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  maxRequestSize: number
  corsOrigins: string[]
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  templatesEnabled: boolean
}

interface FeatureFlags {
  advancedTrading: boolean
  aiPredictions: boolean
  socialTrading: boolean
  mobileApp: boolean
  apiAccess: boolean
  webhooks: boolean
  analytics: boolean
  notifications: boolean
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'CoinbitClub',
    siteDescription: 'Plataforma avançada de trading de criptomoedas',
    supportEmail: 'suporte@coinbitclub.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    twoFactorRequired: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    defaultCurrency: 'USD',
    defaultLanguage: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  })

  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    rateLimit: 1000,
    webhookUrl: 'https://api.coinbitclub.com/webhook',
    webhookSecret: '••••••••••••••••',
    apiVersions: ['v1', 'v2'],
    enableLogging: true,
    logLevel: 'info',
    maxRequestSize: 10,
    corsOrigins: ['https://coinbitclub.com', 'https://app.coinbitclub.com']
  })

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'noreply@coinbitclub.com',
    smtpPassword: '••••••••••••••••',
    smtpSecure: true,
    fromEmail: 'noreply@coinbitclub.com',
    fromName: 'CoinbitClub',
    templatesEnabled: true
  })

  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    advancedTrading: true,
    aiPredictions: true,
    socialTrading: false,
    mobileApp: true,
    apiAccess: true,
    webhooks: true,
    analytics: true,
    notifications: true
  })

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    lastBackup: '2025-07-28T02:00:00Z'
  })

  const handleSaveSystemSettings = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Sucesso!",
        description: "Configurações do sistema salvas",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveApiSettings = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Sucesso!",
        description: "Configurações da API salvas",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações da API",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmailSettings = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Teste enviado!",
        description: "Email de teste enviado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha no teste de email",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setBackupSettings(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }))
      
      toast({
        title: "Backup criado!",
        description: "Backup do sistema criado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar backup",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminLayout activeSection="settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie configurações globais e funcionalidades
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="features">Recursos</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações básicas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nome do Site</Label>
                    <Input
                      id="siteName"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Email de Suporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings({...systemSettings, supportEmail: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descrição do Site</Label>
                  <Textarea
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings({...systemSettings, siteDescription: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Moeda Padrão</Label>
                    <Select 
                      value={systemSettings.defaultCurrency} 
                      onValueChange={(value) => setSystemSettings({...systemSettings, defaultCurrency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Idioma Padrão</Label>
                    <Select 
                      value={systemSettings.defaultLanguage} 
                      onValueChange={(value) => setSystemSettings({...systemSettings, defaultLanguage: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuso Horário</Label>
                    <Select 
                      value={systemSettings.timezone} 
                      onValueChange={(value) => setSystemSettings({...systemSettings, timezone: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSystemSettings} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>
                  Controles de manutenção e acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloqueia acesso de usuários ao sistema
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registro de Novos Usuários</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite criação de novas contas
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.registrationEnabled}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, registrationEnabled: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Políticas de autenticação e segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificação de Email Obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Exige verificação por email para novos usuários
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.emailVerificationRequired}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, emailVerificationRequired: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação 2FA Obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Força uso de 2FA para todos os usuários
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.twoFactorRequired}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, twoFactorRequired: checked})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={systemSettings.maxLoginAttempts}
                      onChange={(e) => setSystemSettings({...systemSettings, maxLoginAttempts: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs de Segurança</CardTitle>
                <CardDescription>
                  Eventos de segurança recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Login bem-sucedido</p>
                        <p className="text-xs text-muted-foreground">Admin - 192.168.1.100</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">2 min atrás</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">Tentativa de login falhada</p>
                        <p className="text-xs text-muted-foreground">joao@email.com - 203.45.67.89</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">15 min atrás</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Configurações atualizadas</p>
                        <p className="text-xs text-muted-foreground">Admin - Sistema</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">1 hora atrás</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da API</CardTitle>
                <CardDescription>
                  Configurações de acesso e limitações da API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">Limite de Requisições (por minuto)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      value={apiSettings.rateLimit}
                      onChange={(e) => setApiSettings({...apiSettings, rateLimit: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRequestSize">Tamanho Máximo de Requisição (MB)</Label>
                    <Input
                      id="maxRequestSize"
                      type="number"
                      value={apiSettings.maxRequestSize}
                      onChange={(e) => setApiSettings({...apiSettings, maxRequestSize: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={apiSettings.webhookUrl}
                    onChange={(e) => setApiSettings({...apiSettings, webhookUrl: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <div className="relative">
                    <Input
                      id="webhookSecret"
                      type={showPasswordFields ? "text" : "password"}
                      value={apiSettings.webhookSecret}
                      onChange={(e) => setApiSettings({...apiSettings, webhookSecret: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                    >
                      {showPasswordFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nível de Log</Label>
                  <Select 
                    value={apiSettings.logLevel} 
                    onValueChange={(value: any) => setApiSettings({...apiSettings, logLevel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Logging Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Registra todas as requisições da API
                    </p>
                  </div>
                  <Switch
                    checked={apiSettings.enableLogging}
                    onCheckedChange={(checked) => setApiSettings({...apiSettings, enableLogging: checked})}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveApiSettings} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CORS Origins</CardTitle>
                <CardDescription>
                  Domínios autorizados para requisições CORS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {apiSettings.corsOrigins.map((origin, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={origin} readOnly />
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Origin
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Email</CardTitle>
                <CardDescription>
                  Configurações SMTP e templates de email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Servidor SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Porta SMTP</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">Usuário SMTP</Label>
                    <Input
                      id="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Senha SMTP</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Email Remetente</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">Nome Remetente</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Conexão Segura (SSL/TLS)</Label>
                    <p className="text-sm text-muted-foreground">
                      Usa conexão criptografada com o servidor SMTP
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.smtpSecure}
                    onCheckedChange={(checked) => setEmailSettings({...emailSettings, smtpSecure: checked})}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleTestEmailSettings} disabled={isLoading}>
                    <Mail className="h-4 w-4 mr-2" />
                    {isLoading ? 'Enviando...' : 'Testar Email'}
                  </Button>
                  
                  <Button onClick={handleSaveSystemSettings} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Flags */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades do Sistema</CardTitle>
                <CardDescription>
                  Habilite ou desabilite recursos específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Trading Avançado</Label>
                      <p className="text-sm text-muted-foreground">
                        Recursos avançados de trading
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.advancedTrading}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, advancedTrading: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Predições de IA</Label>
                      <p className="text-sm text-muted-foreground">
                        Sistema de análise inteligente
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.aiPredictions}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, aiPredictions: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Trading Social</Label>
                      <p className="text-sm text-muted-foreground">
                        Compartilhamento de estratégias
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.socialTrading}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, socialTrading: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Aplicativo Mobile</Label>
                      <p className="text-sm text-muted-foreground">
                        Acesso via aplicativo móvel
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.mobileApp}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, mobileApp: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Acesso à API</Label>
                      <p className="text-sm text-muted-foreground">
                        API para desenvolvedores
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.apiAccess}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, apiAccess: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Webhooks</Label>
                      <p className="text-sm text-muted-foreground">
                        Integração via webhooks
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.webhooks}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, webhooks: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Analytics Avançado</Label>
                      <p className="text-sm text-muted-foreground">
                        Relatórios e métricas detalhadas
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.analytics}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, analytics: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Notificações</Label>
                      <p className="text-sm text-muted-foreground">
                        Sistema de notificações push
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.notifications}
                      onCheckedChange={(checked) => setFeatureFlags({...featureFlags, notifications: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Backup</CardTitle>
                <CardDescription>
                  Gerencie backups automáticos e manuais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Executa backups automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.autoBackup}
                    onCheckedChange={(checked) => setBackupSettings({...backupSettings, autoBackup: checked})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequência do Backup</Label>
                    <Select 
                      value={backupSettings.backupFrequency} 
                      onValueChange={(value) => setBackupSettings({...backupSettings, backupFrequency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retentionDays">Retenção (dias)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      value={backupSettings.retentionDays}
                      onChange={(e) => setBackupSettings({...backupSettings, retentionDays: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Último backup:</strong> {formatDate(backupSettings.lastBackup)}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleCreateBackup} disabled={isLoading}>
                    <Database className="h-4 w-4 mr-2" />
                    {isLoading ? 'Criando Backup...' : 'Criar Backup Manual'}
                  </Button>
                  
                  <Button onClick={handleSaveSystemSettings} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Backups</CardTitle>
                <CardDescription>
                  Backups recentes do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Backup completo</p>
                        <p className="text-xs text-muted-foreground">2.3 GB - Automático</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(backupSettings.lastBackup)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Backup completo</p>
                        <p className="text-xs text-muted-foreground">2.1 GB - Automático</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">27/07/2025 02:00</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Backup incremental</p>
                        <p className="text-xs text-muted-foreground">145 MB - Manual</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">26/07/2025 15:30</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
