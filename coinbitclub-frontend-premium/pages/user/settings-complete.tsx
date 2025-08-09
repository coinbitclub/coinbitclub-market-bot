import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiActivity, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiUser, FiKey, FiShield, FiMail, FiPhone, FiEdit, FiSave, FiEye, FiEyeOff,
  FiRefreshCw, FiCheck, FiAlertTriangle, FiBell, FiLock, FiUnlock, FiStar
} from 'react-icons/fi';

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  binance_api_key: string;
  binance_secret_key: string;
  bybit_api_key: string;
  bybit_secret_key: string;
  risk_level: number;
  max_daily_operations: number;
  telegram_notifications: boolean;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  auto_trading_enabled: boolean;
  emergency_stop_loss: number;
  testnet_mode: boolean;
}

export default function UserSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    binance_api_key: '',
    binance_secret_key: '',
    bybit_api_key: '',
    bybit_secret_key: '',
    risk_level: 50,
    max_daily_operations: 10,
    telegram_notifications: true,
    email_notifications: true,
    whatsapp_notifications: false,
    auto_trading_enabled: true,
    emergency_stop_loss: 5,
    testnet_mode: false
  });
  const [showKeys, setShowKeys] = useState({
    binance_secret: false,
    bybit_secret: false
  });
  const [activeTab, setActiveTab] = useState<'personal' | 'api' | 'trading' | 'notifications'>('personal');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          window.location.href = '/auth/login';
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'usuario') {
          window.location.href = '/auth/login';
          return;
        }

        setUser(parsedUser);
        await fetchSettings();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/auth/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar configurações: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/login';
  };

  const testApiConnection = async (exchange: 'binance' | 'bybit') => {
    try {
      const response = await fetch('/api/user/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exchange }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Conexão com ${exchange} bem sucedida!`);
      } else {
        alert(`Erro na conexão com ${exchange}: ${data.message}`);
      }
    } catch (error) {
      console.error(`Erro ao testar API ${exchange}:`, error);
      alert(`Erro ao testar conexão com ${exchange}`);
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
        <title>Configurações | CoinBitClub</title>
        <meta name="description" content="Configurações do Usuário - CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64`}>
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
              <a href="/user/dashboard" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/user/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
              
              <div className="border-t border-yellow-400/30 pt-4 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-6 py-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 border-2 border-transparent hover:border-red-400/50 rounded-xl transition-all duration-300 font-medium"
                >
                  <FiLogOut className="w-6 h-6 mr-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:w-0">
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
                <h2 className="text-2xl font-bold text-yellow-400">Configurações</h2>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-6 py-3 text-white bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500 font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5 mr-2" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 bg-black min-h-screen">
            {/* Tabs */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center justify-center px-6 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'personal'
                      ? 'text-yellow-400 bg-yellow-400/20 border-b-2 border-yellow-400'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                >
                  <FiUser className="w-5 h-5 mr-2" />
                  Pessoal
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={`flex items-center justify-center px-6 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'api'
                      ? 'text-yellow-400 bg-yellow-400/20 border-b-2 border-yellow-400'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                >
                  <FiKey className="w-5 h-5 mr-2" />
                  APIs
                </button>
                <button
                  onClick={() => setActiveTab('trading')}
                  className={`flex items-center justify-center px-6 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'trading'
                      ? 'text-yellow-400 bg-yellow-400/20 border-b-2 border-yellow-400'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                >
                  <FiShield className="w-5 h-5 mr-2" />
                  Trading
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center justify-center px-6 py-4 font-bold transition-all duration-300 ${
                    activeTab === 'notifications'
                      ? 'text-yellow-400 bg-yellow-400/20 border-b-2 border-yellow-400'
                      : 'text-blue-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                >
                  <FiBell className="w-5 h-5 mr-2" />
                  Notificações
                </button>
              </div>
            </div>

            {/* Personal Settings */}
            {activeTab === 'personal' && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiUser className="w-6 h-6 mr-3" />
                  Informações Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">E-mail</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({...settings, email: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-yellow-400 font-bold mb-2">Telefone/WhatsApp</label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({...settings, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors"
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="space-y-8">
                {/* Binance */}
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                      <FiKey className="w-6 h-6 mr-3" />
                      Binance API
                    </h3>
                    <button
                      onClick={() => testApiConnection('binance')}
                      className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-all duration-300"
                    >
                      <FiCheck className="w-4 h-4 mr-2" />
                      Testar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">API Key</label>
                      <input
                        type="text"
                        value={settings.binance_api_key}
                        onChange={(e) => setSettings({...settings, binance_api_key: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors"
                        placeholder="Sua Binance API Key"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showKeys.binance_secret ? "text" : "password"}
                          value={settings.binance_secret_key}
                          onChange={(e) => setSettings({...settings, binance_secret_key: e.target.value})}
                          className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors pr-12"
                          placeholder="Sua Binance Secret Key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys({...showKeys, binance_secret: !showKeys.binance_secret})}
                          className="absolute right-3 top-3 text-blue-400 hover:text-yellow-400"
                        >
                          {showKeys.binance_secret ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bybit */}
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                      <FiKey className="w-6 h-6 mr-3" />
                      Bybit API
                    </h3>
                    <button
                      onClick={() => testApiConnection('bybit')}
                      className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 rounded-lg transition-all duration-300"
                    >
                      <FiCheck className="w-4 h-4 mr-2" />
                      Testar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">API Key</label>
                      <input
                        type="text"
                        value={settings.bybit_api_key}
                        onChange={(e) => setSettings({...settings, bybit_api_key: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors"
                        placeholder="Sua Bybit API Key"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showKeys.bybit_secret ? "text" : "password"}
                          value={settings.bybit_secret_key}
                          onChange={(e) => setSettings({...settings, bybit_secret_key: e.target.value})}
                          className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white placeholder-blue-400/60 focus:border-yellow-400/70 focus:outline-none transition-colors pr-12"
                          placeholder="Sua Bybit Secret Key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys({...showKeys, bybit_secret: !showKeys.bybit_secret})}
                          className="absolute right-3 top-3 text-blue-400 hover:text-yellow-400"
                        >
                          {showKeys.bybit_secret ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Settings */}
            {activeTab === 'trading' && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiShield className="w-6 h-6 mr-3" />
                  Configurações de Trading
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Nível de Risco (%)</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={settings.risk_level}
                      onChange={(e) => setSettings({...settings, risk_level: parseInt(e.target.value)})}
                      className="w-full h-2 bg-blue-400/30 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-blue-400 mt-2">
                      <span>Conservador (1%)</span>
                      <span className="text-yellow-400 font-bold">{settings.risk_level}%</span>
                      <span>Agressivo (100%)</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Max Operações/Dia</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.max_daily_operations}
                      onChange={(e) => setSettings({...settings, max_daily_operations: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white focus:border-yellow-400/70 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Stop Loss Emergencial (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.1"
                      value={settings.emergency_stop_loss}
                      onChange={(e) => setSettings({...settings, emergency_stop_loss: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-white focus:border-yellow-400/70 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/30">
                      <div>
                        <p className="text-yellow-400 font-bold">Trading Automático</p>
                        <p className="text-blue-400 text-sm">Permitir que a IA abra posições automaticamente</p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, auto_trading_enabled: !settings.auto_trading_enabled})}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          settings.auto_trading_enabled
                            ? 'text-green-400 bg-green-400/20 border border-green-400/50'
                            : 'text-red-400 bg-red-400/20 border border-red-400/50'
                        }`}
                      >
                        {settings.auto_trading_enabled ? <FiUnlock className="w-5 h-5" /> : <FiLock className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/30">
                      <div>
                        <p className="text-yellow-400 font-bold">Modo Testnet</p>
                        <p className="text-blue-400 text-sm">Usar ambiente de testes das exchanges</p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, testnet_mode: !settings.testnet_mode})}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          settings.testnet_mode
                            ? 'text-orange-400 bg-orange-400/20 border border-orange-400/50'
                            : 'text-green-400 bg-green-400/20 border border-green-400/50'
                        }`}
                      >
                        {settings.testnet_mode ? <FiAlertTriangle className="w-5 h-5" /> : <FiStar className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiBell className="w-6 h-6 mr-3" />
                  Configurações de Notificações
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-black/50 rounded-lg border-2 border-yellow-400/30">
                    <div className="flex items-center">
                      <FiMail className="w-6 h-6 text-blue-400 mr-4" />
                      <div>
                        <p className="text-yellow-400 font-bold text-lg">Notificações por E-mail</p>
                        <p className="text-blue-400">Receber alertas e relatórios por e-mail</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, email_notifications: !settings.email_notifications})}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        settings.email_notifications
                          ? 'text-green-400 bg-green-400/20 border-2 border-green-400/50'
                          : 'text-red-400 bg-red-400/20 border-2 border-red-400/50'
                      }`}
                    >
                      {settings.email_notifications ? <FiCheck className="w-6 h-6" /> : <FiX className="w-6 h-6" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-black/50 rounded-lg border-2 border-yellow-400/30">
                    <div className="flex items-center">
                      <FiPhone className="w-6 h-6 text-blue-400 mr-4" />
                      <div>
                        <p className="text-yellow-400 font-bold text-lg">Notificações por WhatsApp</p>
                        <p className="text-blue-400">Receber alertas importantes via WhatsApp</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, whatsapp_notifications: !settings.whatsapp_notifications})}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        settings.whatsapp_notifications
                          ? 'text-green-400 bg-green-400/20 border-2 border-green-400/50'
                          : 'text-red-400 bg-red-400/20 border-2 border-red-400/50'
                      }`}
                    >
                      {settings.whatsapp_notifications ? <FiCheck className="w-6 h-6" /> : <FiX className="w-6 h-6" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-black/50 rounded-lg border-2 border-yellow-400/30">
                    <div className="flex items-center">
                      <FiBell className="w-6 h-6 text-blue-400 mr-4" />
                      <div>
                        <p className="text-yellow-400 font-bold text-lg">Notificações do Telegram</p>
                        <p className="text-blue-400">Receber sinais e operações via Telegram</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, telegram_notifications: !settings.telegram_notifications})}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        settings.telegram_notifications
                          ? 'text-green-400 bg-green-400/20 border-2 border-green-400/50'
                          : 'text-red-400 bg-red-400/20 border-2 border-red-400/50'
                      }`}
                    >
                      {settings.telegram_notifications ? <FiCheck className="w-6 h-6" /> : <FiX className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Configurações - CoinBitClub ⚡</p>
              <p className="text-blue-300">Personalize sua experiência de trading</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
