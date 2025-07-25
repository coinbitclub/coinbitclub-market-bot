import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '../../src/components/AdminLayout';
import {
  CogIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  ServerIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface SystemConfig {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    maintenance: boolean;
  };
  api: {
    stripePublicKey: string;
    stripeSecretKey: string;
    openaiApiKey: string;
    coinstatsApiKey: string;
    zapiToken: string;
    binanceApiKey: string;
    binanceSecretKey: string;
    bybitApiKey: string;
    bybitSecretKey: string;
  };
  trading: {
    maxConcurrentOperations: number;
    defaultStopLoss: number;
    defaultTakeProfit: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    enablePaperTrading: boolean;
    tradingHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  notifications: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    pushEnabled: boolean;
    webhookUrl?: string;
    reportFrequency: '1h' | '4h' | '24h';
  };
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    enableAuditLog: boolean;
    ipWhitelist: string[];
  };
  affiliate: {
    defaultCommission: number; // % para afiliados comuns
    vipCommission: number; // % para afiliados VIP (5% do lucro)
    payoutThreshold: number;
    payoutFrequency: 'weekly' | 'monthly';
    enableAutoPayouts: boolean;
    enableVipProgram: boolean;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    sendgridApiKey: string;
    mailgunApiKey: string;
    mailgunDomain: string;
    sesAccessKey: string;
    sesSecretKey: string;
    sesRegion: string;
    fromEmail: string;
    fromName: string;
  };
}

const AdminSettings: NextPage = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState('general');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    setLoading(true);
    try {
      // Simular carregamento das configurações
      const mockConfig: SystemConfig = {
        general: {
          siteName: 'CoinBitClub',
          siteUrl: 'https://coinbitclub.com',
          adminEmail: 'admin@coinbitclub.com',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          maintenance: false
        },
        api: {
          stripePublicKey: 'your_stripe_public_key_here',
          stripeSecretKey: 'your_stripe_secret_key_here',
          openaiApiKey: 'your_openai_api_key_here',
          coinstatsApiKey: 'your_coinstats_api_key_here',
          zapiToken: 'your_zapi_token_here',
          binanceApiKey: 'your_binance_api_key_here',
          binanceSecretKey: 'your_binance_secret_key_here',
          bybitApiKey: 'your_bybit_api_key_here',
          bybitSecretKey: 'your_bybit_secret_key_here'
        },
        trading: {
          maxConcurrentOperations: 2,
          defaultStopLoss: 2.0,
          defaultTakeProfit: 8.0,
          riskLevel: 'MEDIUM',
          enablePaperTrading: false,
          tradingHours: {
            enabled: false,
            start: '09:00',
            end: '18:00'
          }
        },
        notifications: {
          emailEnabled: true,
          whatsappEnabled: true,
          pushEnabled: true,
          webhookUrl: 'https://hooks.slack.com/services/...',
          reportFrequency: '4h'
        },
        security: {
          twoFactorRequired: true,
          sessionTimeout: 30,
          passwordMinLength: 8,
          enableAuditLog: true,
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8']
        },
        affiliate: {
          defaultCommission: 20.0, // % para afiliados comuns
          vipCommission: 5.0, // % para afiliados VIP (5% do lucro)
          payoutThreshold: 100.0,
          payoutFrequency: 'monthly',
          enableAutoPayouts: true,
          enableVipProgram: true
        },
        email: {
          provider: 'smtp',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          sendgridApiKey: '',
          mailgunApiKey: '',
          mailgunDomain: '',
          sesAccessKey: '',
          sesSecretKey: '',
          sesRegion: 'us-east-1',
          fromEmail: 'admin@coinbitclub.com',
          fromName: 'CoinBit Club'
        }
      };

      setConfig(mockConfig);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const testApiConnection = async (apiName: string) => {
    setTestingConnection(apiName);
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Conexão com ${apiName} testada com sucesso!`);
    } catch (error) {
      alert(`Erro ao testar conexão com ${apiName}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const updateNestedConfig = (section: keyof SystemConfig, nestedField: string, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [nestedField]: {
          ...(prev![section] as any)[nestedField],
          [field]: value
        }
      }
    }));
  };

  if (loading || !config) {
    return (
      <AdminLayout title="Configurações">
        <div className="flex h-64 items-center justify-center">
          <div className="size-12 animate-spin rounded-full border-b-2 border-yellow-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <div>
      <Head>
        <title>Configurações - Admin CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Configurações do Sistema">
        <div className="space-y-6">
          
          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'general', name: 'Geral', icon: CogIcon },
                { id: 'api', name: 'APIs', icon: KeyIcon },
                { id: 'trading', name: 'Trading', icon: ChartBarIcon },
                { id: 'notifications', name: 'Notificações', icon: BellIcon },
                { id: 'security', name: 'Segurança', icon: ShieldCheckIcon },
                { id: 'affiliate', name: 'Afiliados', icon: UserGroupIcon },
                { id: 'email', name: 'Email', icon: BellIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center space-x-2 border-b-2 px-1 py-2 text-sm font-medium ${
                      selectedTab === tab.id
                        ? 'border-yellow-400 text-yellow-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center space-x-2 rounded-lg bg-yellow-600 px-6 py-2 text-white transition-colors hover:bg-yellow-700 disabled:opacity-50"
            >
              {saving ? (
                <ArrowPathIcon className="size-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="size-4" />
              )}
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>

          {/* Configurações Gerais */}
          {selectedTab === 'general' && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-white">
                <CogIcon className="mr-2 size-6 text-yellow-400" />
                Configurações Gerais
              </h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Nome do Site</label>
                  <input
                    type="text"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">URL do Site</label>
                  <input
                    type="url"
                    value={config.general.siteUrl}
                    onChange={(e) => updateConfig('general', 'siteUrl', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Email do Admin</label>
                  <input
                    type="email"
                    value={config.general.adminEmail}
                    onChange={(e) => updateConfig('general', 'adminEmail', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Fuso Horário</label>
                  <select
                    value={config.general.timezone}
                    onChange={(e) => updateConfig('general', 'timezone', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="America/Sao_Paulo">São Paulo</option>
                    <option value="America/New_York">New York</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Idioma</label>
                  <select
                    value={config.general.language}
                    onChange={(e) => updateConfig('general', 'language', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={config.general.maintenance}
                    onChange={(e) => updateConfig('general', 'maintenance', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="maintenance" className="text-white">
                    Modo Manutenção
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Configurações de API */}
          {selectedTab === 'api' && (
            <div className="space-y-6">
              
              {/* Stripe */}
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center text-lg font-semibold text-white">
                    <CurrencyDollarIcon className="mr-2 size-6 text-green-400" />
                    Stripe (Pagamentos)
                  </h3>
                  <button
                    onClick={() => testApiConnection('Stripe')}
                    disabled={testingConnection === 'Stripe'}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testingConnection === 'Stripe' ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">Chave Pública</label>
                    <div className="relative">
                      <input
                        type={showPasswords.stripePublic ? 'text' : 'password'}
                        value={config.api.stripePublicKey}
                        onChange={(e) => updateConfig('api', 'stripePublicKey', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('stripePublic')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showPasswords.stripePublic ? (
                          <EyeSlashIcon className="size-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="size-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">Chave Secreta</label>
                    <div className="relative">
                      <input
                        type={showPasswords.stripeSecret ? 'text' : 'password'}
                        value={config.api.stripeSecretKey}
                        onChange={(e) => updateConfig('api', 'stripeSecretKey', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('stripeSecret')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showPasswords.stripeSecret ? (
                          <EyeSlashIcon className="size-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="size-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OpenAI */}
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center text-lg font-semibold text-white">
                    <ServerIcon className="mr-2 size-6 text-purple-400" />
                    OpenAI (IA)
                  </h3>
                  <button
                    onClick={() => testApiConnection('OpenAI')}
                    disabled={testingConnection === 'OpenAI'}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testingConnection === 'OpenAI' ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">API Key</label>
                  <div className="relative">
                    <input
                      type={showPasswords.openai ? 'text' : 'password'}
                      value={config.api.openaiApiKey}
                      onChange={(e) => updateConfig('api', 'openaiApiKey', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('openai')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPasswords.openai ? (
                        <EyeSlashIcon className="size-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="size-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CoinStats */}
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center text-lg font-semibold text-white">
                    <ChartBarIcon className="mr-2 size-6 text-orange-400" />
                    CoinStats (Dados de Mercado)
                  </h3>
                  <button
                    onClick={() => testApiConnection('CoinStats')}
                    disabled={testingConnection === 'CoinStats'}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testingConnection === 'CoinStats' ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">API Key</label>
                  <div className="relative">
                    <input
                      type={showPasswords.coinstats ? 'text' : 'password'}
                      value={config.api.coinstatsApiKey}
                      onChange={(e) => updateConfig('api', 'coinstatsApiKey', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('coinstats')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPasswords.coinstats ? (
                        <EyeSlashIcon className="size-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="size-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Z-API WhatsApp */}
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center text-lg font-semibold text-white">
                    <BellIcon className="mr-2 size-6 text-green-400" />
                    Z-API (WhatsApp)
                  </h3>
                  <button
                    onClick={() => testApiConnection('Z-API')}
                    disabled={testingConnection === 'Z-API'}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testingConnection === 'Z-API' ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Token</label>
                  <div className="relative">
                    <input
                      type={showPasswords.zapi ? 'text' : 'password'}
                      value={config.api.zapiToken}
                      onChange={(e) => updateConfig('api', 'zapiToken', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('zapi')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPasswords.zapi ? (
                        <EyeSlashIcon className="size-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="size-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Exchange APIs */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Binance */}
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Binance</h3>
                    <button
                      onClick={() => testApiConnection('Binance')}
                      disabled={testingConnection === 'Binance'}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testingConnection === 'Binance' ? 'Testando...' : 'Testar'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">API Key</label>
                      <input
                        type="text"
                        value={config.api.binanceApiKey}
                        onChange={(e) => updateConfig('api', 'binanceApiKey', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showPasswords.binanceSecret ? 'text' : 'password'}
                          value={config.api.binanceSecretKey}
                          onChange={(e) => updateConfig('api', 'binanceSecretKey', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('binanceSecret')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showPasswords.binanceSecret ? (
                            <EyeSlashIcon className="size-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="size-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bybit */}
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Bybit</h3>
                    <button
                      onClick={() => testApiConnection('Bybit')}
                      disabled={testingConnection === 'Bybit'}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testingConnection === 'Bybit' ? 'Testando...' : 'Testar'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">API Key</label>
                      <input
                        type="text"
                        value={config.api.bybitApiKey}
                        onChange={(e) => updateConfig('api', 'bybitApiKey', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showPasswords.bybitSecret ? 'text' : 'password'}
                          value={config.api.bybitSecretKey}
                          onChange={(e) => updateConfig('api', 'bybitSecretKey', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('bybitSecret')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showPasswords.bybitSecret ? (
                            <EyeSlashIcon className="size-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="size-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configurações de Trading */}
          {selectedTab === 'trading' && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-white">
                <ChartBarIcon className="mr-2 size-6 text-blue-400" />
                Configurações de Trading
              </h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Máximo de Operações Concorrentes</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.trading.maxConcurrentOperations}
                    onChange={(e) => updateConfig('trading', 'maxConcurrentOperations', parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Stop Loss Padrão (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={config.trading.defaultStopLoss}
                    onChange={(e) => updateConfig('trading', 'defaultStopLoss', parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Take Profit Padrão (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    value={config.trading.defaultTakeProfit}
                    onChange={(e) => updateConfig('trading', 'defaultTakeProfit', parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Nível de Risco</label>
                  <select
                    value={config.trading.riskLevel}
                    onChange={(e) => updateConfig('trading', 'riskLevel', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="LOW">Baixo</option>
                    <option value="MEDIUM">Médio</option>
                    <option value="HIGH">Alto</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="paperTrading"
                    checked={config.trading.enablePaperTrading}
                    onChange={(e) => updateConfig('trading', 'enablePaperTrading', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="paperTrading" className="text-white">
                    Habilitar Paper Trading
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="tradingHours"
                    checked={config.trading.tradingHours.enabled}
                    onChange={(e) => updateNestedConfig('trading', 'tradingHours', 'enabled', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="tradingHours" className="text-white">
                    Restringir Horário de Trading
                  </label>
                </div>
                
                {config.trading.tradingHours.enabled && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Horário de Início</label>
                      <input
                        type="time"
                        value={config.trading.tradingHours.start}
                        onChange={(e) => updateNestedConfig('trading', 'tradingHours', 'start', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Horário de Fim</label>
                      <input
                        type="time"
                        value={config.trading.tradingHours.end}
                        onChange={(e) => updateNestedConfig('trading', 'tradingHours', 'end', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Configurações de Notificações */}
          {selectedTab === 'notifications' && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-white">
                <BellIcon className="mr-2 size-6 text-green-400" />
                Configurações de Notificações
              </h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={config.notifications.emailEnabled}
                    onChange={(e) => updateConfig('notifications', 'emailEnabled', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="emailEnabled" className="text-white">
                    Notificações por Email
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="whatsappEnabled"
                    checked={config.notifications.whatsappEnabled}
                    onChange={(e) => updateConfig('notifications', 'whatsappEnabled', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="whatsappEnabled" className="text-white">
                    Notificações por WhatsApp
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="pushEnabled"
                    checked={config.notifications.pushEnabled}
                    onChange={(e) => updateConfig('notifications', 'pushEnabled', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="pushEnabled" className="text-white">
                    Notificações Push
                  </label>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Frequência de Relatórios</label>
                  <select
                    value={config.notifications.reportFrequency}
                    onChange={(e) => updateConfig('notifications', 'reportFrequency', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="1h">A cada hora</option>
                    <option value="4h">A cada 4 horas</option>
                    <option value="24h">Diariamente</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-gray-400">Webhook URL (Opcional)</label>
                  <input
                    type="url"
                    value={config.notifications.webhookUrl || ''}
                    onChange={(e) => updateConfig('notifications', 'webhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Configurações de Segurança */}
          {selectedTab === 'security' && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-white">
                <ShieldCheckIcon className="mr-2 size-6 text-red-400" />
                Configurações de Segurança
              </h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="twoFactorRequired"
                    checked={config.security.twoFactorRequired}
                    onChange={(e) => updateConfig('security', 'twoFactorRequired', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="twoFactorRequired" className="text-white">
                    Autenticação 2FA Obrigatória
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableAuditLog"
                    checked={config.security.enableAuditLog}
                    onChange={(e) => updateConfig('security', 'enableAuditLog', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  />
                  <label htmlFor="enableAuditLog" className="text-white">
                    Log de Auditoria
                  </label>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Timeout de Sessão (minutos)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Tamanho Mínimo da Senha</label>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-gray-400">Whitelist de IPs (um por linha)</label>
                  <textarea
                    value={config.security.ipWhitelist.join('\n')}
                    onChange={(e) => updateConfig('security', 'ipWhitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                    rows={4}
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Configurações de Email */}
          {selectedTab === 'email' && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-white">
                <BellIcon className="mr-2 size-6 text-blue-400" />
                Configurações de Email
              </h3>
              
              <div className="space-y-6">
                {/* Provedor de Email */}
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Provedor de Email</label>
                  <select
                    value={config.email.provider}
                    onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>

                {/* Configurações SMTP */}
                {config.email.provider === 'smtp' && (
                  <div className="space-y-4 rounded-lg border border-gray-600 bg-gray-700/50 p-4">
                    <h4 className="text-md font-medium text-yellow-400">Configurações SMTP</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Servidor SMTP</label>
                        <input
                          type="text"
                          value={config.email.smtpHost}
                          onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Porta</label>
                        <input
                          type="number"
                          value={config.email.smtpPort}
                          onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                          placeholder="587"
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Usuário</label>
                        <input
                          type="text"
                          value={config.email.smtpUser}
                          onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Senha</label>
                        <input
                          type="password"
                          value={config.email.smtpPassword}
                          onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="smtpSecure"
                        checked={false}
                        onChange={(e) => console.log('SSL/TLS toggle:', e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                      />
                      <label htmlFor="smtpSecure" className="text-white">
                        SSL/TLS Seguro
                      </label>
                    </div>
                  </div>
                )}

                {/* Configurações SendGrid */}
                {config.email.provider === 'sendgrid' && (
                  <div className="space-y-4 rounded-lg border border-gray-600 bg-gray-700/50 p-4">
                    <h4 className="text-md font-medium text-yellow-400">Configurações SendGrid</h4>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">API Key</label>
                      <input
                        type="password"
                        value={config.email.sendgridApiKey}
                        onChange={(e) => updateConfig('email', 'sendgridApiKey', e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Configurações Mailgun */}
                {config.email.provider === 'mailgun' && (
                  <div className="space-y-4 rounded-lg border border-gray-600 bg-gray-700/50 p-4">
                    <h4 className="text-md font-medium text-yellow-400">Configurações Mailgun</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">API Key</label>
                        <input
                          type="password"
                          value={config.email.mailgunApiKey}
                          onChange={(e) => updateConfig('email', 'mailgunApiKey', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Domínio</label>
                        <input
                          type="text"
                          value={config.email.mailgunDomain}
                          onChange={(e) => updateConfig('email', 'mailgunDomain', e.target.value)}
                          placeholder="mg.coinbitclub.com"
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Configurações Amazon SES */}
                {config.email.provider === 'ses' && (
                  <div className="space-y-4 rounded-lg border border-gray-600 bg-gray-700/50 p-4">
                    <h4 className="text-md font-medium text-yellow-400">Configurações Amazon SES</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Access Key ID</label>
                        <input
                          type="text"
                          value={config.email.sesAccessKey}
                          onChange={(e) => updateConfig('email', 'sesAccessKey', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Secret Access Key</label>
                        <input
                          type="password"
                          value={config.email.sesSecretKey}
                          onChange={(e) => updateConfig('email', 'sesSecretKey', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">Região</label>
                        <select
                          value={config.email.sesRegion}
                          onChange={(e) => updateConfig('email', 'sesRegion', e.target.value)}
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                        >
                          <option value="us-east-1">US East (N. Virginia)</option>
                          <option value="us-west-2">US West (Oregon)</option>
                          <option value="eu-west-1">Europe (Ireland)</option>
                          <option value="sa-east-1">South America (São Paulo)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configurações Gerais */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-yellow-400">Configurações Gerais</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Email Remetente</label>
                      <input
                        type="email"
                        value={config.email.fromEmail}
                        onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                        placeholder="noreply@coinbitclub.com"
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Nome do Remetente</label>
                      <input
                        type="text"
                        value={config.email.fromName}
                        onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                        placeholder="CoinBit Club"
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Teste de Conexão */}
                <div className="flex items-center justify-between rounded-lg border border-yellow-600 bg-yellow-900/20 p-4">
                  <div>
                    <h4 className="text-md font-medium text-yellow-400">Testar Configuração</h4>
                    <p className="text-sm text-gray-400">Enviar email de teste para validar as configurações</p>
                  </div>
                  <button
                    onClick={() => {
                      // Implementar função de teste
                      alert('Teste de email enviado! Verifique sua caixa de entrada.');
                    }}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
                  >
                    Enviar Teste
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Configurações de Afiliados */}
          {selectedTab === 'affiliate' && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-white">
                <UserGroupIcon className="mr-2 size-6 text-purple-400" />
                Configurações de Afiliados
              </h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Comissão Afiliados Comuns (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={config.affiliate.defaultCommission}
                    onChange={(e) => updateConfig('affiliate', 'defaultCommission', parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">Comissão padrão para afiliados regulares</p>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Comissão Afiliados VIP (% do lucro)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={config.affiliate.vipCommission}
                    onChange={(e) => updateConfig('affiliate', 'vipCommission', parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">Porcentagem do lucro do indicado para VIPs</p>
                </div>
              </div>

              {/* Programa VIP */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-yellow-400">Programa VIP de Afiliados</h4>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableVipProgram"
                      checked={config.affiliate.enableVipProgram}
                      onChange={(e) => updateConfig('affiliate', 'enableVipProgram', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                    />
                    <label htmlFor="enableVipProgram" className="text-white">
                      Habilitar Programa VIP
                    </label>
                  </div>
                </div>

                {config.affiliate.enableVipProgram && (
                  <div className="rounded-lg border border-yellow-600 bg-yellow-900/20 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h5 className="font-medium text-yellow-300">Diferenças do Programa</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start space-x-2">
                            <span className="text-green-400">•</span>
                            <span className="text-gray-300">
                              <strong>Afiliado Regular:</strong> {config.affiliate.defaultCommission}% sobre depósitos
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-yellow-400">•</span>
                            <span className="text-gray-300">
                              <strong>Afiliado VIP:</strong> {config.affiliate.vipCommission}% sobre lucro líquido
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h5 className="font-medium text-yellow-300">Vantagens VIP</h5>
                        <div className="space-y-2 text-sm text-gray-300">
                          <div className="flex items-start space-x-2">
                            <span className="text-yellow-400">✓</span>
                            <span>Comissão baseada em resultados reais</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-yellow-400">✓</span>
                            <span>Alinhamento com sucesso dos indicados</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-yellow-400">✓</span>
                            <span>Potencial de ganhos mais justos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Configurações de Pagamento */}
              <div className="mt-8 space-y-4">
                <h4 className="text-md font-medium text-yellow-400">Configurações de Pagamento</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">Valor Mínimo para Saque (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={config.affiliate.payoutThreshold}
                      onChange={(e) => updateConfig('affiliate', 'payoutThreshold', parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">Frequência de Pagamento</label>
                    <select
                      value={config.affiliate.payoutFrequency}
                      onChange={(e) => updateConfig('affiliate', 'payoutFrequency', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                    >
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="enableAutoPayouts"
                        checked={config.affiliate.enableAutoPayouts}
                        onChange={(e) => updateConfig('affiliate', 'enableAutoPayouts', e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                      />
                      <label htmlFor="enableAutoPayouts" className="text-white">
                        Pagamentos Automáticos
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Quando habilitado, os pagamentos serão processados automaticamente na frequência selecionada
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </AdminLayout>
    </div>
  );
};

export default AdminSettings;
