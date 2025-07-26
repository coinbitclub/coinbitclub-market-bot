import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiSave, FiToggleLeft, FiToggleRight, FiCheck,
  FiMail, FiLock, FiDatabase, FiZap, FiTarget, FiCreditCard,
  FiBell, FiShield, FiGlobe, FiKey, FiServer, FiMonitor
} from 'react-icons/fi';

interface SystemConfig {
  general: {
    company_name: string;
    company_logo: string;
    timezone: string;
    default_language: string;
    currency: string;
    maintenance_mode: boolean;
    support_email: string;
    support_phone: string;
  };
  trading: {
    max_simultaneous_operations: number;
    default_risk_percentage: number;
    max_risk_percentage: number;
    auto_stop_loss: boolean;
    default_stop_loss: number;
    auto_take_profit: boolean;
    default_take_profit: number;
    trading_hours_enabled: boolean;
    trading_start_time: string;
    trading_end_time: string;
  };
  security: {
    two_factor_required: boolean;
    session_timeout: number;
    max_login_attempts: number;
    password_expiry_days: number;
    require_email_verification: boolean;
    require_kyc_verification: boolean;
    ip_whitelist_enabled: boolean;
    api_rate_limit: number;
    encryption_enabled: boolean;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    telegram_notifications: boolean;
    signal_notifications: boolean;
    operation_notifications: boolean;
    balance_notifications: boolean;
    daily_reports: boolean;
    weekly_reports: boolean;
    monthly_reports: boolean;
  };
  financial: {
    minimum_deposit: number;
    maximum_deposit: number;
    minimum_withdrawal: number;
    withdrawal_fee_percentage: number;
    auto_reinvest: boolean;
    commission_percentage: number;
    affiliate_commission_tiers: {
      bronze: number;
      silver: number;
      gold: number;
      diamond: number;
    };
  };
  integrations: {
    tradingview_enabled: boolean;
    tradingview_api_key: string;
    binance_enabled: boolean;
    binance_api_key: string;
    telegram_bot_enabled: boolean;
    telegram_bot_token: string;
    smtp_enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    sms_provider: string;
    sms_api_key: string;
    };
  };
  financial: {
    minimum_deposit: number;
    maximum_deposit: number;
    minimum_withdrawal: number;
  };
}

export default function SettingsManagementNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState<SystemConfig | null>(null);

  // Buscar dados reais da API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.success) {
        setConfig(data.settings);
      } else {
        console.error('Erro ao buscar configurações:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const saveSettings = async (category: string, settings: any) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/settings?category=${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        fetchSettings(); // Recarregar dados
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar configurações!');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações!');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);
    general: {
      platform_name: 'CoinBitClub',
      maintenance_mode: false,
      registration_enabled: true,
      max_users: 10000,
      default_language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      logo_url: '/logo.png',
      contact_email: 'support@coinbitclub.com'
    },
    trading: {
      auto_trading_enabled: true,
      max_position_size: 10000,
      default_leverage: 2,
      risk_management_enabled: true,
      stop_loss_percentage: 5.0,
      take_profit_percentage: 10.0,
      supported_pairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'BNBUSDT'],
      trading_fees: 0.1
    },
    security: {
      two_factor_required: true,
      session_timeout: 60,
      max_login_attempts: 5,
      password_min_length: 8,
      api_rate_limit: 100,
      ip_whitelist_enabled: false,
      encryption_enabled: true
    },
    notifications: {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      telegram_enabled: true,
      alert_thresholds: {
        profit_threshold: 5.0,
        loss_threshold: 3.0,
        volume_threshold: 1000000
      }
    },
    financial: {
      minimum_deposit: 10,
      maximum_deposit: 100000,
      minimum_withdrawal: 5,
      maximum_withdrawal: 50000,
      withdrawal_fee: 0.5,
      commission_rate: 0.25,
      affiliate_commission: 10.0
    },
    integrations: {
      binance_api_key: '••••••••••••••••',
      tradingview_webhook: 'https://webhook.coinbitclub.com/tv',
      telegram_bot_token: '••••••••••••••••',
      email_service_provider: 'SendGrid',
      sms_provider: 'Twilio',
      payment_gateway: 'Stripe'
    }
  });

  useEffect(() => {
    setLoading(true);
    // Simular carregamento das configurações
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleToggle = (section: keyof SystemConfig, key: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key as keyof typeof prev[typeof section]]
      }
    }));
  };

  const handleInputChange = (section: keyof SystemConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedChange = (section: keyof SystemConfig, nestedKey: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...((prev[section] as any)[nestedKey] || {}),
          [key]: value
        }
      }
    }));
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'general': return <FiSettings className="w-5 h-5" />;
      case 'trading': return <FiTrendingUp className="w-5 h-5" />;
      case 'security': return <FiShield className="w-5 h-5" />;
      case 'notifications': return <FiBell className="w-5 h-5" />;
      case 'financial': return <FiDollarSign className="w-5 h-5" />;
      case 'integrations': return <FiZap className="w-5 h-5" />;
      default: return <FiSettings className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Configurações | CoinBitClub Admin</title>
        <meta name="description" content="Configurações - CoinBitClub Admin" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
            <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-yellow-400 hover:text-pink-400"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-3">
              <a href="/admin/dashboard-executive" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Dashboard Executivo</span>
              </a>
              <a href="/admin/users" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Usuários</span>
              </a>
              <a href="/admin/affiliates" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiShare2 className="w-6 h-6 mr-4" />
                <span>Gestão de Afiliados</span>
              </a>
              <a href="/admin/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/admin/alerts" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiAlertTriangle className="w-6 h-6 mr-4" />
                <span>Alertas</span>
              </a>
              <a href="/admin/adjustments" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Acertos</span>
              </a>
              <a href="/admin/accounting" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Contabilidade</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-yellow-400">Configurações do Sistema</h2>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center px-6 py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-5 h-5 mr-2" />
                  <span className="font-medium">Resetar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-6 py-3 text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400 rounded-lg transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5 mr-2" />
                      <span>Salvar Tudo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Tabs */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-8">
              <div className="flex flex-wrap border-b border-yellow-400/30">
                {['general', 'trading', 'security', 'notifications', 'financial', 'integrations'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                      activeTab === tab
                        ? 'text-yellow-400 bg-yellow-400/20 border-b-2 border-yellow-400'
                        : 'text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10'
                    }`}
                  >
                    {getTabIcon(tab)}
                    <span className="ml-2">{tab}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] p-8">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Configurações Gerais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Nome da Plataforma</label>
                      <input
                        type="text"
                        value={config.general.platform_name}
                        onChange={(e) => handleInputChange('general', 'platform_name', e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Email de Contato</label>
                      <input
                        type="email"
                        value={config.general.contact_email}
                        onChange={(e) => handleInputChange('general', 'contact_email', e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Máximo de Usuários</label>
                      <input
                        type="number"
                        value={config.general.max_users}
                        onChange={(e) => handleInputChange('general', 'max_users', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Idioma Padrão</label>
                      <select
                        value={config.general.default_language}
                        onChange={(e) => handleInputChange('general', 'default_language', e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-yellow-400/30">
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">Modo Manutenção</h4>
                        <p className="text-blue-400 text-sm">Bloquear acesso temporariamente</p>
                      </div>
                      <button
                        onClick={() => handleToggle('general', 'maintenance_mode')}
                        className={`${config.general.maintenance_mode ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.general.maintenance_mode ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">Registro Habilitado</h4>
                        <p className="text-blue-400 text-sm">Permitir novos cadastros</p>
                      </div>
                      <button
                        onClick={() => handleToggle('general', 'registration_enabled')}
                        className={`${config.general.registration_enabled ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.general.registration_enabled ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Trading Tab */}
              {activeTab === 'trading' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Configurações de Trading</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Tamanho Máx. Posição ($)</label>
                      <input
                        type="number"
                        value={config.trading.max_position_size}
                        onChange={(e) => handleInputChange('trading', 'max_position_size', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Alavancagem Padrão</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.trading.default_leverage}
                        onChange={(e) => handleInputChange('trading', 'default_leverage', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Stop Loss Padrão (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.trading.stop_loss_percentage}
                        onChange={(e) => handleInputChange('trading', 'stop_loss_percentage', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Take Profit Padrão (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.trading.take_profit_percentage}
                        onChange={(e) => handleInputChange('trading', 'take_profit_percentage', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-yellow-400/30">
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">Trading Automático</h4>
                        <p className="text-blue-400 text-sm">Habilitar operações automáticas</p>
                      </div>
                      <button
                        onClick={() => handleToggle('trading', 'auto_trading_enabled')}
                        className={`${config.trading.auto_trading_enabled ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.trading.auto_trading_enabled ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">Gestão de Risco</h4>
                        <p className="text-blue-400 text-sm">Ativar controles automáticos</p>
                      </div>
                      <button
                        onClick={() => handleToggle('trading', 'risk_management_enabled')}
                        className={`${config.trading.risk_management_enabled ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.trading.risk_management_enabled ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Configurações de Segurança</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Timeout de Sessão (min)</label>
                      <input
                        type="number"
                        value={config.security.session_timeout}
                        onChange={(e) => handleInputChange('security', 'session_timeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Máx. Tentativas Login</label>
                      <input
                        type="number"
                        value={config.security.max_login_attempts}
                        onChange={(e) => handleInputChange('security', 'max_login_attempts', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Tamanho Mín. Senha</label>
                      <input
                        type="number"
                        value={config.security.password_min_length}
                        onChange={(e) => handleInputChange('security', 'password_min_length', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Rate Limit API</label>
                      <input
                        type="number"
                        value={config.security.api_rate_limit}
                        onChange={(e) => handleInputChange('security', 'api_rate_limit', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-yellow-400/30">
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">2FA Obrigatório</h4>
                        <p className="text-blue-400 text-sm">Autenticação dupla</p>
                      </div>
                      <button
                        onClick={() => handleToggle('security', 'two_factor_required')}
                        className={`${config.security.two_factor_required ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.security.two_factor_required ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">Whitelist IP</h4>
                        <p className="text-blue-400 text-sm">Restringir por IP</p>
                      </div>
                      <button
                        onClick={() => handleToggle('security', 'ip_whitelist_enabled')}
                        className={`${config.security.ip_whitelist_enabled ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.security.ip_whitelist_enabled ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                      <div>
                        <h4 className="text-yellow-400 font-bold">Criptografia</h4>
                        <p className="text-blue-400 text-sm">Dados criptografados</p>
                      </div>
                      <button
                        onClick={() => handleToggle('security', 'encryption_enabled')}
                        className={`${config.security.encryption_enabled ? 'text-green-400' : 'text-gray-400'} text-3xl`}
                      >
                        {config.security.encryption_enabled ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Configurações Financeiras</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Depósito Mínimo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.financial.minimum_deposit}
                        onChange={(e) => handleInputChange('financial', 'minimum_deposit', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Depósito Máximo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.financial.maximum_deposit}
                        onChange={(e) => handleInputChange('financial', 'maximum_deposit', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Saque Mínimo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.financial.minimum_withdrawal}
                        onChange={(e) => handleInputChange('financial', 'minimum_withdrawal', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Saque Máximo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.financial.maximum_withdrawal}
                        onChange={(e) => handleInputChange('financial', 'maximum_withdrawal', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Taxa de Saque (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.financial.withdrawal_fee}
                        onChange={(e) => handleInputChange('financial', 'withdrawal_fee', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-400 text-sm font-bold mb-2">Taxa de Comissão (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.financial.commission_rate}
                        onChange={(e) => handleInputChange('financial', 'commission_rate', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs would follow similar pattern... */}
              {activeTab === 'notifications' && (
                <div className="text-center py-12">
                  <FiBell className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <p className="text-yellow-400 text-xl font-bold">Configurações de Notificações</p>
                  <p className="text-blue-400">Em desenvolvimento...</p>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="text-center py-12">
                  <FiZap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <p className="text-yellow-400 text-xl font-bold">Integrações</p>
                  <p className="text-blue-400">Em desenvolvimento...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Configurações - CoinBitClub ⚡</p>
              <p className="text-blue-300">Sistema avançado de configuração e personalização</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
