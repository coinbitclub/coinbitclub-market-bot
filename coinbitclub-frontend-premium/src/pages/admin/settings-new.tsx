import React from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiSettings, FiDatabase, FiMail, FiDollarSign, FiKey, FiShield,
  FiSave, FiRefreshCw, FiToggleLeft, FiToggleRight, FiEye, FiEyeOff,
  FiServer, FiSliders, FiGlobe, FiBell, FiLock, FiUsers, FiTool
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';

interface SystemSettings {
  // Application Settings
  app_name: string;
  app_url: string;
  app_timezone: string;
  maintenance_mode: boolean;
  debug_mode: boolean;
  
  // Trading Settings
  trading_enabled: boolean;
  min_investment: number;
  max_investment: number;
  default_leverage: number;
  risk_management_enabled: boolean;
  stop_loss_percentage: number;
  take_profit_percentage: number;
  
  // Payment Settings
  stripe_public_key: string;
  stripe_secret_key: string;
  paypal_client_id: string;
  paypal_secret: string;
  pix_enabled: boolean;
  minimum_withdrawal: number;
  maximum_withdrawal: number;
  withdrawal_fee_percentage: number;
  
  // Email Settings
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  from_email: string;
  from_name: string;
  
  // Affiliate Settings
  affiliate_enabled: boolean;
  default_commission_rate: number;
  minimum_payout: number;
  cookie_duration_days: number;
  multi_tier_enabled: boolean;
  tier_2_commission: number;
  tier_3_commission: number;
  
  // AI Settings
  openai_api_key: string;
  claude_api_key: string;
  ai_analysis_enabled: boolean;
  max_signals_per_day: number;
  confidence_threshold: number;
  
  // Notification Settings
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  telegram_notifications: boolean;
  telegram_bot_token: string;
  
  // Security Settings
  two_factor_enabled: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  password_min_length: number;
  require_password_symbols: boolean;
  ip_whitelist_enabled: boolean;
  allowed_ips: string[];
  
  // System Limits
  max_users_per_plan: number;
  max_api_requests_per_minute: number;
  file_upload_max_size_mb: number;
  log_retention_days: number;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<Partial<SystemSettings>>({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState('general');

  const { data: systemSettings, mutate } = useSWR('/api/admin/settings');

  useEffect(() => {
    if (systemSettings) {
      setSettings(systemSettings);
    }
  }, [systemSettings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        mutate();
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar configurações!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações!');
    }
    setLoading(false);
  };

  const handleTestConnection = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/settings/test-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      alert(result.success ? 'Conexão testada com sucesso!' : `Erro: ${result.error}`);
    } catch (error) {
      alert('Erro ao testar conexão!');
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderInput = (
    key: string, 
    label: string, 
    type: string = 'text', 
    placeholder?: string,
    isPassword?: boolean
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !showPasswords[key] ? 'password' : type}
          value={settings[key as keyof SystemSettings] || ''}
          onChange={(e) = /> updateSetting(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => togglePassword(key)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPasswords[key] ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );

  const renderToggle = (key: string, label: string, description?: string) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => updateSetting(key, !settings[key as keyof SystemSettings])}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          settings[key as keyof SystemSettings] ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            settings[key as keyof SystemSettings] ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const tabs = [
    { id: 'general', name: 'Geral', icon: FiSettings },
    { id: 'trading', name: 'Trading', icon: FiDollarSign },
    { id: 'payments', name: 'Pagamentos', icon: FiDollarSign },
    { id: 'email', name: 'Email', icon: FiMail },
    { id: 'affiliates', name: 'Afiliados', icon: FiUsers },
    { id: 'ai', name: 'IA', icon: FiDatabase },
    { id: 'notifications', name: 'Notificações', icon: FiBell },
    { id: 'security', name: 'Segurança', icon: FiShield },
    { id: 'limits', name: 'Limites', icon: FiSliders }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Configurações do Sistema - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                    <p className="mt-2 text-sm text-gray-600">
                      Gerencie todas as configurações da plataforma CoinBitClub
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <FiSave className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar Tudo'}
                    </button>
                    <button
                      onClick={() => mutate()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-2" />
                      Recarregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações Gerais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('app_name', 'Nome da Aplicação', 'text', 'CoinBitClub')}
                      {renderInput('app_url', 'URL da Aplicação', 'url', 'https://coinbitclub.com')}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select
                          value={settings.app_timezone || ''}
                          onChange={(e) => updateSetting('app_timezone', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York</option>
                          <option value="Europe/London">Europe/London</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {renderToggle('maintenance_mode', 'Modo de Manutenção', 'Desabilita o acesso de usuários ao sistema')}
                      {renderToggle('debug_mode', 'Modo Debug', 'Exibe informações detalhadas para depuração')}
                    </div>
                  </div>
                )}

                {/* Trading Settings */}
                {activeTab === 'trading' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de Trading</h3>
                    
                    <div className="space-y-4">
                      {renderToggle('trading_enabled', 'Trading Habilitado', 'Permite que usuários façam trades')}
                      {renderToggle('risk_management_enabled', 'Gerenciamento de Risco', 'Aplica regras automáticas de risco')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('min_investment', 'Investimento Mínimo (USD)', 'number', '10')}
                      {renderInput('max_investment', 'Investimento Máximo (USD)', 'number', '10000')}
                      {renderInput('default_leverage', 'Alavancagem Padrão', 'number', '1')}
                      {renderInput('stop_loss_percentage', 'Stop Loss (%)', 'number', '5')}
                      {renderInput('take_profit_percentage', 'Take Profit (%)', 'number', '10')}
                    </div>
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de Pagamento</h3>
                    
                    <div className="space-y-4">
                      {renderToggle('pix_enabled', 'PIX Habilitado', 'Permite pagamentos via PIX')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('stripe_public_key', 'Stripe Public Key', 'text', '', true)}
                      {renderInput('stripe_secret_key', 'Stripe Secret Key', 'text', '', true)}
                      {renderInput('paypal_client_id', 'PayPal Client ID', 'text', '', true)}
                      {renderInput('paypal_secret', 'PayPal Secret', 'text', '', true)}
                      {renderInput('minimum_withdrawal', 'Saque Mínimo (USD)', 'number', '50')}
                      {renderInput('maximum_withdrawal', 'Saque Máximo (USD)', 'number', '5000')}
                      {renderInput('withdrawal_fee_percentage', 'Taxa de Saque (%)', 'number', '2')}
                    </div>
                  </div>
                )}

                {/* Email Settings */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de Email</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('smtp_host', 'SMTP Host', 'text', 'smtp.gmail.com')}
                      {renderInput('smtp_port', 'SMTP Port', 'number', '587')}
                      {renderInput('smtp_username', 'SMTP Username', 'text', '')}
                      {renderInput('smtp_password', 'SMTP Password', 'text', '', true)}
                      {renderInput('from_email', 'Email Remetente', 'email', 'noreply@coinbitclub.com')}
                      {renderInput('from_name', 'Nome Remetente', 'text', 'CoinBitClub')}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Criptografia SMTP</label>
                        <select
                          value={settings.smtp_encryption || ''}
                          onChange={(e) => updateSetting('smtp_encryption', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="">Nenhuma</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => handleTestConnection('email')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FiMail className="h-4 w-4 mr-2" />
                        Testar Conexão Email
                      </button>
                    </div>
                  </div>
                )}

                {/* Affiliate Settings */}
                {activeTab === 'affiliates' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de Afiliados</h3>
                    
                    <div className="space-y-4">
                      {renderToggle('affiliate_enabled', 'Sistema de Afiliados', 'Habilita o programa de afiliados')}
                      {renderToggle('multi_tier_enabled', 'Multi-nível', 'Permite afiliados de múltiplos níveis')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('default_commission_rate', 'Comissão Padrão (%)', 'number', '10')}
                      {renderInput('minimum_payout', 'Pagamento Mínimo (USD)', 'number', '100')}
                      {renderInput('cookie_duration_days', 'Duração Cookie (dias)', 'number', '30')}
                      {renderInput('tier_2_commission', 'Comissão Nível 2 (%)', 'number', '5')}
                      {renderInput('tier_3_commission', 'Comissão Nível 3 (%)', 'number', '2')}
                    </div>
                  </div>
                )}

                {/* AI Settings */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de IA</h3>
                    
                    <div className="space-y-4">
                      {renderToggle('ai_analysis_enabled', 'Análise por IA', 'Habilita análises automáticas por IA')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('openai_api_key', 'OpenAI API Key', 'text', '', true)}
                      {renderInput('claude_api_key', 'Claude API Key', 'text', '', true)}
                      {renderInput('max_signals_per_day', 'Máx. Sinais/dia', 'number', '50')}
                      {renderInput('confidence_threshold', 'Limite de Confiança (%)', 'number', '70')}
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de Notificações</h3>
                    
                    <div className="space-y-4">
                      {renderToggle('email_notifications', 'Notificações por Email', 'Envia notificações por email')}
                      {renderToggle('sms_notifications', 'Notificações por SMS', 'Envia notificações por SMS')}
                      {renderToggle('push_notifications', 'Notificações Push', 'Envia notificações push')}
                      {renderToggle('telegram_notifications', 'Notificações Telegram', 'Envia notificações via Telegram')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('telegram_bot_token', 'Token do Bot Telegram', 'text', '', true)}
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
                    
                    <div className="space-y-4">
                      {renderToggle('two_factor_enabled', 'Autenticação 2FA', 'Exige autenticação de dois fatores')}
                      {renderToggle('require_password_symbols', 'Símbolos na Senha', 'Exige símbolos nas senhas')}
                      {renderToggle('ip_whitelist_enabled', 'Lista Branca de IPs', 'Restringe acesso por IP')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('session_timeout_minutes', 'Timeout Sessão (min)', 'number', '60')}
                      {renderInput('max_login_attempts', 'Máx. Tentativas Login', 'number', '5')}
                      {renderInput('password_min_length', 'Tamanho Mín. Senha', 'number', '8')}
                    </div>
                  </div>
                )}

                {/* System Limits */}
                {activeTab === 'limits' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Limites do Sistema</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderInput('max_users_per_plan', 'Máx. Usuários por Plano', 'number', '1000')}
                      {renderInput('max_api_requests_per_minute', 'Máx. Requests API/min', 'number', '100')}
                      {renderInput('file_upload_max_size_mb', 'Máx. Upload (MB)', 'number', '10')}
                      {renderInput('log_retention_days', 'Retenção de Logs (dias)', 'number', '30')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
